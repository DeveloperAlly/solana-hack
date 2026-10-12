import { HttpError, type Env } from './env';

/**
 * The error a failed PostgREST call becomes, mapped code by code (https://docs.postgrest.org/en/stable/references/errors.html):
 * - PTxyz: a function of ours raised it on purpose ("RAISE errors with HTTP Status Codes"); PostgREST answers with
 *   status xyz, and a 4xx keeps that status and the function's message, written for the caller.
 * - Postgres constraint codes PostgREST maps to 4xx (23505 unique and 23503 foreign key violations: 409; 23514 check
 *   violation and 22P02 invalid text form: 400 under "other") keep their status with a fixed message that names no
 *   table, column or value.
 * - Everything else, including every 5xx and PostgREST's own PGRST codes (a malformed request from this Worker is our
 *   fault, not the caller's), is a plain 500 'database error' with no detail.
 */
const SQLSTATE: Record<string, { status: number; message: string }> = {
  '23505': { status: 409, message: 'that already exists' },
  '23503': { status: 409, message: 'that refers to something that no longer exists' },
  '23514': { status: 400, message: 'that value is not allowed' },
  '22P02': { status: 400, message: 'that value is not in the right form' },
};
export function dbError(status: number, code: string | undefined, body: string): HttpError {
  if (code && /^PT4\d\d$/.test(code) && status === Number(code.slice(2))) {
    let message = 'the request was refused';
    try { const m = (JSON.parse(body) as { message?: unknown }).message; if (typeof m === 'string' && m) message = m.slice(0, 300); } catch { /* keep the default */ }
    return new HttpError(status, message);
  }
  const known = code ? SQLSTATE[code] : undefined;
  if (known && status >= 400 && status < 500) return new HttpError(known.status, known.message);
  return new HttpError(500, 'database error');
}

// PostgREST with the secret key on the apikey header (Supabase API keys guide: keys go on apikey, not Bearer).
async function rest<T>(env: Env, path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      'content-type': 'application/json',
      ...(init.prefer ? { prefer: init.prefer } : {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    // Logging policy: table, method, status and PostgREST error code only. Filters and response bodies are never logged.
    let code: string | undefined;
    try { code = (JSON.parse(text) as { code?: string }).code; } catch { /* not JSON */ }
    console.error('db error', { table: path.split('?')[0], method: init.method ?? 'GET', status: res.status, code });
    throw dbError(res.status, code, text);
  }
  return (text ? JSON.parse(text) : null) as T;
}

const q = (v: string) => encodeURIComponent(v);

export const db = {
  select: <T>(env: Env, table: string, filter: string) => rest<T[]>(env, `${table}?${filter}`),
  /**
   * Every matching row, read in pages of 200 until a short page, so a server-side row cap cannot silently drop rows.
   * The filter must carry a total order (for example order=created_at.asc,id.asc) so pages neither skip nor repeat.
   */
  selectAll: async <T>(env: Env, table: string, filter: string) => {
    const out: T[] = [];
    for (let offset = 0; ; offset += 200) {
      const page = await rest<T[]>(env, `${table}?${filter}&limit=200&offset=${offset}`);
      out.push(...page);
      if (page.length < 200) return out;
    }
  },
  insert: <T>(env: Env, table: string, row: unknown) =>
    rest<T[]>(env, table, { method: 'POST', body: JSON.stringify(row), prefer: 'return=representation' }),
  upsert: <T>(env: Env, table: string, row: unknown, onConflict: string) =>
    rest<T[]>(env, `${table}?on_conflict=${onConflict}`, {
      method: 'POST', body: JSON.stringify(row), prefer: 'return=representation,resolution=merge-duplicates',
    }),
  /** Inserts rows, skipping any whose conflict key already exists (PostgREST resolution=ignore-duplicates). */
  insertNew: <T>(env: Env, table: string, rows: unknown, onConflict: string) =>
    rest<T[]>(env, `${table}?on_conflict=${onConflict}`, {
      method: 'POST', body: JSON.stringify(rows), prefer: 'return=representation,resolution=ignore-duplicates',
    }),
  update: <T>(env: Env, table: string, filter: string, patch: unknown) =>
    rest<T[]>(env, `${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=representation' }),
  del: (env: Env, table: string, filter: string) => rest<null>(env, `${table}?${filter}`, { method: 'DELETE' }),
  /** Calls a Postgres function through PostgREST (POST /rest/v1/rpc/name with named arguments). */
  rpc: <T>(env: Env, fn: string, args: Record<string, unknown>) => rest<T>(env, `rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) }),
  eq: (col: string, v: string) => `${col}=eq.${q(v)}`,
};
