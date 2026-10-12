/*
 * Data contract: Settings-Connections (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Settings-Connections; issue #51)
 * Backend map §4 row "Settings › Connections": GET /api/connect/{x,linkedin}/start and /callback,
 * DELETE /api/connections/:id; payout wallet: POST /api/wallets/link, PUT/DELETE /api/brands/:id/payout-wallet.
 * Tables connections, wallets, wallet_challenges, brands. Inventory D52 PublishingConnection. Shape: SettingsConnectionsData.
 *
 * | Field            | Source                                                     | Empty when                   |
 * |------------------|------------------------------------------------------------|------------------------------|
 * | connections[]    | connections rows per channel: status connected / expired   | none linked: all not-connected |
 * | fallback         | Static row: manual copy and paste back (always available)  | never                        |
 * | wallet.address   | brands.payout_wallet (owner only, active brand)            | not linked: "[address]"      |
 * | wallet.status    | linked when brands.payout_wallet is set                    | not linked                   |
 *
 * States: success, empty (nothing connected), loading.
 */
import { Heading, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SoonPage } from './SoonPage';
import { List, ListRow } from '../../ui/composites/ListRow';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { StateView } from '../../ui/composites/StateView';
import { useSoonSession } from './useSoonSession';
import { StatusToggleButton } from './StatusToggleButton';
import { soonStatus, type SoonStatusId } from './status';
import type { SettingsConnectionsData, StatusRowItem } from './types';

export function SettingsConnections({ data, state = 'success' }: { data: SettingsConnectionsData; state?: ScreenState }) {
  const [session, set] = useSoonSession();
  const base: StatusRowItem[] = [...data.connections, { id: 'wallet', name: data.wallet.address, status: data.wallet.status }];
  const rows = base.map((r) => ({ ...r, status: session.connections?.[r.id] ?? r.status }));
  const onToggle = (id: string, next: SoonStatusId) => set({ connections: { ...session.connections, [id]: next } });
  const row = (r: StatusRowItem) => <ListRow key={r.id} title={r.name} detail={r.detail} status={soonStatus[r.status]} actions={<StatusToggleButton row={r} onToggle={onToggle} />} />;
  const channels = rows.filter((r) => r.id !== 'wallet');
  const wallet = rows.filter((r) => r.id === 'wallet');
  return (
    <SoonPage artboard="Settings-Connections" header={{ title: 'Settings', intro: 'Accounts JamJam publishes to, and where ambassador payouts come from.', definedIn: 'component inventory D52; backend map, Settings › Connections; ADR-006 (wallet only for payouts)' }}>
      <StateView state={state} loading={{ title: 'Loading connections', body: 'Checking each publishing account.' }}>
        <Card header={<Heading level={2} size="lg">Publishing</Heading>}>
          <List label="Publishing connections">
            {channels.map(row)}
            <ListRow title={data.fallback.name} detail={data.fallback.detail} status={soonStatus[data.fallback.status]} />
          </List>
        </Card>
        <Card header={<Heading level={2} size="lg">Payout wallet (owner only)</Heading>}>
          <Text tone="secondary">Ambassador payouts in USDC come from this wallet. Signing in never needs a wallet.</Text>
          <List label="Payout wallet">{wallet.map(row)}</List>
          <Text variant="small" tone="secondary">Linking asks the wallet to sign a message. Only the brand owner can link, change or pay from it.</Text>
        </Card>
      </StateView>
    </SoonPage>
  );
}
