import { useState } from 'react';
import { Button, Grid, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import { StatePanel } from '../../ui/composites/StatePanel';
import { JourneyCopyButton } from '../../ui/domain/JourneyCopyButton';
import { journeyPaths } from './paths';
import type { ApproveKitData } from './types';

export interface ApproveRegisterPanelProps {
  onChain: string;
  approved: number;
  total: number;
  onRegister: () => void;
  /** Set when registering kit v1 failed: the kit stays approved (canvas board Kit-RegisterFailed). */
  failure?: ApproveKitData['registration'];
}

/**
 * J5's register area (canvas board J5-Approve-Kit, note n-j5-approve-kit 3 and ERROR): what goes on Solana, and
 * "Approve and register kit v1", disabled until all three gates are approved. A failed registration keeps the kit
 * approved and offers Retry, Copy error details and Continue without registering. Composition only, no styles.
 */
export function ApproveRegisterPanel({ onChain, approved, total, onRegister, failure }: ApproveRegisterPanelProps) {
  const [lastTry, setLastTry] = useState(failure?.lastTry ?? '');
  const ready = approved === total;
  return (
    <Stack gap={4}>
      {failure && (
        <StatePanel
          kind="error"
          title="Kit v1 is approved, but not registered yet"
          body={
            <>
              <Text>We couldn't write the registration to Solana. {failure.reason}. Your kit is saved and nothing was charged. You can keep working; posts stay unregistered until this succeeds.</Text>
              <KeyValueList items={[{ label: 'Version', value: 'v1' }, { label: 'Kit hash', value: failure.hash }, { label: 'Registered on Solana', value: `Not yet · last try ${lastTry}` }]} />
            </>
          }
          actions={
            <>
              {/* INTEGRATION: POST /api/registrations/:id/retry (backend map row "Onboard-6-Published, Kit-RegisterFailed"). */}
              <Button onClick={() => setLastTry('just now')}>Retry registration</Button>
              <JourneyCopyButton label="Copy error details" text={`Kit v1 registration failed: ${failure.reason}. Kit hash ${failure.hash}.`} />
              <Button variant="secondary" href={journeyPaths.firstPost}>Continue without registering</Button>
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
            <Button onClick={onRegister} disabled={!ready}>Approve and register kit v1</Button>
            <Text variant="caption" tone="secondary" role="status">{ready ? 'All 3 gates approved.' : `Approve all ${total} gates first: ${approved} of ${total} approved.`}</Text>
          </Card>
        )}
      </Grid>
    </Stack>
  );
}
