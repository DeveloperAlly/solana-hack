import type { WorkbenchExample } from '../../system/example';
import { Grid } from '../primitives';
import { EventPeopleCard } from './EventPeopleCard';

// Names bracketed, as canvas v21 Event-Detail draws them.
export const example: WorkbenchExample = {
  id: 'D98',
  name: 'EventPeopleCard',
  description: 'Who’s going: people listed, and nobody yet.',
  render: () => (
    <Grid min="sm">
      <EventPeopleCard title="Who’s going" empty="Nobody yet." people={[{ id: '1', name: '[Founder name]', role: 'speaking' }, { id: '2', name: '[Creator name]', role: 'ambassador' }]} link={{ label: 'Invite more ambassadors', href: '/system' }} />
      <EventPeopleCard title="Who’s going (nobody yet)" empty="No ambassadors asked yet." people={[]} />
    </Grid>
  ),
};
