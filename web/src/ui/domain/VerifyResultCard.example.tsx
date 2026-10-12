import type { WorkbenchExample } from '../../system/example';
import { Button, Stack, Text } from '../primitives';
import { VerifyResultCard } from './VerifyResultCard';

export function VerifyResultCardDemo() {
  return (
    <Stack gap={4}>
      <VerifyResultCard tone="match" title="Brand-approved: yes" summary="Exact match to a post aDNA approved and registered on Solana." />
      <VerifyResultCard
        tone="nomatch"
        title="Not found"
        summary="We couldn't match this to anything created or paid for through JamJam."
        actions={<Button variant="secondary">Browse verified brands</Button>}
      />
      <VerifyResultCard tone="edited" title="Edited from a brand-approved original" summary="The changes were not approved." />
      <VerifyResultCard tone="retracted" title="Retracted by JamJam">
        <Text variant="small">Approved [date], retracted [date]. Reason: "[reason]".</Text>
      </VerifyResultCard>
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D34',
  name: 'VerifyResultCard',
  description: 'Match, not found, edited and retracted, with detail and action slots.',
  render: () => <VerifyResultCardDemo />,
};
