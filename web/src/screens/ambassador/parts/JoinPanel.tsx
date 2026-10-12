import type { ReactNode } from 'react';
import { Button, Stack, Text } from '../../../ui/primitives';
import { AmbInlineForm } from '../../../ui/domain/AmbInlineForm';
import type { JoinState, JoinStep } from '../useJoin';
import { validateCode, validateEmail } from '../validators';

export interface JoinPanelProps {
  join: JoinState;
  /** Placeholder for the email field (canvas Amb-2: "mai@[email]"). */
  emailPlaceholder: string;
}

/** Inline sign-in to join a campaign, one view per step of useJoin (canvas note n-a2; ADR-006 email code). */
export function JoinPanel({ join, emailPlaceholder }: JoinPanelProps) {
  const views: Record<JoinStep, ReactNode> = {
    start: <Button onClick={join.open} fullWidth>Join and start writing</Button>,
    email: (
      <AmbInlineForm label="Sign in with email to join" type="email" placeholder={emailPlaceholder} submitLabel="Email me a code" validate={validateEmail} onSubmit={join.sendCode} />
    ),
    code: (
      <Stack gap={3}>
        <Text variant="small" role="status">
          We sent a code to {join.email}.{' '}
          <Button variant="secondary" onClick={join.changeEmail}>Change email</Button>
        </Text>
        <AmbInlineForm label="6-digit code" type="text" submitLabel="Join and start writing" validate={validateCode} onSubmit={join.verify} />
      </Stack>
    ),
  };
  return <>{views[join.step]}</>;
}
