import type { WorkbenchExample } from '../../system/example';
import { Badge, Button, Stack, Text } from '../primitives';
import { HubItemRow } from './HubItemRow';

export const example: WorkbenchExample = {
  id: 'D38',
  name: 'HubItemRow',
  description: 'Default with aside and action, selected and unread.',
  render: () => (
    <Stack as="ul" gap={0}>
      <HubItemRow as="li" lead={<Badge>X post</Badge>} aside={<Text variant="small">On-brand 92%</Text>} actions={<Button href="/system">Review</Button>}>
        <Text>"Your agent didn't forget. It was never told. Here's the fix."</Text>
      </HubItemRow>
      <HubItemRow as="li" lead={<Badge>Telegram</Badge>} aside={<Text variant="small">09:41</Text>} selected unread>
        <Text truncate>Still up for the co-marketing post next week?</Text>
      </HubItemRow>
    </Stack>
  ),
};
