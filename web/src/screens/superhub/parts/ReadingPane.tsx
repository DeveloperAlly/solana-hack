import { Badge } from '../../../ui/primitives/Badge';
import { Button, Field, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { Menu } from '../../../ui/composites/Menu';
import { HubThread } from '../../../ui/domain/HubThread';
import type { InboxState } from '../hooks/useInbox';
import type { InboxData, InboxMessage } from '../types';

export interface ReadingPaneProps {
  inbox: InboxState;
  message: InboxMessage;
  data: InboxData;
}

/** Inbox-All reading pane (n-inb1 2–4): thread, drafted reply you send from here, Snooze / Done / Assign / Label. */
export function ReadingPane({ inbox, message: m, data }: ReadingPaneProps) {
  const outcome = inbox.outcomeOf(m.id);
  const labelName = (id: string) => data.labels.find((l) => l.id === id)?.label ?? id;
  return (
    <Stack as="section" gap={4} aria-labelledby="inbox-thread">
      <Stack direction="row" gap={2} align="center" wrap>
        <Heading level={2} size="lg" id="inbox-thread">{m.from}</Heading>
        <Badge>{m.sourceLabel}</Badge>
        {inbox.labelsOf(m.id).map((l) => <Badge key={l}>{labelName(l)}</Badge>)}
      </Stack>
      <Stack direction="row" gap={2} wrap>
        <Button variant="secondary" onClick={() => inbox.act(m.id, 'snoozed')}>Snooze</Button>
        <Button variant="secondary" onClick={() => inbox.act(m.id, 'done')}>Done</Button>
        <Menu trigger={inbox.assigneeOf(m.id) ? `Assigned: ${inbox.assigneeOf(m.id)}` : 'Assign'} items={data.assignees.map((a) => ({ id: a, label: a, checked: inbox.assigneeOf(m.id) === a }))} onSelect={(a) => inbox.assign(m.id, a)} />
        <Menu trigger="Label" items={data.labels.map((l) => ({ id: l.id, label: l.label, checked: inbox.labelsOf(m.id).includes(l.id) }))} onSelect={(l) => inbox.toggleLabel(m.id, l)} />
        {/* INTEGRATION: deep link to the thread in the source app (backend map row "Inbox-All…"); no link without a connection. */}
        <Button variant="secondary" disabled>Open in {m.sourceLabel}</Button>
      </Stack>
      <HubThread label={`Thread with ${m.from}`} messages={m.thread} />
      <Card variant="subtle" as="div">
        <Text variant="small" tone="secondary">{m.replyNote}</Text>
        <Field label="Your reply" multiline rows={3} value={inbox.replyOf(m)} error={inbox.error} onChange={(e) => inbox.setReply(m.id, e.target.value)} />
        <Stack direction="row" gap={2} wrap>
          <Button onClick={() => inbox.send(m)} disabled={outcome === 'sent'}>Send on {m.sourceLabel}</Button>
          {/* INTEGRATION: POST a rewrite request to the drafter (OpenRouter gateway); locally it restores the drafted reply. */}
          <Button variant="secondary" onClick={() => inbox.setReply(m.id, m.reply)}>Rewrite</Button>
        </Stack>
      </Card>
      {m.linked && <Text variant="small" tone="secondary">{m.linked}</Text>}
    </Stack>
  );
}
