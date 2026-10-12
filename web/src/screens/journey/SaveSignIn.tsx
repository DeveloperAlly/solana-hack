import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { JourneyInlineForm } from '../../ui/domain/JourneyInlineForm';
import { useJourneyHref } from './paths';
import { useJourneyFlow, type SignInPhase } from './useJourneyFlow';
import { email, otpCode } from './validators';

/**
 * J2's sign-in, an explicit state machine (canvas board J2-Save, note n-j2-save 2): email, then sending, then code. The
 * code field exists only after an email was sent, so a code is never accepted first. `sending` is the gallery's
 * loading state. Composition only, no styles.
 */
export function SaveSignIn({ sending }: { sending: boolean }) {
  const to = useJourneyHref();
  const navigate = useNavigate();
  const { selections, actions } = useJourneyFlow('save');
  const phase: SignInPhase = sending ? 'sending' : selections.signIn;
  // INTEGRATION: supabase.auth.signInWithOtp({ email }) (backend map row "Onboard-1-SignIn"); 'sending' while it runs.
  const emailForm = (
    <JourneyInlineForm label="Email" type="email" autoComplete="email" placeholder="you@yourbrand.com" submitLabel="Email me a sign-in link" busy={phase === 'sending'} busyLabel="Sending…" validate={email} onSubmit={actions.sendEmail} />
  );
  const views: Record<SignInPhase, ReactNode> = {
    email: emailForm,
    sending: emailForm,
    code: (
      <>
        <Alert tone="success" title="Check your email">We sent a link and a code to {selections.emailSentTo}.</Alert>
        <Card variant="subtle" as="div">
          <Text variant="small"><strong>Got the code instead?</strong></Text>
          {/* INTEGRATION: supabase.auth.verifyOtp({ email, token, type: 'email' }), then the brand is created from the read. */}
          <JourneyInlineForm label="Code from the email" placeholder="8-digit code" inputMode="numeric" autoComplete="one-time-code" submitLabel="Continue" validate={otpCode} onSubmit={() => navigate(to('confirm'))} />
        </Card>
        <div><Button variant="secondary" onClick={actions.changeEmail}>Use a different email</Button></div>
      </>
    ),
  };
  return (
    <Card variant="selected" as="div">
      {views[phase]}
      <Text variant="small" tone="secondary">The email has a link and a code. Use either. No password, no wallet.</Text>
    </Card>
  );
}
