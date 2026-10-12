import { DistributeVersionCard } from '../../../ui/domain/DistributeVersionCard';
import { Grid, Select, Text } from '../../../ui/primitives';
import type { BadgeTone } from '../../../ui/primitives/Badge';
import type { PlatformStatus } from '../../../config/platforms';
import type { AdaptFlow, VersionApproval } from '../useAdapt';

const approvalView: Record<VersionApproval, { label: string; tone: BadgeTone; approved: boolean }> = {
  approved: { label: 'Approved', tone: 'solid', approved: true },
  stale: { label: 'Stale: approve again', tone: 'warning', approved: false },
  none: { label: 'Needs your approval', tone: 'neutral', approved: false },
};

/** How a version posts, from the platform's registry status: nothing publishes directly yet. */
const howNote: Record<PlatformStatus, string> = {
  live: 'How: publish directly.',
  soon: 'How: copy, post, paste the link back. Publishing directly is coming soon.',
  planned: 'How: copy, post, paste the link back. Planned platform: copy and paste only.',
};

/** The chosen platforms' versions, each with its check, approval, When and How. */
export function AdaptVersionList({ flow, slots }: { flow: AdaptFlow; slots: string[] }) {
  return (
    <Grid min="md">
      {flow.versions.map((v) => (
        <DistributeVersionCard
          key={v.platform.id}
          platform={v.platform.name}
          text={v.text}
          length={v.length}
          check={v.check}
          approval={approvalView[v.approval]}
          note={howNote[v.platform.status]}
          onSave={(t) => flow.editVersion(v.platform.id, t)}
          onApprove={() => flow.approveVersion(v.platform.id)}
        >
          <Select label={`When on ${v.platform.name}`} options={slots} value={v.slot} onValueChange={(s) => flow.setSlot(v.platform.id, s)} error={v.conflict ? `Taken by ${v.conflict}. Pick another time.` : undefined} />
          {v.platform.limit && <Text variant="caption" tone="secondary">Limit: {v.platform.limit.source.label}</Text>}
        </DistributeVersionCard>
      ))}
    </Grid>
  );
}
