import { useState } from 'react';
import type { ContentDashboardData, DraftStatus } from '../types';

/** Content-Dashboard state (n-cd 2): the open tab (by draft state) and the channel filter. */
export function useContentDashboard(data: ContentDashboardData) {
  const [tab, setTab] = useState(data.tabs[0]?.id ?? '');
  const [channel, setChannel] = useState('all');
  const draftsFor = (status?: DraftStatus) =>
    data.drafts.filter((d) => d.status === status && (channel === 'all' || d.channel === channel));
  return { tab, setTab, channel, setChannel, draftsFor };
}
