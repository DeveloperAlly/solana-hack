import type { WorkbenchExample } from '../../system/example';
import { Grid } from '../primitives';
import { GrowAreaCard } from './GrowAreaCard';

// Copy from canvas v21 Grow-Home (Events and Partners and leads cards). Links stay on this page in the workbench.
export const example: WorkbenchExample = {
  id: 'D90',
  name: 'GrowAreaCard',
  description: 'A Grow area with its links; the first-run variant teaches its first action.',
  render: () => (
    <Grid min="sm">
      <GrowAreaCard
        title="Events"
        body="From your Luma calendar or added by hand. A content plan for before, during and after, with ambassadors who are going."
        links={[{ label: 'Events', href: '/system' }]}
      />
      <GrowAreaCard
        title="Partners and leads"
        body="Agencies on seats with chosen voices; people worth talking to, found from your audience."
        links={[{ label: 'Partners', href: '/system' }, { label: 'Leads', href: '/system' }]}
      />
      <GrowAreaCard
        title="Events (first run)"
        body="From your Luma calendar or added by hand."
        firstAction={{ text: 'Add your first event to get a content plan for it.', link: { label: 'Add an event', href: '/system' } }}
        links={[]}
      />
    </Grid>
  ),
};
