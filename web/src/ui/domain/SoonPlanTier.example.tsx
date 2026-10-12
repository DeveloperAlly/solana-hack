import type { WorkbenchExample } from '../../system/example';
import { Grid } from '../primitives';
import { SoonPlanTier } from './SoonPlanTier';

export const example: WorkbenchExample = {
  id: 'D-UI5',
  name: 'SoonPlanTier',
  description: 'Default and featured tiers; prices stay placeholders (G-BILLING).',
  render: () => (
    <Grid min="sm" gap={4}>
      <SoonPlanTier level={4} name="Free" price="$0" features="Brand kit v1, registered" cta="Start free" href="/screens/Main" />
      <SoonPlanTier level={4} name="Solo" price="[price] / month" features="Unlimited drafts" cta="Choose Solo" href="/screens/Upgrade" featured note="Market band: research 10 §6" />
    </Grid>
  ),
};
