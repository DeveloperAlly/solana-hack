import { useJourneyTask } from './useJourneyTask';
import { useState } from 'react';
import { Alert, Button, Grid, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import { StatePanel } from '../../ui/composites/StatePanel';
import { CopyButton } from '../../ui/composites/CopyButton';
import { useJourneyHref } from './paths';
import type { ApproveKitData } from './types';

export interface ApproveRegisterPanelProps {
  onChain: string;
  approved: number;
  total: number;
  blockedReason?: string;
  onRegister: () => void | Promise<void>;
  /** Retries a failed registration. */
  onRetry: () => void | Promise<void>;
  /** Set when registering kit v1 failed: the kit stays approved (canvas board Kit-RegisterFailed). */
  failure?: ApproveKitData['registration'];
}

/**
 * J5's register area (canvas board J5-Approve-Kit, note n-j5-approve-kit 3 and ERROR): what goes on Solana, and
 * "Approve and register kit v1", disabled until all three gates are approved. A failed registration keeps the kit
 * approved and offers Retry, Copy error details and Review the kit; drafting waits for a registered kit. Composition only, no styles.
 */
export function ApproveRegisterPanel({ onChain, approved, total, onRegister, onRetry, failure, blockedReason }: ApproveRegisterPanelProps) {
  const task = useJourneyTask();
  const to = useJourneyHref();
  const [lastTry, setLastTry] = useState(failure?.lastTry ?? '');
  const ready = approved === total && !blockedReason;
  const gatesHint = blockedReason || `Approve all ${total} gates first: ${approved} of ${total} approved.`;
  return (
    <Stack gap={4}>
      {task.error && <Alert tone="danger">{task.error}</Alert>}
      {failure && (
        <StatePanel
          kind="error"
          title="Kit v1 is approved, but not registered yet"
          body={
            <>
              <Text>We couldn't write the registration to Solana. {failure.reason}. Your kit is saved and nothing was charged. Your first post is drafted from kit v1 once it is registered.</Text>
              {!ready && <Text variant="small" role="status">{gatesHint}</Text>}
              <KeyValueList items={[{ label: 'Version', value: 'v1' }, { label: 'Kit hash', value: failure.hash }, { label: 'Registered on Solana', value: `Not yet · last try ${lastTry}` }]} />
            </>
          }
          actions={
            <>
              {/* INTEGRATION: POST /api/registrations/:id/retry (backend map row "Onboard-6-Published, Kit-RegisterFailed"). */}
              {/* Retry goes through the same gate as Register: all three gates approved, none stale. */}
              <Button disabled={!ready || task.busy} onClick={() => void task.run(onRetry, () => setLastTry('just now'))}>Retry registration</Button>
              <CopyButton label="Copy error details" value={`Kit v1 registration failed: ${failure.reason}. Kit hash ${failure.hash}.`} />
              {/* No way on to drafting: the Worker drafts only from a registered kit (web/worker/posts.ts, 409). */}
              <Button variant="secondary" href={to('brandBuild')}>Review the kit</Button>
            </>
          }
        />
      )}
      <Grid min="lg" gap={4}>
        <Card variant="subtle" labelledBy="approve-onchain">
          <Heading level={2} size="lg" id="approve-onchain">What goes on Solana</Heading>
          <Text variant="small">{onChain}</Text>
          <Text variant="caption" tone="secondary">Same fields as the live WL-KIT schema.</Text>
        </Card>
        {!failure && (
          <Card variant="selected" as="div">
            {/* INTEGRATION: POST /api/brands/:id/kit/register (web/worker/api.ts, registerKit). */}
            <Button onClick={() => void task.run(onRegister)} disabled={!ready || task.busy}>Approve and register kit v1</Button>
            <Text variant="caption" tone="secondary" role="status">{ready ? 'All 3 gates approved.' : gatesHint}</Text>
          </Card>
        )}
      </Grid>
    </Stack>
  );
}
