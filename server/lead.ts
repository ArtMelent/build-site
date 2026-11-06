/**
 * Lead (form submission) handling for POST /api/lead.
 *
 * Kept outside `api/` so it is not deployed as its own function and can be
 * unit-tested with a fake `fetch`. Uses plain REST calls (Supabase PostgREST,
 * Telegram Bot API, Resend) so the function has no runtime dependencies.
 */

export interface LeadEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  /** One chat id, or several separated by commas. */
  TELEGRAM_CHAT_ID?: string;
  RESEND_API_KEY?: string;
  /** Recipient address(es), comma-separated. */
  LEAD_EMAIL_TO?: string;
  /** e.g. "GeniusDev <zayavky@your-domain.com>" — the domain must be verified in Resend. */
  LEAD_EMAIL_FROM?: string;
  /** Public site URL, used for the admin link in notifications and the origin check. */
  SITE_URL?: string;
  /** Extra salt for hashing IPs. Falls back to the service-role key. */
  LEAD_IP_SALT?: string;
}

export interface LeadInput {
  name: string;
  phone: string;
  message: string;
  serviceSlug: string | null;
  sourcePage: string | null;
}

type Fetch = typeof fetch;

const MAX_BODY_BYTES = 10_000;
const MIN_FILL_MS = 2_000; // humans don't fill a form in under 2 seconds
const WINDOW_MINUTES = 10;
const MAX_PER_PHONE = 3;
const MAX_PER_IP = 5;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** Normalises Ukrainian numbers to +380XXXXXXXXX; leaves other valid numbers as +digits. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (/^0\d{9}$/.test(digits)) return `+38${digits}`;
  if (/^380\d{9}$/.test(digits)) return `+${digits}`;
  if (/^\d{10,15}$/.test(digits)) return `+${digits}`;
  return null;
}

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';

export function validate(body: Record<string, unknown>):
  | { ok: true; lead: LeadInput }
  | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = clean(body['name'], 100);
  const phone = normalizePhone(clean(body['phone'], 30));
  const message = clean(body['message'], 2000);
  const slug = clean(body['serviceSlug'], 120);
  const sourcePage = clean(body['sourcePage'], 200) || null;

  if (!name) errors['name'] = "Вкажіть ім'я";
  if (!phone) errors['phone'] = 'Вкажіть номер телефону, наприклад 067 123 45 67';
  if (slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors['serviceSlug'] = 'Невідома послуга';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, lead: { name, phone: phone!, message, serviceSlug: slug || null, sourcePage } };
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function handleLead(request: Request, env: LeadEnv, fetchImpl: Fetch = fetch): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  // Same-site only: reject posts from other websites.
  const origin = request.headers.get('origin');
  if (env.SITE_URL && origin) {
    const allowed = new URL(env.SITE_URL).host;
    const host = new URL(origin).host;
    const isVercelPreview = host.endsWith('.vercel.app');
    if (host !== allowed && !isVercelPreview) return json(403, { ok: false, error: 'Forbidden' });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { ok: false, error: 'Too large' });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object') throw new Error();
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' });
  }

  // Bots: a hidden "website" field humans never see, and impossibly fast submits.
  // Answer "ok" so the bot doesn't learn it was caught.
  const startedAt = Number(body['startedAt']);
  if (clean(body['website'], 200) || (Number.isFinite(startedAt) && Date.now() - startedAt < MIN_FILL_MS)) {
    return json(200, { ok: true });
  }

  const result = validate(body);
  if (!result.ok) return json(422, { ok: false, errors: result.errors });
  const lead = result.lead;

  const hasDb = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const db = (path: string, init: RequestInit = {}) =>
    fetchImpl(`${env.SUPABASE_URL!.replace(/\/$/, '')}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip') || '';
  const ipHash = ip ? await sha256(`${env.LEAD_IP_SALT ?? env.SUPABASE_SERVICE_ROLE_KEY ?? ''}:${ip}`) : null;

  let service: { id: string; title: string } | null = null;
  let saved = false;

  if (hasDb) {
    try {
      // Rate limit by phone and by IP over the last few minutes.
      const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
      const count = async (filter: string) => {
        const r = await db(`leads?select=id&created_at=gte.${encodeURIComponent(since)}&${filter}`, {
          method: 'HEAD',
          headers: { prefer: 'count=exact' },
        });
        return Number((r.headers.get('content-range') ?? '*/0').split('/')[1]) || 0;
      };
      const [byPhone, byIp] = await Promise.all([
        count(`phone=eq.${encodeURIComponent(lead.phone)}`),
        ipHash ? count(`ip_hash=eq.${ipHash}`) : Promise.resolve(0),
      ]);
      if (byPhone >= MAX_PER_PHONE || byIp >= MAX_PER_IP) {
        return json(429, { ok: false, error: 'Заявку вже отримано. Ми скоро зателефонуємо.' });
      }

      if (lead.serviceSlug) {
        const r = await db(`services?select=id,title&slug=eq.${lead.serviceSlug}&limit=1`);
        if (r.ok) service = ((await r.json()) as { id: string; title: string }[])[0] ?? null;
      }

      const r = await db('leads', {
        method: 'POST',
        headers: { prefer: 'return=minimal' },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          message: lead.message,
          service_id: service?.id ?? null,
          service_title: service?.title ?? null,
          source_page: lead.sourcePage,
          ip_hash: ipHash,
        }),
      });
      saved = r.ok;
      if (!r.ok) console.error('lead insert failed', r.status, await r.text());
    } catch (e) {
      console.error('lead db error', e);
    }
  }

  const adminUrl = env.SITE_URL ? `${env.SITE_URL.replace(/\/$/, '')}/admin/leads` : null;
  const serviceLine = service?.title ?? (lead.serviceSlug ? lead.serviceSlug : 'не вказано');

  const notifications: Promise<boolean>[] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const text = [
      '<b>Нова заявка з сайту</b>',
      `👤 ${escapeHtml(lead.name)}`,
      `📞 <a href="tel:${lead.phone}">${lead.phone}</a>`,
      `🛠 ${escapeHtml(serviceLine)}`,
      lead.message ? `💬 ${escapeHtml(lead.message)}` : null,
      lead.sourcePage ? `📄 ${escapeHtml(lead.sourcePage)}` : null,
      !saved && hasDb ? '⚠️ Не вдалося зберегти в базі — передзвоніть за номером вище.' : null,
      adminUrl && saved ? `<a href="${adminUrl}">Відкрити в адмінці</a>` : null,
    ].filter(Boolean).join('\n');

    for (const chatId of env.TELEGRAM_CHAT_ID.split(',').map((s) => s.trim()).filter(Boolean)) {
      notifications.push(
        fetchImpl(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
        }).then(async (r) => (r.ok ? true : (console.error('telegram', r.status, await r.text()), false))),
      );
    }
  }

  if (env.RESEND_API_KEY && env.LEAD_EMAIL_TO && env.LEAD_EMAIL_FROM) {
    const rows: [string, string][] = [
      ["Ім'я", lead.name],
      ['Телефон', lead.phone],
      ['Послуга', serviceLine],
      ['Повідомлення', lead.message || '—'],
      ['Сторінка', lead.sourcePage || '—'],
    ];
    const html = `<h2 style="font-family:sans-serif">Нова заявка з сайту</h2>
<table style="font-family:sans-serif;font-size:15px;border-collapse:collapse">${rows
      .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#666">${k}</td><td style="padding:6px 0">${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`)
      .join('')}</table>${adminUrl ? `<p style="font-family:sans-serif"><a href="${adminUrl}">Відкрити заявки в адмінці</a></p>` : ''}`;

    notifications.push(
      fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: env.LEAD_EMAIL_FROM,
          to: env.LEAD_EMAIL_TO.split(',').map((s) => s.trim()).filter(Boolean),
          subject: `Заявка: ${lead.name}, ${lead.phone}`,
          html,
        }),
      }).then(async (r) => (r.ok ? true : (console.error('resend', r.status, await r.text()), false))),
    );
  }

  const delivered = (await Promise.allSettled(notifications)).some((r) => r.status === 'fulfilled' && r.value);

  if (!saved && !delivered) {
    console.error('lead lost: no channel accepted it', { configured: { db: hasDb, notifications: notifications.length } });
    return json(502, { ok: false, error: 'Не вдалося надіслати заявку. Зателефонуйте нам, будь ласка.' });
  }
  return json(200, { ok: true });
}
