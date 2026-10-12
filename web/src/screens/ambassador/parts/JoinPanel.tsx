import type { ReactNode } from 'react';
import { Button, Stack, Text } from '../../../ui/primitives';
import { InlineForm } from '../../../ui/composites/InlineForm';
import type { JoinState, JoinStep } from '../useJoin';
import { validateCode, validateEmail } from '../validators';

export interface JoinPanelProps {
  join: JoinState;
  /** Placeholder for the email field (canvas Amb-2: "mai@[email]"). */
  emailPlaceholder: string;
  /** The signed-in ambassador's name, when signed in. */
  signedInAs?: string;
}

/** Inline sign-in to join a campaign, one view per step of useJoin (canvas note n-a2; ADR-006 email code). */
export function JoinPanel({ join, emailPlaceholder, signedInAs }: JoinPanelProps) {
  const views: Record<JoinStep, ReactNode> = {
    'signed-in': (
      <Stack gap={2}>
        <Text variant="small" tone="secondary">Signed in as {signedInAs}</Text>
        <Button onClick={join.joinSignedIn} fullWidth>Join and start writing</Button>
      </Stack>
    ),
    start: <Button onClick={join.open} fullWidth>Join and start writing</Button>,
    email: (
      <InlineForm
        fields={[{ name: 'email', label: 'Sign in with email to join', type: 'email', placeholder: emailPlaceholder, autoComplete: 'email', validate: validateEmail }]}
        submitLabel="Email me a code"
        onSubmit={(v) => join.sendCode(v.email)}
      />
    ),
    code: (
      <Stack gap={3}>
        <Text variant="small" role="status">
          We sent a code to {join.email}.{' '}
          <Button variant="secondary" onClick={join.changeEmail}>Change email</Button>
        </Text>
        <InlineForm
          fields={[{ name: 'code', label: '6-digit code', inputMode: 'numeric', autoComplete: 'one-time-code', validate: validateCode }]}
          submitLabel="Join and start writing"
          onSubmit={join.verify}
        />
      </Stack>
    ),
  };
  return <>{views[join.step]}</>;
}
