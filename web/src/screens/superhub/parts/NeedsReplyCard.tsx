import { Badge } from '../../../ui/primitives/Badge';
import { Button, Text } from '../../../ui/primitives';
import { HubApprovalCard } from '../../../ui/domain/HubApprovalCard';
import { paths } from '../paths';
import type { NeedsReplyItem } from '../types';

export interface NeedsReplyCardProps {
  item: NeedsReplyItem;
  onAct: (outcome: 'snoozed' | 'dismissed') => void;
}

/** D40 NeedsReplyItem: due chip, source, sender, label, the message, why it was flagged, and its actions (n-inb2). */
export function NeedsReplyCard({ item, onAct }: NeedsReplyCardProps) {
  return (
    <HubApprovalCard
      meta={<><Badge tone={item.overdue ? 'warning' : 'neutral'}>{item.due}</Badge><Badge>{item.source}</Badge><strong>{item.from}</strong>{item.label && <span>· {item.label}</span>}</>}
      incoming={`"${item.quote}"`}
      note={<Text variant="small" tone="secondary">{item.why}</Text>}
      actions={
        <>
          <Button href={paths.inboxAll}>Review draft reply</Button>
          {item.canSnooze && <Button variant="secondary" onClick={() => onAct('snoozed')}>Snooze</Button>}
          {item.canDismiss && <Button variant="secondary" onClick={() => onAct('dismissed')}>No reply needed</Button>}
        </>
      }
    />
  );
}
