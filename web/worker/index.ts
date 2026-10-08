// Waterlily Worker: serves the SPA from static assets and answers /api/* (wrangler.jsonc run_worker_first).
import { registrarFromSecret, registerKitAttestation } from './registry';
import { handleApi } from './api';
import { HttpError, json as jsonOut, type Env as AppEnv } from './env';

type Env = AppEnv;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Compare digests so the check takes the same time whatever the input.
async function tokenOk(header: string | null, expected: string | undefined) {
  if (!expected || !header?.startsWith('Bearer ')) return false;
  const [a, b] = await Promise.all([sha256Hex(header.slice(7)), sha256Hex(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);

    if (url.pathname === '/api/health' && req.method === 'GET') {
      const registrar = env.REGISTRAR_KEY ? (await registrarFromSecret(env.REGISTRAR_KEY)).address : null;
      return json({ ok: true, registrar, rpcConfigured: !!env.RPC_URL });
    }

    // S0 done-when (3): one Registrar-signed devnet registration. Deploy-run only (token), so the
    // public cannot spend the Registrar's SOL. The record carries hashes and ids only (R27).
    if (url.pathname === '/api/registry/selftest') {
      if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
      if (!(await tokenOk(req.headers.get('authorization'), env.SELFTEST_TOKEN))) return json({ error: 'unauthorized' }, 401);
      const at = new Date().toISOString();
      const hash = 'sha256:' + (await sha256Hex(JSON.stringify({ kind: 's0-selftest', at })));
      try {
        const registrar = await registrarFromSecret(env.REGISTRAR_KEY);
        const out = await registerKitAttestation(env.RPC_URL, registrar, {
          brand_id: 'waterlily', hash, kit_version: '0', approver: 's0-selftest', domain_verified: 'false',
        });
        return json({ ok: true, at, ...out });
      } catch (e) {
        // Full detail stays in Worker logs; the response is public (it is posted to issue #4), so it
        // carries only a stable message and, if present, the upstream HTTP status (G-RPC diagnosis).
        console.error('registry selftest failed', e);
        const status = (e as { context?: { statusCode?: unknown } })?.context?.statusCode;
        return json({ ok: false, at, error: 'registration failed', upstreamStatus: typeof status === 'number' ? status : null }, 502);
      }
    }
    try {
      const res = await handleApi(req, env, url);
      if (res) return res;
    } catch (e) {
      if (e instanceof HttpError) return jsonOut({ error: e.message }, e.status);
      console.error('api error', e);
      return jsonOut({ error: 'something went wrong' }, 500);
    }
    return json({ error: 'not found' }, 404);
  },
};
