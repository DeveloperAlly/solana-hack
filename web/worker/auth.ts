import { HttpError, type Env } from './env';

export interface User { id: string; email: string }

// Supabase JWT guide: GET /auth/v1/user with the publishable key and the user's token; 200 means valid.
export async function requireUser(req: Request, env: Env): Promise<User> {
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) throw new HttpError(401, 'sign in first');
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: h },
  });
  if (!res.ok) throw new HttpError(401, 'your session has expired, sign in again');
  const u = (await res.json()) as { id?: string; email?: string };
  if (!u.id) throw new HttpError(401, 'sign in first');
  return { id: u.id, email: u.email ?? '' };
}
