/*
 * Data contract: Amb-1-Campaigns, Amb-1b-CampaignsEmpty, M-1-Campaigns (issue #53; canvas
 * https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Amb-1-Campaigns, Amb-1b-CampaignsEmpty, M-1-Campaigns).
 * Backend map row "Amb-1, Amb-1b, M-1" (.agentic/what/context/backend_map.md §4): GET /api/campaigns/open, POST …/notify;
 * tables campaigns, payouts. Shape: CampaignsData in ./types.ts.
 *
 * | Field                         | Source                                                          | Empty when                    |
 * |-------------------------------|-----------------------------------------------------------------|-------------------------------|
 * | account.name, account.balance | GET /api/me/earnings (payouts; backend map row "Amb-5a … M-5")   | signed out: "Sign in" link    |
 * | campaigns[]                   | GET /api/campaigns/open (campaigns): brand, title, channels,     | no open campaign: the empty   |
 * |                               | payout range, ends_at → time left, slots, budget used            | state (Amb-1b)                |
 * | campaigns[].budgetReached     | campaigns spent ≥ cap; stays listed, closed (canvas note n-a1)   | never                         |
 * | notifyBrands[]                | brands with past campaigns; POST /api/campaigns/:id/notify       | empty list: no notify rows    |
 *
 * States: success (the list), empty (Amb-1b: notify-me per brand; earnings stay visible, note n-a1b).
 * Interactions: channel filter, sort (ending soonest, highest payout), View → detail, Notify me toggles.
 */
import { Stack, Text } from '../../ui/primitives';
import { EmptyState } from '../../ui/composites/EmptyState';
import { ToggleGroup } from '../../ui/composites/ToggleGroup';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { AmbShell } from '../../ui/domain/AmbShell';
import { AmbSelect } from '../../ui/domain/AmbSelect';
import { AmbCampaignCard } from '../../ui/domain/AmbCampaignCard';
import { CampaignAction } from './parts/CampaignAction';
import { NotifyList } from './parts/NotifyList';
import { PageTitle } from './parts/PageTitle';
import { useAmbassadorFlow } from './useAmbassadorFlow';
import { campaignSorts, channelFilters, useCampaignList } from './useCampaignList';
import type { CampaignsData, CampaignSummary, Device } from './types';

export interface AmbCampaignsProps {
  data: CampaignsData;
  device: Device;
  state?: ScreenState;
}

const channelNames = { linkedin: 'LinkedIn', blog: 'Blog' } as const;
const channelsLabel = (c: CampaignSummary, sep: string) => c.channels.map((ch) => channelNames[ch]).join(sep);

export function AmbCampaigns({ data, device, state = 'success' }: AmbCampaignsProps) {
  const flow = useAmbassadorFlow(device);
  const list = useCampaignList(data.campaigns);
  const desktop = device === 'desktop';
  const empty = state === 'empty' || data.campaigns.length === 0;
  const sort = <AmbSelect layout="inline" label="Sort" options={campaignSorts} value={list.sort} onChange={list.setSort} />;

  return (
    <AmbShell {...flow.shell} account={data.account} active="campaigns" tabs>
      <Stack gap={6}>
        <PageTitle title="Open campaigns" aside={desktop && !empty ? sort : undefined}>
          {desktop && !empty && <Text tone="secondary">Write for a brand, publish in your own name, get paid in USDC when your post is verified.</Text>}
        </PageTitle>
        {empty ? (
          <EmptyState
            title="No open campaigns right now"
            body={
              <Stack gap={4}>
                <Text tone="secondary">Brands launch campaigns often. Pick the ones you'd write for and we'll email you the moment one opens.</Text>
                <NotifyList brands={data.notifyBrands} notified={list.notified} onToggle={list.toggleNotify} />
              </Stack>
            }
          />
        ) : (
          <Stack gap={4}>
            <ToggleGroup label="Filter by channel" options={channelFilters} value={[list.channel]} onChange={(v) => list.setChannel(v[0] ?? 'all')} />
            <Stack as="ul" gap={4} aria-label="Campaigns">
              {list.visible.map((c) => (
                <li key={c.id}>
                  <AmbCampaignCard
                    layout={desktop ? 'row' : 'stack'}
                    brandLine={desktop ? c.brandLine : c.brand}
                    title={c.title}
                    channelsLabel={channelsLabel(c, desktop ? ' · ' : ', ')}
                    payout={c.payoutRange}
                    payoutSub={c.payoutBreakdown}
                    timeLeft={c.timeLeft}
                    timeSub={c.endsOn}
                    slots={c.slots}
                    budgetUsedPct={c.budgetUsedPct}
                    budgetReached={c.budgetReached}
                    href={!desktop && c.hasDetail && !c.budgetReached ? flow.paths.detail : undefined}
                    action={desktop ? <CampaignAction campaign={c} detailHref={flow.paths.detail} notified={list.notified.has(c.brand)} onNotify={() => list.toggleNotify(c.brand)} /> : undefined}
                  />
                </li>
              ))}
            </Stack>
            {list.visible.length === 0 && <Text tone="secondary">No open campaigns on this channel.</Text>}
          </Stack>
        )}
      </Stack>
    </AmbShell>
  );
}
