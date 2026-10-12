import { Badge } from '../../../ui/primitives/Badge';
import { Button, Field, Stack, Text } from '../../../ui/primitives';
import { Menu } from '../../../ui/composites/Menu';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { HubItemRow } from '../../../ui/domain/HubItemRow';
import type { InboxState } from '../hooks/useInbox';

/** Inbox-All middle column: search, the Filters menu, bulk Done for checked rows, and the message rows (D38). */
export function MessageList({ inbox }: { inbox: InboxState }) {
  return (
    <Stack as="section" gap={3} aria-label="Messages">
      <Stack direction="row" gap={2} align="end" wrap>
        <Field label="Search all messages" type="search" value={inbox.query} onChange={(e) => inbox.setQuery(e.target.value)} />
        <Menu trigger="Filters" items={[{ id: 'unread', label: 'Unread only', checked: inbox.unreadOnly }]} onSelect={() => inbox.setUnreadOnly(!inbox.unreadOnly)} />
      </Stack>
      {inbox.checked.length > 0 && (
        <Stack direction="row" gap={3} align="center">
          <Text variant="small">{inbox.checked.length} selected</Text>
          <Button variant="secondary" onClick={inbox.doneChecked}>Mark done</Button>
        </Stack>
      )}
      {inbox.visible.length === 0 && <EmptyState title="No messages here" body="Nothing matches this view. Try another source or clear the search." />}
      <Stack as="ul" gap={0}>
        {inbox.visible.map((m) => (
          <HubItemRow
            key={m.id}
            as="li"
            selected={m.id === inbox.open?.id}
            unread={m.unread}
            lead={<><input type="checkbox" aria-label={`Select ${m.from}`} checked={inbox.checked.includes(m.id)} onChange={() => inbox.toggleChecked(m.id)} /><Badge>{m.sourceLabel}</Badge></>}
            aside={<Text variant="small">{inbox.outcomeOf(m.id) === 'sent' ? 'Replied' : m.time}</Text>}
            onSelect={() => inbox.openThread(m.id)}
          >
            <Text as="span" variant="label" truncate>{m.from}</Text>
            <Text as="span" variant="small" tone="secondary" truncate>{m.preview}</Text>
          </HubItemRow>
        ))}
      </Stack>
    </Stack>
  );
}
