// Daily ping (Vercel Cron, see vercel.json) so a free Supabase project is never paused for inactivity.
export default {
  async fetch(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return Response.json({ ok: false, reason: 'Supabase not configured' });
    const r = await fetch(`${url}/rest/v1/services?select=id&limit=1`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
    return Response.json({ ok: r.ok, status: r.status });
  },
};
