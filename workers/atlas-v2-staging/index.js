// D&D Atlas 2.0 — isolated staging API bootstrap.
// This worker intentionally exposes no character, account, or campaign data.
const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/health') {
      return json({ error: 'Not found' }, 404);
    }

    if (!env.DB) {
      return json({ status: 'unavailable' }, 503);
    }

    try {
      const row = await env.DB.prepare('SELECT 1 AS ready').first();
      if (row?.ready !== 1) throw new Error('D1 health query failed');
      return json({ service: 'dndatlas-v2-staging', status: 'ok', database: 'connected' });
    } catch (error) {
      console.error('Staging health check failed', error);
      return json({ service: 'dndatlas-v2-staging', status: 'unavailable' }, 503);
    }
  },
};
