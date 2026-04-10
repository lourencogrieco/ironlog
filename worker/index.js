// IronLog — Cloudflare Worker proxy para Anthropic API
// Deploy: cole este código em workers.cloudflare.com → Create Worker
// Depois adicione o secret: Settings → Variables → ANTHROPIC_API_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY não configurada no Worker.' } }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    try {
      const body = await request.json();

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      const data = await upstream.json();

      return new Response(JSON.stringify(data), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: { message: e.message || 'Erro interno' } }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }
  },
};
