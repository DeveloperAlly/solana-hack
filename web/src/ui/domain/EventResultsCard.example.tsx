import type { WorkbenchExample } from '../../system/example';
import { Grid } from '../primitives';
import { EventResultsCard } from './EventResultsCard';

// Sample results; reach shows "Not available" where a platform does not share it (canvas note n-c2).
export const example: WorkbenchExample = {
  id: 'D99',
  name: 'EventResultsCard',
  description: 'Results before the event (pending) and after it, with reach not available.',
  render: () => (
    <Grid min="sm">
      <EventResultsCard results={null} pending="Appear after the event: posts verified, reach, leads, cost." link={{ label: 'Learn', href: '/system' }} />
      <EventResultsCard title="Results (after)" results={{ postsVerified: 6, reach: null, leads: 4, costUsdc: 120 }} pending="" />
    </Grid>
  ),
};
