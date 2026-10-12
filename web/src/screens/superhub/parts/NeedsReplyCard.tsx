import { Badge } from '../../../ui/primitives/Badge';
import { useNavigate } from 'react-router';
import { Button, Text } from '../../../ui/primitives';
import { ApprovalItem } from '../../../ui/domain/ApprovalItem';
import { useHubLinks } from '../paths';
import type { NeedsReplyItem } from '../types';

export interface NeedsReplyCardProps {
  item: NeedsReplyItem;
  onAct: (outcome: 'snoozed' | 'dismissed') => void;
}

/** D40 NeedsReplyItem: due chip, source, sender, label, the message, why it was flagged, and its actions (n-inb2). */
export function NeedsReplyCard({ item, onAct }: NeedsReplyCardProps) {
  const links = useHubLinks();
  const navigate = useNavigate();
  return (
    <ApprovalItem
      meta={<><Badge tone={item.overdue ? 'warning' : 'neutral'}>{item.due}</Badge><Badge>{item.source}</Badge><strong>{item.from}</strong>{item.label && <span>· {item.label}</span>}</>}
      incoming={`"${item.quote}"`}
      note={<Text variant="small" tone="secondary">{item.why}</Text>}
      actions={
        <>
          {/* Opens this thread in Inbox-All, where the drafted reply is sent. */}
          <Button onClick={() => navigate(links.inboxAll, { state: { open: item.threadId } })}>Review draft reply</Button>
          {item.canSnooze && <Button variant="secondary" onClick={() => onAct('snoozed')}>Snooze</Button>}
          {item.canDismiss && <Button variant="secondary" onClick={() => onAct('dismissed')}>No reply needed</Button>}
        </>
      }
    />
  );
}
