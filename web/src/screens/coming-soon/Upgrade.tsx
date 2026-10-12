/*
 * Data contract: Upgrade (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Upgrade; issue #51)
 * Backend map G-BILLING (provider not chosen) and §4 row "Settings › Plan" (GET …/plan after paying).
 * Shape: UpgradeData in ./types.
 *
 * | Field      | Source                                                        | Empty when          |
 * |------------|---------------------------------------------------------------|---------------------|
 * | tiers      | Per paid tier: name and price; the tier chosen on Pricing (session) picks one | never     |
 * | defaultPlan| The tier shown when none was chosen on Pricing                | never               |
 * | cardForm   | The billing provider's embedded card form (not chosen)        | never               |
 * | keepNote   | Static copy (canvas)                                          | never               |
 * | failure    | Billing provider decline reason                               | payment succeeded   |
 *
 * States: success (form, then paid), loading (payment running), error (payment failed: not charged).
 */
import { useState } from 'react';
import { Alert, Button, Grid, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { StatePanel } from '../../ui/composites/StatePanel';
import { SoonPage } from './SoonPage';
import { InlineForm } from '../../ui/composites/InlineForm';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { StateView } from '../../ui/composites/StateView';
import { useSoonSession } from './useSoonSession';
import { useSoonRoutes } from './routes';
import { email } from './validate';
import type { UpgradeData } from './types';

type Phase = 'form' | 'paid' | 'failed';

export function Upgrade({ data, state = 'success' }: { data: UpgradeData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const [phase, setPhase] = useState<Phase>(state === 'error' ? 'failed' : 'form');
  const [session, set] = useSoonSession();
  const tier = data.tiers[session.plan ?? data.defaultPlan];
  const name = tier.name;
  // INTEGRATION: the billing provider's checkout (G-BILLING); the error state stands in for a decline.
  const pay = () => {
    if (state === 'error') return setPhase('failed');
    set({ plan: session.plan ?? data.defaultPlan, paid: true });
    setPhase('paid');
  };
  return (
    <SoonPage header={{ title: `Upgrade to ${name}`, intro: 'One page from choosing a plan to paid.', definedIn: 'backend map G-BILLING (provider not chosen); issue #51' }}>
      <StateView state={state} loading={{ title: 'Taking payment', body: 'Waiting for the billing provider. Do not close this page.' }}>
        {phase === 'paid' ? (
          <StatePanel kind="success" title={`You're on ${name}`} body={data.keepNote} actions={<Button href={routes.settingsPlan}>See your plan</Button>} />
        ) : (
          <Grid min="lg" gap={5}>
            <Card header={<Heading level={2} size="lg">Payment</Heading>}>
              <Stack gap={4}>
                {phase === 'failed' && <Alert tone="danger" title="Payment failed">{data.failure}</Alert>}
                <Card variant="dashed" as="div"><Text tone="secondary">{data.cardForm}</Text></Card>
                <InlineForm surface="card"
                  label="Billing"
                  fields={[{ name: 'email', label: 'Billing email', type: 'email', validate: email }]}
                  submitLabel={`Pay ${tier.price} and upgrade`}
                  onSubmit={pay}
                />
              </Stack>
            </Card>
            <Card variant="subtle" header={<Heading level={2} size="lg">{name}, monthly</Heading>}>
              <Text>{tier.price} / month · cancel any time</Text>
              <Text tone="secondary">{data.keepNote}</Text>
              <Button href={routes.pricing} variant="secondary">Compare plans</Button>
            </Card>
          </Grid>
        )}
      </StateView>
    </SoonPage>
  );
}
