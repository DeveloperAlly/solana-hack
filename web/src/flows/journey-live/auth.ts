import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

const handoffKey = 'jamjam.journey.authHandoff';
interface Handoff { email: string; kind: 'email_change' | 'email'; anonymousToken?: string; brandId?: string }
const client = () => { if (!supabase) throw new Error('Email sign-in is not configured.'); return supabase; };
export async function ensureJourneySession() {
  const auth = client().auth;
  const { data, error } = await auth.getSession();
  if (error) throw error;
  if (data.session) return data.session;
  const result = await auth.signInAnonymously();
  if (result.error) throw result.error;
  if (!result.data.session) throw new Error('Could not start your reading session.');
  return result.data.session;
}
/** Supabase anonymous-user conversion: updateUser + email_change OTP; existing identity uses server claim. */
export async function sendJourneyEmail(email: string, brandId?: string) {
  const auth = client().auth;
  const session = await ensureJourneySession();
  let handoff: Handoff = { email, kind: 'email' };
  if (session.user.is_anonymous) {
    const refreshed = await auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    const token = refreshed.data.session?.access_token;
    if (!token) throw new Error('Your reading session expired. Please reload and try again.');
    const linked = await auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/journey/save` });
    if (!linked.error) handoff = { email, kind: 'email_change' };
    else {
      // Only an existing-email conflict warrants changing auth flows. Configuration/network errors remain visible.
      if (!['email_exists', 'user_already_exists', 'identity_already_exists'].includes(linked.error.code || '')) throw linked.error;
      handoff = { email, kind: 'email', anonymousToken: token };
      const sent = await auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/journey/save` } });
      if (sent.error) throw sent.error;
    }
  } else {
    const sent = await auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/journey/save` } });
    if (sent.error) throw sent.error;
  }
  sessionStorage.setItem(handoffKey, JSON.stringify({ ...handoff, ...(brandId ? { brandId } : {}) }));
}
export function pendingJourneyEmail(): string {
  try { return (JSON.parse(sessionStorage.getItem(handoffKey) || 'null') as Handoff | null)?.email || ''; } catch { return ''; }
}
export function pendingJourneyBrand(): string | undefined {
  try { return (JSON.parse(sessionStorage.getItem(handoffKey) || 'null') as Handoff | null)?.brandId; } catch { return undefined; }
}
let completion: Promise<void> | null = null;
export async function finishJourneySignIn(code?: string) {
  const auth = client().auth;
  const handoff = JSON.parse(sessionStorage.getItem(handoffKey) || 'null') as Handoff | null;
  if (code) {
    if (!handoff) throw new Error('Request a new email before entering a code.');
    const result = await auth.verifyOtp({ email: handoff.email, token: code, type: handoff.kind });
    if (result.error) throw result.error;
  }
  if (completion) return completion;
  const task = (async () => {
    const result = await auth.getUser();
    if (result.error) throw result.error;
    if (!result.data.user || result.data.user.is_anonymous) throw new Error('Confirm your email to save your brand.');
    if (handoff?.anonymousToken) await api('/me/claim', { body: { anonymousToken: handoff.anonymousToken } });
    sessionStorage.removeItem(handoffKey);
  })();
  completion = task;
  try { await task; } finally { if (completion === task) completion = null; }
}
