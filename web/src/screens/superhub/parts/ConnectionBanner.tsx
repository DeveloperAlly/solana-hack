import { Badge } from '../../../ui/primitives/Badge';
import { Button, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';

export interface ConnectionBannerProps {
  message?: string;
  onReconnect: () => void;
}

/** The "Error" box for a broken source (Inbox-Connect, Analytics-Empty): what broke, in plain words, and Reconnect. */
export function ConnectionBanner({ message, onReconnect }: ConnectionBannerProps) {
  if (!message) return null;
  return (
    <Card as="div" variant="emphasis">
      <Stack direction="row" gap={3} align="center" wrap>
        <Badge tone="warning">Error</Badge>
        <Text role="alert">{message}</Text>
        <Button onClick={onReconnect}>Reconnect</Button>
      </Stack>
    </Card>
  );
}
