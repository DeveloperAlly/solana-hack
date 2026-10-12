import { useState } from 'react';
import { useHubSession } from './useHubSession';
import { recordStatus } from './draftStatus';
import type { ContentDashboardData, DraftStatus } from '../types';

/**
 * Content-Dashboard state (n-cd 2): the open tab (by draft state) and the channel filter. A draft decided in Draft-Review
 * shows under the status draftStatusOf gives its recorded decision (hub session; the same function as the badge), and the tab counts move with it.
 */
export function useContentDashboard(data: ContentDashboardData) {
  const [tab, setTab] = useState(data.tabs[0]?.id ?? '');
  const [channel, setChannel] = useState('all');
  const [session] = useHubSession();
  const drafts = data.drafts.map((d) => ({ ...d, status: session.drafts[d.id] ? recordStatus(session.drafts[d.id]) : d.status }));
  const draftsFor = (status?: DraftStatus) => drafts.filter((d) => d.status === status && (channel === 'all' || d.channel === channel));
  /** The drawn count, moved by the drafts that left or joined this state. */
  const countFor = (tab: ContentDashboardData['tabs'][number]) => {
    if (!tab.status) return tab.count;
    const delta = drafts.filter((d) => d.status === tab.status).length - data.drafts.filter((d) => d.status === tab.status).length;
    return tab.count === undefined && delta === 0 ? undefined : (tab.count ?? 0) + delta;
  };
  return { tab, setTab, channel, setChannel, draftsFor, countFor };
}
