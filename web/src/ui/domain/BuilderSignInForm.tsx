import { useState, type FormEvent } from 'react';
import { Alert } from '../primitives/Alert';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Text } from '../primitives/Text';
import { isEmail, isSignInCode } from '../../lib/validation';
import styles from './BuilderSignInForm.module.css';

export type SignInPhase = 'ready' | 'sending' | 'expired';

export interface BuilderSignInFormProps {
  defaultEmail?: string;
  /** "Didn't get it? Resend in 0:24". */
  resendNote: string;
  /** ready (default), sending (the Send code request is in flight) or expired (the emailed link was old or used). */
  phase?: SignInPhase;
  /** Error shown on the code at first (the "wrong code" state). */
  initialCodeError?: string;
  /** Called with the email once the code passes the client check. */
  onVerified: (email: string) => void;
}

const EMAIL_ERROR = 'Enter an email address like you@example.com.';
const CODE_ERROR = 'Enter the code from the email. It is 6 to 10 digits.';

/**
 * Email-code sign-in (canvas board Onboard-1-SignIn; notes n-ob1): email, Send code, then the code, all checked on the
 * client. One email carries a link and a code; the app accepts 6 to 10 digits (PR #27). States: sending, wrong code,
 * expired or used link.
 */
export function BuilderSignInForm({ defaultEmail = '', resendNote, phase = 'ready', initialCodeError, onVerified }: BuilderSignInFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(initialCodeError ?? null);
  const sending = phase === 'sending';

  function send(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) return setEmailError(EMAIL_ERROR);
    setEmailError(null);
    // INTEGRATION: supabase.auth.signInWithOtp({ email }) (backend map §4, row Onboard-1-SignIn).
    setSentTo(email.trim());
  }
  function verify(e: FormEvent) {
    e.preventDefault();
    if (!isSignInCode(code)) return setCodeError(CODE_ERROR);
    setCodeError(null);
    // INTEGRATION: supabase.auth.verifyOtp({ email, token: code, type: 'email' }), then POST /api/profile (backend map §4).
    onVerified(sentTo ?? email.trim());
  }

  return (
    <div className={styles.form}>
      {phase === 'expired' && <Alert tone="danger" title="That sign-in link has expired or was already used">Send a new code below.</Alert>}
      <form onSubmit={send} noValidate className={styles.step}>
        <Field label="Work email" type="email" autoComplete="email" value={email} onChange={(e: { target: { value: string } }) => setEmail(e.target.value)} error={emailError} />
        <Button type="submit" variant="secondary" disabled={sending}>{sending ? 'Sending…' : 'Send code'}</Button>
        {sentTo && <Text variant="small" role="status">Code sent to {sentTo}.</Text>}
      </form>
      <form onSubmit={verify} noValidate className={`${styles.step} ${styles.code}`}>
        <Field label="Enter the code we sent" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={(e: { target: { value: string } }) => setCode(e.target.value)} error={codeError} hint={resendNote} />
        <Button type="submit">Continue</Button>
      </form>
    </div>
  );
}
