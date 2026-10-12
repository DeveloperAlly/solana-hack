/*
 * Data contract: Distribute-Adapt (canvas v21 page "3 · Distribute everywhere", board Distribute-Adapt, COMING SOON;
 * ADR-012 #86; issue #90 row "Platforms, Distribute-Adapt": P7 adapter registry). Backend map: .agentic/what/context/
 * backend_map.md §4, rows "Draft-Review" (posts) and "Settings › Connections" (connections). Shapes: AdaptData in
 * ./types.ts, Post in domain/post.ts, Platform in config/platforms.ts.
 *
 * | Field             | Source                                                                         | Empty when            |
 * |-------------------|--------------------------------------------------------------------------------|-----------------------|
 * | post              | GET /api/posts/:id (web/worker/posts.ts): text, approval                       | never: opened on a post |
 * | platformIds       | the brand's platforms (GET /api/connections, not built yet), as registry ids   | none connected        |
 * | platforms         | config/platforms.ts: names, statuses, sourced length limits                    | never                 |
 * | versions[]        | GET /api/posts/:id/versions (not built yet): adapted text, claims gate result  | not adapted yet       |
 * | approvals         | per-version approvals (not built yet), bound by fingerprint (domain/approval)  | none approved         |
 * | slots, taken      | GET /api/schedule (not built yet)                                              | nothing scheduled     |
 *
 * States (canvas note on the board): success = three platforms chosen; empty = no platforms chosen (Schedule
 * disabled); error = a publish failed alert; loading. A failing check (blocked badge + disabled Approve) and a schedule
 * conflict come from the data and the person's choices (Bluesky's unsourced claim; LinkedIn at the taken slot).
 */
import { Alert, Link } from '../../ui/primitives';
import { StateView } from '../../ui/composites/StateView';
import { GatedButton } from '../../ui/composites/GatedButton';
import { DistributeSourcePost } from '../../ui/domain/DistributeSourcePost';
import { DistributePlatformPicker } from '../../ui/domain/DistributePlatformPicker';
import { findPlatform, statusLabel } from '../../config/platforms';
import { listState } from './listState';
import { LoopFrame } from './components/LoopFrame';
import { AdaptVersionList } from './components/AdaptVersionList';
import { growthArtboards, useGrowthLinks } from './paths';
import { useAdapt, type VersionApproval } from './useAdapt';
import type { AdaptData, ScreenProps } from './types';

const originalView: Record<VersionApproval, { label: string; tone: 'solid' | 'warning' | 'neutral'; approved: boolean }> = {
  approved: { label: 'Approved', tone: 'solid', approved: true },
  stale: { label: 'Edited: needs approval', tone: 'warning', approved: false },
  none: { label: 'Not approved yet', tone: 'neutral', approved: false },
};

export function DistributeAdapt({ data, state = 'success' }: ScreenProps<AdaptData>) {
  const flow = useAdapt(data);
  const links = useGrowthLinks();
  const calendar = links.to('Publish-Calendar');
  return (
    <LoopFrame
      artboard="Distribute-Adapt"
      title="Adapt and schedule"
      tag="COMING SOON"
      intro="One approved post, a version for each platform. Each version keeps your voice, passes the same checks and needs one approval."
      meta="Drawn, not built. Verify works on each version once its link is pasted back. Defined in: canvas v21 Distribute-Adapt; ADR-012."
      actions={<GatedButton gate={flow.schedule} onClick={flow.confirmSchedule} showPassLabel>Schedule {flow.chosen.length}</GatedButton>}
    >
      {state === 'error' && <Alert tone="danger" title="LinkedIn did not publish">The LinkedIn version is kept. Copy it, post it by hand and paste the link back so Verify can check it.</Alert>}
      {flow.scheduled && <Alert tone="success" title="Scheduled">Each version is on the calendar at its time. <Link href={calendar}>Open the calendar</Link></Alert>}
      <DistributeSourcePost
        label={`Original · ${findPlatform(data.post.platform)?.name ?? data.post.platform}`}
        text={flow.original}
        onSave={flow.editOriginal}
        approval={originalView[flow.originalApproval]}
        onApprove={flow.approveOriginal}
        staleNote={flow.staleCount ? `The original or a version changed, so ${flow.staleCount} approved ${flow.staleCount === 1 ? 'version needs' : 'versions need'} approving again.` : undefined}
        link={<Link href={links.to('Post-Detail')}>Post detail</Link>}
      />
      <DistributePlatformPicker
        legend="Platforms for this post"
        options={flow.platforms.map((p) => ({ id: p.id, label: p.name, description: statusLabel(p.status) }))}
        value={flow.chosen}
        onChange={flow.setChosen}
        footer={<Link href={links.to(growthArtboards.platforms)}>All platforms</Link>}
      />
      <StateView
        state={listState(state, flow.versions.length)}
        loading={{ title: 'Adapting for each platform', body: 'Writing a version per platform in your voice.' }}
        empty={{ title: 'No platforms chosen', body: 'Choose where this post goes. Schedule stays off until you do.' }}
      >
        <AdaptVersionList flow={flow} slots={data.slots} />
      </StateView>
    </LoopFrame>
  );
}
