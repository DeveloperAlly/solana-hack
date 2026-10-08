export interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  REGISTRAR_KEY: string; // secret: 64-byte devnet keypair as a JSON array
  RPC_URL: string; // secret: devnet RPC endpoint (G-RPC)
  SELFTEST_TOKEN: string; // secret: set fresh by every deploy run
  SUPABASE_URL: string; // project URL (not secret)
  SUPABASE_PUBLISHABLE_KEY: string; // browser-safe key, used to check user tokens with Supabase Auth
  SUPABASE_SECRET_KEY: string; // secret: server-only, bypasses RLS
  OPENROUTER_API_KEY: string; // secret
  OPENROUTER_MODEL?: string; // optional model slug; default openrouter/auto
  PUBLIC_LIMITER?: { limit(o: { key: string }): Promise<{ success: boolean }> }; // Workers rate limiting binding
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * A log-safe view of an error: class, @solana/kit code, HTTP status, and the message with anything that
 * looks like a credential removed (URL paths and queries, unknown hosts, api-key/token params, long base58 runs).
 * Defensive: we do not rely on any library's error format, so any URL or key-shaped text in a message is treated as
 * possibly secret (the RPC URL itself carries the provider key) and stripped before Workers Logs can retain it.
 */
export function safeError(e: unknown) {
  const err = e as { name?: unknown; message?: unknown; context?: { statusCode?: unknown; __code?: unknown } };
  const message = typeof err?.message === 'string' ? err.message : String(e);
  return {
    name: typeof err?.name === 'string' ? err.name : 'Error',
    solanaErrorCode: typeof err?.context?.__code === 'number' ? err.context.__code : undefined,
    status: typeof err?.context?.statusCode === 'number' ? err.context.statusCode : undefined,
    message: message
      // Keep only the host, and only for known providers: keys can sit in the path, the query or a custom subdomain.
      .replace(/https?:\/\/[^\s"'<>]+/gi, (u) => { const h = rpcHostLabel(u); return h === 'custom' || h === 'invalid URL' ? '[url]' : `https://${h}/[path]`; })
      .replace(/(api[-_]?key|token|secret|key)=([^&\s"']+)/gi, '$1=[redacted]')
      .replace(/\b[1-9A-HJ-NP-Za-km-z]{60,}\b/g, '[redacted]')
      .slice(0, 500),
  };
}

// Exact public hostnames only: a provider subdomain can itself carry a credential (https://<key>.helius-rpc.com).
const KNOWN_RPC_HOSTS = new Set(['devnet.helius-rpc.com', 'mainnet.helius-rpc.com', 'api.devnet.solana.com', 'api.testnet.solana.com', 'api.mainnet-beta.solana.com']);
/** The RPC host only when it is a known provider (whose host carries no credential), else "custom". */
export function rpcHostLabel(rpcUrl: string) {
  try {
    const h = new URL(rpcUrl).hostname;
    return KNOWN_RPC_HOSTS.has(h) ? h : 'custom';
  } catch {
    return 'invalid URL';
  }
}
