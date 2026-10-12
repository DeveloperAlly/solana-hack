import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { PublicShell } from '../../ui/shells/PublicShell';
import { Alert, Button, Container, Field, Heading, Stack, Text } from '../../ui/primitives';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function linkError(hash: string): string | null {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  if (!p.get('error')) return null;
  return p.get('error_code') === 'otp_expired'
    ? 'That sign-in link has expired or was already used. Send a new one.'
    : 'That sign-in link did not work. Send a new one.';
}

/**
 * Onboard-1-SignIn: email, then either the emailed link or the code in it (Supabase email OTP). The project sets the code length; Supabase allows 6 to 10 digits
 * (mailer_otp_length, minimum 6, maximum 10, in UpdateAuthConfigBody of
 * https://github.com/supabase/supabase/blob/master/apps/docs/spec/api_v1_openapi.json). No wallet, no seed phrase (R26, ADR-006).
 * The email (custom SMTP and template set by .github/workflows/supabase-auth-config.yml) carries both. The link
 * returns here, the client reads the session from the URL fragment (implicit flow, the supabase-js default), and the redirect below fires.
 */
export function SignIn() {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const next = /^\/(?!\/)/.test(params.get('next') ?? '') ? params.get('next')! : '/home';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  // An expired or reused link comes back with the error in the fragment (Supabase redirect-URL docs, Error handling).
  const [error, setError] = useState<string | null>(() => linkError(window.location.hash));

  if (session) return <Navigate to={next} replace />;

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL.test(email.trim())) return setError('Enter an email address like you@example.com.');
    if (!supabase) return setError('Sign-in is not configured on this build.');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/sign-in?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (err) return setError(err.message);
    setSent(true);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6,10}$/.test(code.trim())) return setError('Enter the code from the email. It is 6 to 10 digits.');
    if (!supabase) return;
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (err) return setError('That code did not work. Check it, or send a new one.');
    navigate(next, { replace: true });
  }

  return (
    <PublicShell>
      <Container width="reading">
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading level={1}>Sign in to build your brand</Heading>
            <Text tone="secondary">We email you a sign-in link. No password, no wallet.</Text>
          </Stack>
          {!supabase && <Alert tone="warning" title="Sign-in is not configured on this build" />}
          {!sent ? (
            <form onSubmit={sendCode} noValidate>
              <Stack gap={4}>
                <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
                <Button type="submit" disabled={busy}>
                  {busy ? 'Sending…' : 'Email me a sign-in link'}
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={verify} noValidate>
              <Stack gap={4}>
                <Alert tone="info">We sent an email to {email}. Open the link in it on this device. It can take a minute to arrive. Or enter the code from the email here.</Alert>
                <Field
                  label="Code from the email"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  error={error}
                />
                <Stack direction="row" gap={3} wrap>
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Checking…' : 'Sign in'}
                  </Button>
                  <Button variant="secondary" onClick={() => { setSent(false); setCode(''); setError(null); }}>
                    Use a different email
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Stack>
      </Container>
    </PublicShell>
  );
}
