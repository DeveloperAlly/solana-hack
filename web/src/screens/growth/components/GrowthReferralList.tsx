import { useId } from 'react';
import { Heading, Stack } from '../../../ui/primitives';
import { List, ListRow } from '../../../ui/composites/ListRow';
import { ToggleGroup } from '../../../ui/composites/ToggleGroup';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { formatDateTime } from '../format';
import { referralStatusLabels, type ReferralFilter, type ReferralFlow } from '../useReferral';

const filters: ReferralFilter[] = ['all', 'invited', 'joined', 'rewarded'];
const filterLabel = (f: ReferralFilter) => (f === 'all' ? 'All' : referralStatusLabels[f]);

/** Your referrals with their status, filtered by status; an empty state when there are none yet. */
export function GrowthReferralList({ flow }: { flow: ReferralFlow }) {
  const headingId = useId();
  if (flow.referrals.length === 0) {
    return <EmptyState title="No referrals yet" body="Share your link or invite a friend by email. Each one shows here with its status." />;
  }
  return (
    <Stack as="section" gap={3} aria-labelledby={headingId}>
      <Heading level={2} size="lg" id={headingId}>Your referrals</Heading>
      <ToggleGroup
        label="Filter referrals by status"
        options={filters.map((f) => ({ id: f, label: `${filterLabel(f)} (${flow.counts[f]})` }))}
        value={[flow.filter]}
        onChange={([f]) => flow.setFilter(f as ReferralFilter)}
      />
      <List label="Referrals">
        {flow.shown.map((r) => (
          <ListRow key={r.id} title={r.who} detail={`Invited ${formatDateTime(r.invitedAt)}`} status={{ label: referralStatusLabels[r.status], tone: r.status === 'rewarded' ? 'solid' : 'neutral' }} />
        ))}
      </List>
    </Stack>
  );
}
