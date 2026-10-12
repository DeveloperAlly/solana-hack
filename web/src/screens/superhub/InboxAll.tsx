/*
 * Data contract: Inbox-All (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Inbox-All,
 * note n-inb1). Shape: InboxData in ./types.ts. Backend map §4 row "Inbox-All, Inbox-NeedsReply, Inbox-Connect
 * (coming soon)": sketch only, table inbox_threads; sending is always done by a person.
 *
 * | Field              | Source                                                                                       |
 * |--------------------|----------------------------------------------------------------------------------------------|
 * | folders            | Counts over inbox_threads (all, needs reply); Snoozed and Done are counted on the client     |
 * | sources            | connections joined to inbox_threads, count per source                                        |
 * | labels             | inbox_threads labels (partners, leads, ambassadors, press)                                   |
 * | assignees          | memberships of the brand (seats)                                                              |
 * | messages[]         | inbox_threads: source, sender, last message preview, time, unread, labels                    |
 * | messages[].thread  | inbox_threads messages, in and out                                                           |
 * | messages[].reply   | Drafted reply (DraftWorkflow in the right voice, after the slop check) with its note         |
 * | messages[].linked  | Partner or lead the thread belongs to, across sources (n-inb1 4)                             |
 *
 * Empty: no sources connected, so the inbox is Inbox-Connect. A filter with no matches shows an empty message.
 * States drawn: success only.
 */
import { Columns } from '../../ui/layouts/Columns';
import { HubSideNav } from '../../ui/domain/HubSideNav';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { MessageList } from './parts/MessageList';
import { ReadingPane } from './parts/ReadingPane';
import { StatusNote } from './parts/StatusNote';
import { useInbox } from './hooks/useInbox';
import type { InboxData } from './types';

const lastText = { sent: 'Reply sent.', snoozed: 'Snoozed.', done: 'Marked done.' } as const;

export function InboxAll({ data }: { data: InboxData }) {
  const inbox = useInbox(data);
  return (
    <HubPage artboard="Inbox-All">
      <PageHeader badges={<ComingSoonFlag tag="STRETCH" />} title="Inbox" />
      <StatusNote onUndo={inbox.last ? inbox.undoLast : undefined}>{inbox.last && lastText[inbox.last.outcome]}</StatusNote>
      <Columns
        start={<HubSideNav label="Inbox folders, sources and labels" sections={inbox.rail} current={inbox.filter} onSelect={inbox.select} />}
        end={inbox.open && <ReadingPane inbox={inbox} message={inbox.open} data={data} />}
        ratio="1-1"
      >
        <MessageList inbox={inbox} />
      </Columns>
    </HubPage>
  );
}
