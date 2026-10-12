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
import { HubColumns } from '../../ui/domain/HubColumns';
import { HubSideNav } from '../../ui/domain/HubSideNav';
import { HubPage } from './parts/HubPage';
import { PageHeader } from './parts/PageHeader';
import { NeedsReplyCard } from './parts/NeedsReplyCard';
import { StatusNote } from './parts/StatusNote';
import { useOutcomes } from './hooks/useOutcomes';
import { useHubLinks } from './paths';
import type { NeedsReplyData } from './types';

export function InboxNeedsReply({ data }: { data: NeedsReplyData }) {
  const links = useHubLinks();
  const { outcomeOf, set, clear } = useOutcomes<'snoozed' | 'dismissed'>();
  const [drafted, setDrafted] = useState(false);
  const open = data.items.filter((i) => !outcomeOf(i.id));
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
    <HubPage section="inbox">
      <HubColumns start={rail}>
        <PageHeader
          title="Needs reply"
          tag="STRETCH"
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
              {items.map((i) => <NeedsReplyCard key={i.id} item={i} onAct={(o) => set(i.id, o)} />)}
            </Stack>
          );
        })}
        {data.items.filter((i) => outcomeOf(i.id)).map((i) => (
          <StatusNote key={i.id} onUndo={() => clear(i.id)}>{`${i.from}: ${outcomeOf(i.id) === 'snoozed' ? 'snoozed' : 'no reply needed'}.`}</StatusNote>
        ))}
        <Text variant="small" tone="secondary">{data.footnote}</Text>
      </HubColumns>
    </HubPage>
  );
}
