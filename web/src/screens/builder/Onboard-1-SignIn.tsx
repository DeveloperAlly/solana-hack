/*
 * Data contract: Onboard-1-SignIn (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Onboard-1-SignIn, note n-ob1;
 * issue #50). Backend map §4, row "Onboard-1-SignIn". Shape: SignInData in ./types.
 *
 * | Field       | Source                                                                         | Empty                |
 * |-------------|--------------------------------------------------------------------------------|----------------------|
 * | email       | Client: what the visitor types; prefilled only when returning from a link      | blank field          |
 * | resendNote  | Client: resend countdown after supabase.auth.signInWithOtp                     | never empty          |
 * | codeError   | supabase.auth.verifyOtp error (wrong or expired code)                          | no error shown       |
 *
 * States: success (ready), loading ("Sending…"), error (expired or used link, wrong code inline).
 * Continue runs the client check (6 to 10 digits), records the email in the flow (the approver on gates and the kit) and
 * moves to Onboard-2-Domain. The live /sign-in route is unchanged.
 */
import { useNavigate } from 'react-router';
import { Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { BuilderSignInForm, type SignInPhase } from '../../ui/domain/BuilderSignInForm';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { BuilderStep } from './BuilderStep';
import { useBuilderFlow } from './useBuilderFlow';
import type { SignInData } from './types';

const phaseFor: Partial<Record<ScreenState, SignInPhase>> = { loading: 'sending', error: 'expired' };

export function Onboard1SignIn({ data, state = 'success' }: { data: SignInData; state?: ScreenState }) {
  const navigate = useNavigate();
  const { next, signIn } = useBuilderFlow('signIn');
  return (
    <BuilderStep flow="signIn" title="Sign in with email" intro="We'll email you a sign-in link and a code; either works. Your account is set up automatically. Nothing to install, no passwords or keys to keep.">
      <Card as="div">
        <BuilderSignInForm
          key={state}
          defaultEmail={data.email}
          resendNote={data.resendNote}
          phase={phaseFor[state] ?? 'ready'}
          initialSentTo={state === 'error' ? data.email : undefined}
          initialCodeError={state === 'error' ? data.codeError : undefined}
          onVerified={(email) => { signIn(email); if (next) navigate(next); }}
        />
        <Text variant="small" tone="secondary">Already have a brand here? Signing in takes you to its hub.</Text>
      </Card>
    </BuilderStep>
  );
}
