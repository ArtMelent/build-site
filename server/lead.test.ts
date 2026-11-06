// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleLead, normalizePhone, type LeadEnv } from './lead.ts';

const env: LeadEnv = {
  TELEGRAM_BOT_TOKEN: 'tg', TELEGRAM_CHAT_ID: '111,222',
  RESEND_API_KEY: 're', LEAD_EMAIL_TO: 'a@x.com', LEAD_EMAIL_FROM: 'Site <s@x.com>',
  SITE_URL: 'https://geniusdev.com.ua',
};

function fakeFetch(opts: { tgOk?: boolean; mailOk?: boolean } = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url.includes('api.telegram.org')) return new Response('{}', { status: opts.tgOk === false ? 400 : 200 });
    if (url.includes('api.resend.com')) return new Response('{}', { status: opts.mailOk === false ? 401 : 200 });
    throw new Error('unexpected ' + url);
  }) as typeof fetch;
  return { f, calls };
}

let ipSeq = 0;
const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://geniusdev.com.ua/api/lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://geniusdev.com.ua', 'x-forwarded-for': `10.0.0.${++ipSeq}`, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

let phoneSeq = 1000000;
const good = () => ({
  name: 'Іван <b>', phone: `067 ${++phoneSeq}`, message: 'Прокол 20 м',
  serviceSlug: 'prokol-pid-dorohoiu', serviceTitle: 'Прокол під дорогою', sourcePage: '/', startedAt: Date.now() - 10_000,
});

test('phone normalisation', () => {
  assert.equal(normalizePhone('067 123 45 67'), '+380671234567');
  assert.equal(normalizePhone('+38 (067) 123-45-67'), '+380671234567');
  assert.equal(normalizePhone('48 512 345 678'), '+48512345678');
  assert.equal(normalizePhone('12345'), null);
});

test('valid lead goes to 2 Telegram chats and email', async () => {
  const { f, calls } = fakeFetch();
  const r = await handleLead(req(good()), env, f);
  assert.equal(r.status, 200);
  const tg = calls.filter((c) => c.url.includes('telegram'));
  assert.equal(tg.length, 2);
  const text = JSON.parse(String(tg[0].init.body)).text;
  assert.match(text, /Іван &lt;b&gt;/, 'name is HTML-escaped');
  assert.match(text, /Прокол під дорогою/);
  assert.match(text, /\+380671/);
  assert.equal(calls.filter((c) => c.url.includes('resend')).length, 1);
});

test('missing phone → 422 with field error, nothing sent', async () => {
  const { f, calls } = fakeFetch();
  const r = await handleLead(req({ ...good(), phone: '12' }), env, f);
  assert.equal(r.status, 422);
  assert.ok((await r.json()).errors.phone);
  assert.equal(calls.length, 0);
});

test('honeypot and too-fast submits are silently dropped', async () => {
  for (const body of [{ ...good(), website: 'spam.com' }, { ...good(), startedAt: Date.now() }]) {
    const { f, calls } = fakeFetch();
    assert.equal((await handleLead(req(body), env, f)).status, 200);
    assert.equal(calls.length, 0);
  }
});

test('same phone more than 3 times in 10 minutes → 429', async () => {
  const { f } = fakeFetch();
  const body = good();
  for (let i = 0; i < 3; i++) assert.equal((await handleLead(req(body), env, f)).status, 200);
  assert.equal((await handleLead(req(body), env, f)).status, 429);
});

test('same IP more than 5 times → 429', async () => {
  const { f } = fakeFetch();
  const ip = { 'x-forwarded-for': '9.9.9.9' };
  for (let i = 0; i < 5; i++) assert.equal((await handleLead(req(good(), ip), env, f)).status, 200);
  assert.equal((await handleLead(req(good(), ip), env, f)).status, 429);
});

test('other website origin → 403; Cloudflare preview allowed', async () => {
  const { f } = fakeFetch();
  assert.equal((await handleLead(req(good(), { origin: 'https://evil.example' }), env, f)).status, 403);
  assert.equal((await handleLead(req(good(), { origin: 'https://abc123.build-site.pages.dev' }), env, f)).status, 200);
  assert.equal((await handleLead(req(good(), { origin: 'https://www.' + new URL(env.SITE_URL!).host }), env, f)).status, 200);
});

test('Telegram down but email works → 200', async () => {
  const { f } = fakeFetch({ tgOk: false });
  assert.equal((await handleLead(req(good()), env, f)).status, 200);
});

test('nothing delivered → 502 so the visitor is told to call', async () => {
  const { f } = fakeFetch({ tgOk: false, mailOk: false });
  assert.equal((await handleLead(req(good()), env, f)).status, 502);
});

test('no channels configured → 502', async () => {
  const { f } = fakeFetch();
  assert.equal((await handleLead(req(good()), {}, f)).status, 502);
});

test('bad JSON → 400, GET → 405, huge body → 413', async () => {
  const { f } = fakeFetch();
  assert.equal((await handleLead(req('{oops'), env, f)).status, 400);
  assert.equal((await handleLead(new Request('https://x/api/lead'), env, f)).status, 405);
  assert.equal((await handleLead(req({ ...good(), message: 'x'.repeat(20_000) }), env, f)).status, 413);
});
