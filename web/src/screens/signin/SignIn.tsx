import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { PublicShell } from '../../ui/shells/PublicShell';
import { Alert, Button, Container, Field, Heading, Stack, Text } from '../../ui/primitives';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Onboard-1-SignIn: email, then a 6-digit code (Supabase email OTP). No wallet, no seed phrase (R26, ADR-006). */
export function SignIn() {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const next = /^\/(?!\/)/.test(params.get('next') ?? '') ? params.get('next')! : '/build';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) return <Navigate to={next} replace />;

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL.test(email.trim())) return setError('Enter an email address like you@example.com.');
    if (!supabase) return setError('Sign-in is not configured on this build.');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setBusy(false);
    if (err) return setError(err.message);
    setSent(true);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) return setError('The code is 6 digits.');
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
            <Text tone="secondary">We email you a 6-digit code. No password, no wallet.</Text>
          </Stack>
          {!supabase && <Alert tone="warning" title="Sign-in is not configured on this build" />}
          {!sent ? (
            <form onSubmit={sendCode} noValidate>
              <Stack gap={4}>
                <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
                <Button type="submit" disabled={busy}>
                  {busy ? 'Sending…' : 'Email me a code'}
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={verify} noValidate>
              <Stack gap={4}>
                <Alert tone="info">We sent a code to {email}. It can take a minute to arrive.</Alert>
                <Field
                  label="6-digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
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
