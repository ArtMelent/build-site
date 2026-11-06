// Run: node --experimental-strip-types --test server/lead.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleLead, normalizePhone, type LeadEnv } from './lead.ts';

const env: LeadEnv = {
  SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'srv',
  TELEGRAM_BOT_TOKEN: 'tg', TELEGRAM_CHAT_ID: '111,222',
  RESEND_API_KEY: 're', LEAD_EMAIL_TO: 'a@x.com', LEAD_EMAIL_FROM: 'Site <s@x.com>',
  SITE_URL: 'https://geniusdev.com.ua',
};

function fakeFetch(opts: { recent?: number; insertOk?: boolean; tgOk?: boolean; mailOk?: boolean } = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url.includes('/rest/v1/leads?') && init.method === 'HEAD')
      return new Response(null, { status: 200, headers: { 'content-range': `*/${opts.recent ?? 0}` } });
    if (url.includes('/rest/v1/services?')) return Response.json([{ id: 'svc-1', title: 'Прокол під дорогою' }]);
    if (url.endsWith('/rest/v1/leads')) return new Response(null, { status: opts.insertOk === false ? 500 : 201 });
    if (url.includes('api.telegram.org')) return new Response('{}', { status: opts.tgOk === false ? 400 : 200 });
    if (url.includes('api.resend.com')) return new Response('{}', { status: opts.mailOk === false ? 401 : 200 });
    throw new Error('unexpected ' + url);
  }) as typeof fetch;
  return { f, calls };
}

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://geniusdev.com.ua/api/lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://geniusdev.com.ua', 'x-forwarded-for': '1.2.3.4', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const good = { name: 'Іван <b>', phone: '067 123-45-67', message: 'Прокол 20 м', serviceSlug: 'prokol-pid-dorohoiu', sourcePage: '/', startedAt: Date.now() - 10_000 };

test('phone normalisation', () => {
  assert.equal(normalizePhone('067 123 45 67'), '+380671234567');
  assert.equal(normalizePhone('+38 (067) 123-45-67'), '+380671234567');
  assert.equal(normalizePhone('48 512 345 678'), '+48512345678');
  assert.equal(normalizePhone('12345'), null);
});

test('valid lead is saved and sent to 2 Telegram chats and email', async () => {
  const { f, calls } = fakeFetch();
  const r = await handleLead(req(good), env, f);
  assert.equal(r.status, 200);
  const insert = calls.find((c) => c.url.endsWith('/rest/v1/leads'))!;
  const row = JSON.parse(String(insert.init.body));
  assert.equal(row.phone, '+380671234567');
  assert.equal(row.service_id, 'svc-1');
  assert.equal(row.service_title, 'Прокол під дорогою');
  assert.match(row.ip_hash, /^[0-9a-f]{64}$/);
  assert.notEqual(row.ip_hash.includes('1.2.3.4'), true);
  const tg = calls.filter((c) => c.url.includes('telegram'));
  assert.equal(tg.length, 2);
  const tgText = JSON.parse(String(tg[0].init.body)).text;
  assert.match(tgText, /Іван &lt;b&gt;/, 'name is HTML-escaped');
  assert.match(tgText, /admin\/leads/);
  assert.equal(calls.filter((c) => c.url.includes('resend')).length, 1);
});

test('missing phone → 422 with field error, nothing sent', async () => {
  const { f, calls } = fakeFetch();
  const r = await handleLead(req({ ...good, phone: '12' }), env, f);
  assert.equal(r.status, 422);
  assert.ok((await r.json()).errors.phone);
  assert.equal(calls.length, 0);
});

test('honeypot and too-fast submits are silently dropped', async () => {
  for (const body of [{ ...good, website: 'spam.com' }, { ...good, startedAt: Date.now() }]) {
    const { f, calls } = fakeFetch();
    const r = await handleLead(req(body), env, f);
    assert.equal(r.status, 200);
    assert.equal(calls.length, 0);
  }
});

test('rate limit → 429', async () => {
  const { f, calls } = fakeFetch({ recent: 3 });
  const r = await handleLead(req(good), env, f);
  assert.equal(r.status, 429);
  assert.ok(!calls.some((c) => c.url.endsWith('/rest/v1/leads')));
});

test('other website origin → 403; vercel preview allowed', async () => {
  const { f } = fakeFetch();
  assert.equal((await handleLead(req(good, { origin: 'https://evil.example' }), env, f)).status, 403);
  assert.equal((await handleLead(req(good, { origin: 'https://build-site-git-x.vercel.app' }), env, f)).status, 200);
});

test('DB down but Telegram works → still 200, message warns', async () => {
  const { f, calls } = fakeFetch({ insertOk: false });
  const r = await handleLead(req(good), env, f);
  assert.equal(r.status, 200);
  assert.match(JSON.parse(String(calls.find((c) => c.url.includes('telegram'))!.init.body)).text, /Не вдалося зберегти/);
});

test('nothing delivered → 502 so the visitor is told to call', async () => {
  const { f } = fakeFetch({ insertOk: false, tgOk: false, mailOk: false });
  assert.equal((await handleLead(req(good), env, f)).status, 502);
});

test('bad JSON → 400, GET → 405, huge body → 413', async () => {
  const { f } = fakeFetch();
  assert.equal((await handleLead(req('{oops'), env, f)).status, 400);
  assert.equal((await handleLead(new Request('https://x/api/lead'), env, f)).status, 405);
  assert.equal((await handleLead(req({ ...good, message: 'x'.repeat(20_000) }), env, f)).status, 413);
});

test('only Telegram configured (no DB) still works', async () => {
  const { f } = fakeFetch();
  const r = await handleLead(req(good), { TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' }, f);
  assert.equal(r.status, 200);
});
