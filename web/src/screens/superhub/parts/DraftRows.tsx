import { Badge } from '../../../ui/primitives/Badge';
import { Button, Text } from '../../../ui/primitives';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { List, ListRow } from '../../../ui/composites/ListRow';
import { useOpenDraft } from '../../../flows/drafts/openDraft';
import type { DraftSummary } from '../types';

export interface DraftRowsProps {
  drafts: DraftSummary[];
  /** What the empty list says (a channel with no drafts, a tab with nothing in it). */
  emptyTitle: string;
}

/** D1 compact: drafts as rows with format, title, voice, scores, slot and Review (canvas Content-Dashboard). */
export function DraftRows({ drafts, emptyTitle }: DraftRowsProps) {
  const openDraft = useOpenDraft();
  if (drafts.length === 0) return <EmptyState level={3} title={emptyTitle} body="Drafts land here after the brand and slop checks." />;
  return (
    <List label="Drafts">
      {drafts.map((d) => (
        <ListRow
          key={d.id}
          lead={<Badge>{d.format}</Badge>}
          title={d.title}
          detail={d.meta}
          aside={<><Text as="span" variant="small">{d.onBrand}</Text><Text as="span" variant="small">{d.slop}</Text><Text as="span" variant="small" tone="secondary">{d.slot}</Text></>}
          actions={<Button aria-label={`Review ${d.format}: ${d.title}`} onClick={() => openDraft(d.id)}>Review</Button>}
        />
      ))}
    </List>
  );
}
