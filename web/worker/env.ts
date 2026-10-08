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
 * looks like a credential removed (URL query strings, api-key/token params, long base58/hex runs).
 * RPC errors can embed the provider URL and its API key; Workers Logs must never retain that.
 */
export function safeError(e: unknown) {
  const err = e as { name?: unknown; message?: unknown; context?: { statusCode?: unknown; __code?: unknown } };
  const message = typeof err?.message === 'string' ? err.message : String(e);
  return {
    name: typeof err?.name === 'string' ? err.name : 'Error',
    solanaErrorCode: typeof err?.context?.__code === 'number' ? err.context.__code : undefined,
    status: typeof err?.context?.statusCode === 'number' ? err.context.statusCode : undefined,
    message: message
      .replace(/https?:\/\/[^\s"'<>]+/g, (u) => { try { const x = new URL(u); return `${x.protocol}//${x.host}${x.pathname}`; } catch { return '[url]'; } })
      .replace(/(api[-_]?key|token|secret|key)=([^&\s"']+)/gi, '$1=[redacted]')
      .replace(/\b[1-9A-HJ-NP-Za-km-z]{60,}\b/g, '[redacted]')
      .slice(0, 500),
  };
}

const KNOWN_RPC_HOSTS = /(^|\.)(helius-rpc\.com|solana\.com)$/;
/** The RPC host only when it is a known provider (whose host carries no credential), else "custom". */
export function rpcHostLabel(rpcUrl: string) {
  try {
    const h = new URL(rpcUrl).hostname;
    return KNOWN_RPC_HOSTS.test(h) ? h : 'custom';
  } catch {
    return 'invalid URL';
  }
}
