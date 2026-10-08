import { HttpError, type Env } from './env';

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
    throw new HttpError(500, 'database error');
  }
  return (text ? JSON.parse(text) : null) as T;
}

const q = (v: string) => encodeURIComponent(v);

export const db = {
  select: <T>(env: Env, table: string, filter: string) => rest<T[]>(env, `${table}?${filter}`),
  insert: <T>(env: Env, table: string, row: unknown) =>
    rest<T[]>(env, table, { method: 'POST', body: JSON.stringify(row), prefer: 'return=representation' }),
  upsert: <T>(env: Env, table: string, row: unknown, onConflict: string) =>
    rest<T[]>(env, `${table}?on_conflict=${onConflict}`, {
      method: 'POST', body: JSON.stringify(row), prefer: 'return=representation,resolution=merge-duplicates',
    }),
  update: <T>(env: Env, table: string, filter: string, patch: unknown) =>
    rest<T[]>(env, `${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=representation' }),
  del: (env: Env, table: string, filter: string) => rest<null>(env, `${table}?${filter}`, { method: 'DELETE' }),
  eq: (col: string, v: string) => `${col}=eq.${q(v)}`,
};
