/*
 * Data contract: Inbox-NeedsReply (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * Inbox-NeedsReply, note n-inb2). Shape: NeedsReplyData in ./types.ts. Backend map §4 row "Inbox-All, Inbox-NeedsReply,
 * Inbox-Connect (coming soon)": sketch only, table inbox_threads.
 *
 * | Field          | Source                                                                                          |
 * |----------------|-------------------------------------------------------------------------------------------------|
 * | folders        | Counts over inbox_threads                                                                       |
 * | targets        | Reply targets per label (partners and leads 4 h; n-inb2 2), brand settings                      |
 * | items[]        | inbox_threads the flagger marked (direct questions, dated requests, buying and payout questions)|
 * | items[].due    | Last message time + the label's reply target; overdue first                                     |
 * | items[].why    | The flagger's reason, shown so a person can correct it ("No reply needed" trains it, n-inb2 3)  |
 *
 * Empty: nothing flagged ("Nothing needs a reply"). States drawn: success only.
 */
import { useState } from 'react';
import { Button, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { EmptyState } from '../../ui/composites/EmptyState';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import { Columns } from '../../ui/layouts/Columns';
import { HubSideNav } from '../../ui/domain/HubSideNav';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { NeedsReplyCard } from './parts/NeedsReplyCard';
import { StatusNote } from './parts/StatusNote';
import { useHubSession } from './hooks/useHubSession';
import { useHubLinks } from './paths';
import type { NeedsReplyData } from './types';

const outcomeLabel = { sent: 'replied', snoozed: 'snoozed', done: 'no reply needed' } as const;

export function InboxNeedsReply({ data }: { data: NeedsReplyData }) {
  const links = useHubLinks();
  // Outcomes live in the hub session by thread, so Inbox-All and this list always agree.
  const [session, update] = useHubSession();
  const outcomeOf = (i: { threadId: string }) => session.inbox[i.threadId];
  const set = (threadId: string, o: 'snoozed' | 'done') => update((s) => ({ ...s, inbox: { ...s.inbox, [threadId]: o } }));
  const clear = (threadId: string) => update((s) => ({ ...s, inbox: Object.fromEntries(Object.entries(s.inbox).filter(([k]) => k !== threadId)) }));
  const [drafted, setDrafted] = useState(false);
  const open = data.items.filter((i) => !outcomeOf(i));
  const groups = [...new Set(data.items.map((i) => i.group))];
  const rail = (
    <Stack gap={4}>
      <HubSideNav label="Inbox folders" current="needs" sections={[{ items: data.folders.map((f) => ({ ...f, href: links[f.href] })) }]} />
      <Card as="div" variant="subtle" header={<Text variant="label">Reply targets</Text>}>
        <KeyValueList label="Reply targets" items={data.targets} />
      </Card>
    </Stack>
  );
  return (
    <HubPage artboard="Inbox-NeedsReply">
      <Columns start={rail}>
        <PageHeader badges={<ComingSoonFlag tag="STRETCH" />}
          title="Needs reply"
         
          intro="Messages that ask you something or are waiting on you, oldest risk first. Replies are drafted; you send them."
          actions={<Button variant="secondary" onClick={() => setDrafted(true)} disabled={drafted}>Draft all ({open.length})</Button>}
        />
        {/* INTEGRATION: POST drafts for every flagged thread (DraftWorkflow); nothing sends without a person. */}
        <StatusNote>{drafted && `Drafts filled for ${open.length} messages. Nothing sends without you.`}</StatusNote>
        {open.length === 0 && <EmptyState title="Nothing needs a reply" body="Everything flagged has been answered, snoozed or marked as not needing a reply." />}
        {groups.map((g) => {
          const items = open.filter((i) => i.group === g);
          if (items.length === 0) return null;
          return (
            <Stack key={g} as="section" gap={3} aria-label={`${g} (${items.length})`}>
              <Text variant="label">{g} ({items.length})</Text>
              {items.map((i) => <NeedsReplyCard key={i.id} item={i} onAct={(o) => set(i.threadId, o === 'dismissed' ? 'done' : o)} />)}
            </Stack>
          );
        })}
        {data.items.filter((i) => outcomeOf(i)).map((i) => (
          <StatusNote key={i.id} onUndo={() => clear(i.threadId)}>{`${i.from}: ${outcomeLabel[outcomeOf(i) ?? 'done']}.`}</StatusNote>
        ))}
        <Text variant="small" tone="secondary">{data.footnote}</Text>
      </Columns>
    </HubPage>
  );
}
