import { useMemo, useState } from 'react';
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
const compare = (sort: CampaignSort) => (a: CampaignSummary, b: CampaignSummary) => {
  const ka = keyOf(sort, a);
  const kb = keyOf(sort, b);
  if (ka === kb) return 0;
  return ka < kb ? -1 : 1;
};

/**
 * Campaign list state (canvas note n-a1): filter by channel, sort by time left or payout, and per-brand "Notify me".
 * Budget-reached campaigns stay in the list, closed. INTEGRATION: GET /api/campaigns/open; POST /api/campaigns/:id/notify.
 */
export function useCampaignList(campaigns: CampaignSummary[]) {
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [sort, setSort] = useState<CampaignSort>('ending');
  const [notified, setNotified] = useState<ReadonlySet<string>>(new Set());

  const visible = useMemo(
    () => campaigns.filter((c) => channel === 'all' || c.channels.includes(channel)).sort(compare(sort)),
    [campaigns, channel, sort],
  );

  function toggleNotify(brand: string) {
    setNotified((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }

  return { channel, setChannel: (id: string) => setChannel(id as ChannelFilter), sort, setSort: (v: string) => setSort(v as CampaignSort), visible, notified, toggleNotify };
}
