import { Badge } from '../../../ui/primitives/Badge';
import { Button, Text } from '../../../ui/primitives';
import { HubApprovalCard } from '../../../ui/domain/HubApprovalCard';
import type { ReviewQueue } from '../hooks/useReviewQueue';
import type { ReplyItem } from '../types';
import { InlineEditor } from './InlineEditor';

export type ReplyOutcome = 'sent' | 'skipped';

const outcomeText: Record<ReplyOutcome, string> = { sent: 'Sent', skipped: 'Skipped' };

export interface ReplyCardProps {
  item: ReplyItem;
  queue: ReviewQueue<ReplyOutcome>;
}

/**
 * D1 reply item (n-eq 1–2): the mention, the drafted reply, Approve and send / Edit / Skip. A low-confidence item has
 * no draft and is held for the person to write; it can only be sent once it has text.
 */
export function ReplyCard({ item, queue }: ReplyCardProps) {
  const text = queue.textOf(item.id, item.draft);
  const outcome = queue.outcomeOf(item.id);
  const editing = queue.editing === item.id;
  return (
    <HubApprovalCard
      meta={<><Badge>{item.channel}</Badge><strong>{item.author}</strong><span>· {item.ago}</span></>}
      incoming={`"${item.incoming}"`}
      note={<Text variant="small" tone="secondary">{item.note}</Text>}
      draft={editing ? <InlineEditor label={`Reply to ${item.author}`} value={queue.draft} error={queue.error} onChange={queue.setDraft} onSave={queue.save} onCancel={queue.cancel} /> : text || undefined}
      outcome={outcome && <>{outcomeText[outcome]}<Button variant="secondary" onClick={() => queue.undo(item.id)}>Undo</Button></>}
      actions={
        !editing && (
          <>
            {/* INTEGRATION: POST /api/replies/:id/send (backend map row "Engage-Queue"); X reply posts, never LinkedIn comments. */}
            {text && <Button onClick={() => queue.act(item.id, 'sent')}>Approve and send</Button>}
            <Button variant="secondary" onClick={() => queue.edit(item.id, text)}>{text ? 'Edit' : 'Write reply'}</Button>
            <Button variant="secondary" onClick={() => queue.act(item.id, 'skipped')}>Skip</Button>
          </>
        )
      }
    />
  );
}
