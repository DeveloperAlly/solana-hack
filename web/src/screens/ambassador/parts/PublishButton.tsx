import { useId } from 'react';
import { Button, Stack, Text } from '../../../ui/primitives';
import type { PublishGate } from '../draftRules';

export interface PublishButtonProps {
  /** "Continue to publish" (desktop, canvas Amb-3) or "Publish" (mobile, M-3). */
  label: string;
  gate: PublishGate;
  onPublish: () => void;
  fullWidth?: boolean;
}

/**
 * The Publish action on Generate, desktop and mobile. Enabled only by the one publish gate (draftRules.ts); when locked
 * it says why, and the button points at that reason with aria-describedby.
 */
export function PublishButton({ label, gate, onPublish, fullWidth }: PublishButtonProps) {
  const reasonId = useId();
  return (
    <Stack gap={1}>
      <Button onClick={onPublish} disabled={!gate.ok} aria-describedby={gate.reason ? reasonId : undefined} fullWidth={fullWidth}>{label}</Button>
      {gate.reason && <Text id={reasonId} variant="small" tone="secondary">{gate.reason}</Text>}
    </Stack>
  );
}
