/*
 * Data contract: Pricing (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Pricing; issue #51)
 * Backend map G-BILLING: no billing provider yet, so this page is static. Shape: PricingData in ./types.
 *
 * | Field           | Source                                                              | Empty when |
 * |-----------------|---------------------------------------------------------------------|------------|
 * | tiers[].name    | Static: tiers drawn on the canvas board Pricing (owner to decide)   | never      |
 * | tiers[].price   | Static placeholder "[price]" until the owner sets prices            | never      |
 * | tiers[].note    | .agentic/what/context/research/10_competitor_onboarding_pricing.md §6 | no note  |
 * | footnote        | Static copy (canvas)                                                | never      |
 *
 * Public page (PublicShell). States: success only (static content, no request).
 */
import { Container, Grid, Stack, Text } from '../../ui/primitives';
import { PublicShell } from '../../ui/shells/PublicShell';
import { SoonPageHeader } from '../../ui/domain/SoonPageHeader';
import { SoonPlanTier } from '../../ui/domain/SoonPlanTier';
import { useSoonRoutes, type SoonRoute } from './routes';
import type { PlanTier, PricingData } from './types';

const tierRoute: Record<PlanTier['id'], SoonRoute> = { free: 'main', solo: 'upgrade', team: 'upgrade' };

export function Pricing({ data }: { data: PricingData }) {
  const routes = useSoonRoutes();
  return (
    <PublicShell>
      <Container width="app">
        <Stack gap={6}>
          <SoonPageHeader
            title="Pricing"
            intro="Start free. Pay when you post every week."
            definedIn="backend map G-BILLING; research 10 §6 price bands; tiers from the canvas (owner to decide)"
          />
          <Grid min="md" gap={5}>
            {data.tiers.map((t) => (
              <SoonPlanTier key={t.id} name={t.name} price={t.price} features={t.features} cta={t.cta} note={t.note} href={routes[tierRoute[t.id]]} featured={t.id === 'solo'} />
            ))}
          </Grid>
          <Text tone="secondary">{data.footnote}</Text>
        </Stack>
      </Container>
    </PublicShell>
  );
}
