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
