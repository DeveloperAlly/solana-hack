import { Button } from '../../../ui/primitives';
import { InlineForm } from '../../../ui/composites/InlineForm';
import { StatePanel } from '../../../ui/composites/StatePanel';
import { emailCheck } from '../checks';
import type { ReferralClaimFlow } from '../useReferralClaim';

/** The invited person's claim: email in, then "check your email" with a way back to change the address. */
export function GrowthClaimForm({ flow }: { flow: ReferralClaimFlow }) {
  if (flow.step === 'sent') {
    return (
      <StatePanel
        kind="success"
        title="Check your email"
        body={`We sent a sign-in code to ${flow.email}. Sign in with it to start building your brand; your 2 months free apply when you join.`}
        actions={<Button variant="secondary" onClick={flow.restart}>Use a different email</Button>}
      />
    );
  }
  return (
    <InlineForm
      label="Claim your 2 months free"
      layout="row"
      submitLabel="Claim 2 months free"
      fields={[{ name: 'email', label: 'Your email', type: 'email', autoComplete: 'email', validate: (v) => { const c = emailCheck(v); return c.blocking ? c.label : null; } }]}
      onSubmit={({ email }) => flow.claim(email)}
    />
  );
}
