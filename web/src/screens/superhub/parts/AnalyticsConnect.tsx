import { Button, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { StatePanel } from '../../../ui/composites/StatePanel';
import type { ScreenState } from '../../../ui/composites/DemoStateSwitcher';
import { HubItemRow } from '../../../ui/domain/HubItemRow';
import { useConnections } from '../hooks/useConnections';
import type { AnalyticsData } from '../types';
import { ConnectionBanner } from './ConnectionBanner';
import { ConnectionStatus } from './ConnectionStatus';

export interface AnalyticsConnectProps {
  connect: AnalyticsData['connect'];
  state: ScreenState;
}

/**
 * Analytics-Empty (n-ane): connect each platform (D41 rows); a new connection shows "Collecting…" for about 24 h
 * (loading); a disconnected source says which dates are missing, with Reconnect (error).
 */
export function AnalyticsConnect({ connect, state }: AnalyticsConnectProps) {
  const { rows, banner, connect: link, reconnectFailed } = useConnections(connect.sources, state === 'error' ? connect.error : undefined, 'collecting');
  return (
    <Stack gap={4}>
      <Card labelledBy="analytics-connect" header={<Heading level={2} size="lg" id="analytics-connect">Connect your accounts to see performance</Heading>}>
        <Text tone="secondary">{connect.intro}</Text>
        <Stack as="ul" gap={0}>
          {rows.map((s) => (
            <HubItemRow key={s.id} as="li" aside={s.note && <Text as="span" variant="small" tone="secondary">{s.note}</Text>} actions={s.status === 'not-connected' ? <Button variant="secondary" onClick={() => link(s.id)}>Connect {s.name}</Button> : <ConnectionStatus status={s.status} />}>
              <Text>{s.name}</Text>
            </HubItemRow>
          ))}
        </Stack>
      </Card>
      {state === 'loading' && <StatePanel kind="loading" title="Collecting your first numbers" body="New connections show numbers after about 24 hours." />}
      {/* INTEGRATION: reconnect re-runs the provider OAuth (row "Settings › Connections"); the metrics cron backfills. */}
      <ConnectionBanner message={banner} onReconnect={reconnectFailed} />
    </Stack>
  );
}
