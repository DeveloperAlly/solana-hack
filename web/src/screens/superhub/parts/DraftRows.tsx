import { useNavigate } from 'react-router';
import { Badge } from '../../../ui/primitives/Badge';
import { Button, Stack, Text } from '../../../ui/primitives';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { HubItemRow } from '../../../ui/domain/HubItemRow';
import { useHubLinks } from '../paths';
import type { DraftSummary } from '../types';

export interface DraftRowsProps {
  drafts: DraftSummary[];
  /** What the empty list says (a channel with no drafts, a tab with nothing in it). */
  emptyTitle: string;
}

/** D1 compact: drafts as rows with format, title, voice, scores, slot and Review (canvas Content-Dashboard). */
export function DraftRows({ drafts, emptyTitle }: DraftRowsProps) {
  const links = useHubLinks();
  const navigate = useNavigate();
  if (drafts.length === 0) return <EmptyState level={3} title={emptyTitle} body="Drafts land here after the brand and slop checks." />;
  return (
    <Stack as="ul" gap={0}>
      {drafts.map((d) => (
        <HubItemRow
          key={d.id}
          as="li"
          lead={<Badge>{d.format}</Badge>}
          aside={<><Text as="span" variant="small">{d.onBrand}</Text><Text as="span" variant="small">{d.slop}</Text><Text as="span" variant="small" tone="secondary">{d.slot}</Text></>}
          actions={<Button aria-label={`Review ${d.format}: ${d.title}`} onClick={() => navigate(links.draftReview, { state: { draftId: d.id } })}>Review</Button>}
        >
          <Text>{d.title}</Text>
          <Text variant="small" tone="secondary">{d.meta}</Text>
        </HubItemRow>
      ))}
    </Stack>
  );
}
