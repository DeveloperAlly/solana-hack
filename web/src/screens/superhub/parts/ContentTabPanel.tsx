import { Button } from '../../../ui/primitives';
import { useHubLinks } from '../paths';
import type { ContentDashboardData, DraftSummary } from '../types';
import { ContentStarts } from './ContentStarts';
import { DraftRows } from './DraftRows';

export interface ContentTabPanelProps {
  tab: ContentDashboardData['tabs'][number];
  drafts: DraftSummary[];
  /** Nothing at all is waiting: the first tab shows the three starts (n-cde). */
  starts?: ContentDashboardData['starts'];
  channelLabel: string;
}

/** One Content-Dashboard tab: a link tab (Replies) opens the reply queue; others list their drafts or the starts. */
export function ContentTabPanel({ tab, drafts, starts, channelLabel }: ContentTabPanelProps) {
  const links = useHubLinks();
  if (tab.href) return <Button variant="secondary" href={links[tab.href]}>Open the reply queue</Button>;
  if (starts) return <ContentStarts starts={starts} />;
  return <DraftRows drafts={drafts} emptyTitle={`Nothing in ${tab.label.toLowerCase()}${channelLabel}`} />;
}
