import { useState } from 'react';
import { useTableView } from '../../ui/hooks/useTableView';
import type { CampaignSummary, Channel } from './types';

export type ChannelFilter = 'all' | Channel;
export type CampaignSort = 'ending' | 'payout';

/** Canvas Amb-1 filter chips and sort select. */
export const channelFilters: { id: ChannelFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'blog', label: 'Blog' },
];
export const campaignSorts: { value: CampaignSort; label: string }[] = [
  { value: 'ending', label: 'Ending soonest' },
  { value: 'payout', label: 'Highest payout' },
];

/** Ascending sort keys. Unknown values (bracketed on the canvas) and closed campaigns sort last. */
const sortKeys: Record<CampaignSort, (c: CampaignSummary) => number | null> = {
  ending: (c) => c.daysLeft,
  payout: (c) => (c.maxPayout === null ? null : -c.maxPayout),
};
const keyOf = (sort: CampaignSort, c: CampaignSummary) => {
  const k = sortKeys[sort](c);
  return c.budgetReached || k === null ? Number.POSITIVE_INFINITY : k;
};
const by = (sort: CampaignSort) => (a: CampaignSummary, b: CampaignSummary) => {
  const ka = keyOf(sort, a);
  const kb = keyOf(sort, b);
  if (ka === kb) return 0;
  return ka < kb ? -1 : 1;
};
const comparators: Record<CampaignSort, (a: CampaignSummary, b: CampaignSummary) => number> = { ending: by('ending'), payout: by('payout') };
const matchChannel = (c: CampaignSummary, channel: string) => c.channels.includes(channel as Channel);

/**
 * Campaign list state (canvas note n-a1): filter by channel, sort by time left or payout (the foundation's useTableView),
 * and per-brand "Notify me". Budget-reached campaigns stay in the list, closed.
 * INTEGRATION: GET /api/campaigns/open; POST /api/campaigns/:id/notify.
 */
export function useCampaignList(campaigns: CampaignSummary[]) {
  const table = useTableView({ rows: campaigns, comparators, initialSort: { key: 'ending', direction: 'ascending' }, match: matchChannel });
  const [notified, setNotified] = useState<ReadonlySet<string>>(new Set());

  function toggleNotify(brand: string) {
    setNotified((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }

  return {
    channel: table.filter,
    setChannel: table.setFilter,
    sort: table.sort?.key ?? 'ending',
    setSort: table.sortBy,
    visible: table.view,
    notified,
    toggleNotify,
  };
}
