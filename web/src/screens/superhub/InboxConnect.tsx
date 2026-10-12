/*
 * Data contract: Inbox-Connect (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * Inbox-Connect, note n-inb3). Shape: InboxConnectData in ./types.ts. Backend map §4 rows "Inbox-All, Inbox-NeedsReply,
 * Inbox-Connect (coming soon)" (inbox_threads) and "Settings › Connections" (connections; connect start and callback).
 *
 * | Field             | Source                                                                                       |
 * |-------------------|----------------------------------------------------------------------------------------------|
 * | error             | The source in sync error and why (connections status), shown with Reconnect; clears when     |
 * |                   | that source is connected again                                                               |
 * | sources[].sees    | The adapter's capability text (n-inb3 1–3). Verified: WhatsApp, Telegram bot; [brackets] =   |
 * |                   | access still to confirm                                                                      |
 * | sources[].status  | connections: connected, connected (bot), sync error, not connected                           |
 *
 * States (board title "connect sources (empty + error)"): error = a source stopped syncing (as drawn);
 * empty = nothing connected yet.
 */
import { Button, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DataTable } from '../../ui/composites/DataTable';
import { Menu } from '../../ui/composites/Menu';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { ConnectionBanner } from './parts/ConnectionBanner';
import { ConnectionStatus } from './parts/ConnectionStatus';
import { useConnections } from './hooks/useConnections';
import { useHubLinks } from './paths';
import type { InboxConnectData, SourceConnection } from './types';

export function InboxConnect({ data }: { data: InboxConnectData }) {
  const links = useHubLinks();
  const { rows, banner, connect, disconnect, reconnectFailed } = useConnections(data.sources, data.error);
  const action = (s: SourceConnection) => {
    if (s.status === 'not-connected') return <Button variant="secondary" onClick={() => connect(s.id)}>Connect</Button>;
    if (s.status === 'sync-error') return <Button onClick={() => connect(s.id)}>Reconnect</Button>;
    return <Menu trigger="Settings" triggerLabel={`${s.name} settings`} items={[{ id: 'disconnect', label: 'Disconnect' }]} onSelect={() => disconnect(s.id)} align="end" />;
  };
  return (
    <HubPage artboard="Inbox-Connect">
      <PageHeader badges={<ComingSoonFlag tag="STRETCH" />} title="Bring your messages into one inbox" intro="Connect each place people message you. We show exactly what each connection can see." />
      <ConnectionBanner message={banner} onReconnect={reconnectFailed} />
      <Card as="div">
        <DataTable
          caption="Sources and what each can see"
          hideCaption
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            { key: 'name', header: 'Source', rowHeader: true },
            { key: 'sees', header: 'What we can see', cell: (r) => <Text variant="small">{r.sees}</Text> },
            { key: 'status', header: 'Status', cell: (r) => <ConnectionStatus status={r.status} /> },
          ]}
          actions={action}
        />
      </Card>
      <Button href={links.inboxAll}>Go to inbox</Button>
    </HubPage>
  );
}
