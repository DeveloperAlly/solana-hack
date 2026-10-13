import { DataTable } from '../../../ui/composites/DataTable';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { Button, Link, Text } from '../../../ui/primitives';
import { registeredLabel, summaryScore } from '../../../domain/rating';
import { growthArtboards, useGrowthLinks } from '../paths';
import type { BoardEvent } from '../types';

/** The events board table: event, score out of 5, attendee ratings, the line. */
export function BoardTable({ events, onClear }: { events: BoardEvent[]; onClear: () => void }) {
  const links = useGrowthLinks();
  return (
    <DataTable
      caption="Events rated by attendees"
      hideCaption
      rows={events}
      rowKey={(e) => e.id}
      columns={[
        { key: 'event', header: 'Event', rowHeader: true, cell: (e) => <><Link href={links.carry(growthArtboards.eventRating, { event: e.id })}>{e.name}</Link><Text variant="caption" tone="secondary">{e.place} · {e.when}</Text></> },
        { key: 'score', header: 'Score', cell: (e) => { const s = summaryScore(e.summary); return s === null ? 'Not rated yet' : <><strong>{s.toFixed(1)}</strong> / 5</>; } },
        { key: 'ratings', header: 'Ratings', cell: (e) => registeredLabel(e.summary) },
        { key: 'line', header: 'In a line', cell: (e) => e.line },
      ]}
      empty={<EmptyState title="No event matches" body="Try another name or city, or show every kind." level={2} actions={<Button variant="secondary" onClick={onClear}>Show all events</Button>} />}
    />
  );
}
