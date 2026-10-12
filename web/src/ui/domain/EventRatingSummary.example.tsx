import type { WorkbenchExample } from '../../system/example';
import { Grid } from '../primitives';
import { EventRatingSummary } from './EventRatingSummary';

// Figures from canvas v21 Event-Rating ([Summit] VIP dinner, 41 ratings).
export const example: WorkbenchExample = {
  id: 'D100',
  name: 'EventRatingSummary',
  description: 'An event’s score by question; and no ratings yet.',
  render: () => (
    <Grid min="sm">
      <EventRatingSummary summary={{ count: 41, removed: 1, averages: { talks: 1.8, run: 3.4, people: 2.0, sponsors: 1.6, again: 2.1 } }} />
      <EventRatingSummary title="Score (no ratings)" summary={{ count: 0, removed: 0, averages: null }} />
    </Grid>
  ),
};
