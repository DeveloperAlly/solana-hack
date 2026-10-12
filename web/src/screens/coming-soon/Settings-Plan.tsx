/*
 * Data contract: Settings-Plan (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Settings-Plan; issue #51)
 * Backend map §4 row "Settings › Plan": GET …/plan, tables brands, memberships; G-BILLING (provider not chosen).
 * Inventory D55 PlanSeats. Shape: SettingsPlanData in ./types.
 *
 * | Field            | Source                                                         | Empty when              |
 * |------------------|----------------------------------------------------------------|-------------------------|
 * | plan             | GET …/plan -> plan name                                        | never (Free at least)   |
 * | planNames        | Paid tier names (canvas Pricing): shown once Upgrade took payment | never           |
 * | seats            | memberships count of paid seats; partners and ambassadors free | never                   |
 * | nextBill         | billing provider (not chosen) -> amount and date               | free plan               |
 * | billingProvider  | Static copy until G-BILLING is decided                         | never                   |
 * | invoices[]       | billing provider invoices                                      | no invoices yet         |
 *
 * States: success, empty (no invoices), loading, error.
 */
import { useState } from 'react';
import { Button, Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DataTable } from '../../ui/composites/DataTable';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import { SoonPage } from './SoonPage';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { useSoonRoutes } from './routes';
import { downloadText } from './download';
import { tableState } from './tableState';
import { useSoonSession } from './useSoonSession';
import type { Invoice, SettingsPlanData } from './types';

export function SettingsPlan({ data, state = 'success' }: { data: SettingsPlanData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const [showBilling, setShowBilling] = useState(false);
  const [session] = useSoonSession();
  // After paying on Upgrade, the plan shown is the one paid for (session); otherwise the fixture default.
  const plan = session.paid && session.plan ? data.planNames[session.plan] : data.plan;
  // INTEGRATION: the billing provider's invoice PDF (G-BILLING); until then a text summary is saved locally.
  const download = (inv: Invoice) => downloadText(`jamjam-invoice-${inv.id}.txt`, `JamJam invoice\nDate: ${inv.date}\nAmount: ${inv.amount}\n`);
  return (
    <SoonPage artboard="Settings-Plan" header={{ title: 'Settings', intro: 'Your plan, seats and billing.', definedIn: 'component inventory D55; backend map, Settings › Plan; G-BILLING (provider not chosen)' }}>
      <Card>
        <KeyValueList
          label="Plan and billing"
          items={[
            { label: 'Plan', value: <Stack direction="row" gap={3} wrap><span>{plan}</span><Link href={routes.pricing}>Change plan</Link></Stack> },
            { label: 'Seats', value: <Stack gap={1}><span>{data.seats}</span><Text variant="small" tone="secondary">Partners and ambassadors are free seats (ADR-003)</Text></Stack> },
            {
              label: 'Next bill',
              value: (
                <Stack direction="row" gap={3} wrap align="center">
                  <span>{data.nextBill}</span>
                  <Button variant="secondary" aria-expanded={showBilling} onClick={() => setShowBilling((v) => !v)}>Billing details</Button>
                </Stack>
              ),
            },
          ]}
        />
        {showBilling && <Text tone="secondary">{data.billingProvider}</Text>}
      </Card>
      <Card header={<Heading level={2} size="lg">Invoices</Heading>}>
        <DataTable<Invoice>
          caption="Invoices"
          hideCaption
          columns={[{ key: 'date', header: 'Date', rowHeader: true }, { key: 'amount', header: 'Amount' }]}
          rows={data.invoices}
          rowKey={(r) => r.id}
          state={tableState[state]}
          empty={<Text tone="secondary">No invoices yet. They appear here after your first bill.</Text>}
          error={<Text tone="danger">Could not load invoices. Try again in a minute.</Text>}
          actions={(inv) => <Button variant="secondary" aria-label={`Download invoice ${inv.date}`} onClick={() => download(inv)}>Download</Button>}
        />
      </Card>
    </SoonPage>
  );
}
