/**
 * Lead (form submission) handling for POST /api/lead.
 *
 * Runs as a Cloudflare Pages Function (functions/api/lead.ts). Kept here so it can be
 * unit-tested with a fake `fetch`. The PHP version for classic hosting is hosting/php/api/lead.php. Uses plain REST calls (Telegram Bot API, Resend),
 * so the function has no runtime dependencies. Nothing is stored.
 */

export interface LeadEnv {
  TELEGRAM_BOT_TOKEN?: string;
  /** One chat id, or several separated by commas. */
  TELEGRAM_CHAT_ID?: string;
  RESEND_API_KEY?: string;
  /** Recipient address(es), comma-separated. */
  LEAD_EMAIL_TO?: string;
  /** e.g. "GeniusDev <zayavky@your-domain.com>" — the domain must be verified in Resend. */
  LEAD_EMAIL_FROM?: string;
  /** Public site URL, used to reject submissions sent from other websites. */
  SITE_URL?: string;
}

export interface LeadInput {
  name: string;
  phone: string;
  message: string;
  serviceSlug: string | null;
  serviceTitle: string | null;
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
  const serviceTitle = clean(body['serviceTitle'], 150) || null;
  const sourcePage = clean(body['sourcePage'], 200) || null;

  if (!name) errors['name'] = "Вкажіть ім'я";
  if (!phone) errors['phone'] = 'Вкажіть номер телефону, наприклад 067 123 45 67';
  if (slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors['serviceSlug'] = 'Невідома послуга';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, lead: { name, phone: phone!, message, serviceSlug: slug || null, serviceTitle, sourcePage } };
}

/**
 * Best-effort rate limit kept in the function's memory. Warm instances are reused,
 * so this stops repeated submits; it resets when the instance is recycled.
 */
const recent = new Map<string, number[]>();
export function isRateLimited(key: string, max: number, now = Date.now()): boolean {
  const since = now - WINDOW_MINUTES * 60_000;
  const hits = (recent.get(key) ?? []).filter((t) => t > since);
  const limited = hits.length >= max;
  if (!limited) hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5_000) recent.clear();
  return limited;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function handleLead(request: Request, env: LeadEnv, fetchImpl: Fetch = fetch): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  // Same-site only: reject posts from other websites.
  const origin = request.headers.get('origin');
  if (env.SITE_URL && origin) {
    const bare = (h: string) => h.toLowerCase().replace(/^www\./, '');
    const allowed = bare(new URL(env.SITE_URL).host);
    const host = bare(new URL(origin).host);
    // Cloudflare preview deployments live on *.pages.dev.
    const isPreview = host.endsWith('.pages.dev');
    if (host !== allowed && !isPreview) return json(403, { ok: false, error: 'Forbidden' });
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

  const ip =
    request.headers.get('cf-connecting-ip') ||
    (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '';
  if (isRateLimited(`phone:${lead.phone}`, MAX_PER_PHONE) || (ip && isRateLimited(`ip:${ip}`, MAX_PER_IP))) {
    return json(429, { ok: false, error: 'Заявку вже отримано. Ми скоро зателефонуємо.' });
  }

  const serviceLine = lead.serviceTitle || lead.serviceSlug || 'не вказано';

  const notifications: Promise<boolean>[] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const text = [
      '<b>Нова заявка з сайту</b>',
      `👤 ${escapeHtml(lead.name)}`,
      `📞 <a href="tel:${lead.phone}">${lead.phone}</a>`,
      `🛠 ${escapeHtml(serviceLine)}`,
      lead.message ? `💬 ${escapeHtml(lead.message)}` : null,
      lead.sourcePage ? `📄 ${escapeHtml(lead.sourcePage)}` : null,
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
      .join('')}</table>`;

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

  if (!delivered) {
    console.error('lead lost: no channel accepted it', { configuredChannels: notifications.length });
    return json(502, { ok: false, error: 'Не вдалося надіслати заявку. Зателефонуйте нам, будь ласка.' });
  }
  return json(200, { ok: true });
}
