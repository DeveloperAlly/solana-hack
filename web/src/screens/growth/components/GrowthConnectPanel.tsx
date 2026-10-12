import { useId } from 'react';
import type { Platform } from '../../../config/platforms';
import { Badge, Button, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { platformStatusChip } from '../platformStatus';

export interface GrowthConnectPanelProps {
  platform: Platform;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  /** Shown for platforms with an inbox plan (messaging connects on Inbox-Connect). */
  messagingNote?: string;
}

/** How to connect a platform, its status, and Connect or Disconnect (a preview: nothing really connects yet). */
export function GrowthConnectPanel({ platform, connected, onConnect, onDisconnect, messagingNote }: GrowthConnectPanelProps) {
  const headingId = useId();
  const chip = platformStatusChip(platform);
  return (
    <Card labelledBy={headingId} header={<Heading level={2} size="lg" id={headingId}>Connect</Heading>}>
      <Stack gap={3}>
        <Stack direction="row" gap={2} wrap align="center">
          <Badge tone={chip.tone}>{chip.label}</Badge>
          <Badge>{connected ? 'Connected (preview)' : 'Not connected'}</Badge>
        </Stack>
        <Text>How: {platform.connect}</Text>
        <Text variant="small" tone="secondary">Preview only: no account connects and nothing publishes until this platform is live.</Text>
        {messagingNote && platform.plans.includes('inbox') && <Text variant="small" tone="secondary">{messagingNote}</Text>}
        <div>
          {connected ? (
            <Button variant="secondary" onClick={onDisconnect}>Disconnect {platform.name}</Button>
          ) : (
            <Button onClick={onConnect}>Connect {platform.name}</Button>
          )}
        </div>
      </Stack>
    </Card>
  );
}
