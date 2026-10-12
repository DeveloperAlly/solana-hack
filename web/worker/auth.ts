import { HttpError, type Env } from './env';

/** isAnonymous: a Supabase anonymous user (signInAnonymously), used to read a site before sign-in (journey J0 to J2, D1). */
export interface User { id: string; email: string; isAnonymous?: boolean }

// Supabase JWT guide: GET /auth/v1/user with the publishable key and the user's token; 200 means valid.
export async function requireUser(req: Request, env: Env): Promise<User> {
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) throw new HttpError(401, 'sign in first');
  return userFromToken(env, h.slice(7));
}

/** The user a Supabase access token belongs to. The user object carries is_anonymous (supabase.com/docs/guides/auth/users). */
export async function userFromToken(env: Env, token: string): Promise<User> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new HttpError(401, 'your session has expired, sign in again');
  const u = (await res.json()) as { id?: string; email?: string; is_anonymous?: boolean };
  if (!u.id) throw new HttpError(401, 'sign in first');
  return { id: u.id, email: u.email ?? '', isAnonymous: u.is_anonymous === true };
}

/** Actions that spend the Registrar's funds or publish under the brand need a saved account (journey J2 before J5). */
export function requirePermanent(user: User) {
  if (user.isAnonymous) throw new HttpError(403, 'save your brand with your email first');
}
