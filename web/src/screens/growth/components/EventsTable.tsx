import { DataTable, type DataTableColumn } from '../../../ui/composites/DataTable';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { Badge, Button, Link, Text } from '../../../ui/primitives';
import { roleLabel, type BrandEvent } from '../../../domain/event';
import type { Post } from '../../../domain/post';
import { ambassadorsLabel, eventDay, planReadiness, sourceLine } from '../eventPlan';
import { growthArtboards, useGrowthLinks } from '../paths';
import type { EventsTab } from '../types';

export interface EventsTableProps {
  tab: EventsTab;
  events: BrandEvent[];
  drafts: Map<string, Post>;
  brainVersion: string;
  onClear: () => void;
}

/** The Events list: upcoming with plan readiness and ambassadors, or past with results and a rating link. */
export function EventsTable({ tab, events, drafts, brainVersion, onClear }: EventsTableProps) {
  const links = useGrowthLinks();
  const common: DataTableColumn<BrandEvent>[] = [
    { key: 'when', header: 'When', cell: (e) => eventDay(e.startsAt) },
    {
      key: 'event', header: 'Event', rowHeader: true,
      cell: (e) => <><Link href={links.event(e.id)}>{e.name}</Link><Text variant="caption" tone="secondary">{sourceLine(e)}</Text></>,
    },
    { key: 'role', header: 'Role', cell: (e) => (e.role ? <Badge>{roleLabel(e.role)}</Badge> : null) },
  ];
  const upcoming: DataTableColumn<BrandEvent>[] = [
    { key: 'campaign', header: 'Campaign', cell: (e) => e.campaign ?? 'None' },
    { key: 'plan', header: 'Content plan', cell: (e) => { const r = planReadiness(e, drafts, brainVersion); return `${r.ready} of ${r.planned} posts ready`; } },
    { key: 'ambassadors', header: 'Ambassadors', cell: ambassadorsLabel },
  ];
  const past: DataTableColumn<BrandEvent>[] = [
    { key: 'results', header: 'Results', cell: (e) => (e.results ? `${e.results.postsVerified} posts verified · ${e.results.leads} leads` : 'Not in yet') },
    { key: 'rate', header: 'Rating', cell: (e) => (e.boardId ? <Link href={links.fromBrand(growthArtboards.eventRating, { event: e.boardId })}>Rate it</Link> : 'Not on the board') },
  ];
  return (
    <DataTable
      caption={tab === 'upcoming' ? 'Upcoming events' : 'Past events'}
      hideCaption
      columns={[...common, ...(tab === 'upcoming' ? upcoming : past)]}
      rows={events}
      rowKey={(e) => e.id}
      empty={<EmptyState title="No events match" body="Try another role, or show every role." level={2} actions={<Button variant="secondary" onClick={onClear}>Show all roles</Button>} />}
    />
  );
}
