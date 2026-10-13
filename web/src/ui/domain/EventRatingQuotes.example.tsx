import type { WorkbenchExample } from '../../system/example';
import { Grid, Link } from '../primitives';
import { EventRatingQuotes } from './EventRatingQuotes';

// Lines from canvas v21 Event-Rating; the organiser is bracketed.
export const example: WorkbenchExample = {
  id: 'D101',
  name: 'EventRatingQuotes',
  description: 'Attendee lines with proof and registration; an edited one with its earlier version and a reply; a removed one as a tombstone; none yet.',
  render: () => (
    <Grid min="sm">
      <EventRatingQuotes
        title="What attendees said"
        empty="No ratings yet."
        quotes={[
          { id: '1', line: '“Pitched to for three hours. No builders in the room.”', meta: 'Attendee · checked in · rated 2', registered: <Link href="/system">registered</Link> },
          { id: '2', line: '“Venue and food were good; the ‘investor table’ was sales.”', meta: 'Attendee · checked in · rated 3', registered: <Link href="/system">registered</Link>, reply: { organiser: '[Organiser]', text: '“Thanks; next year the investor table will be curated.”' }, earlier: [{ id: '2a', line: '“The ‘investor table’ was sales.”', meta: 'Version 1 · rated 2 · [date]' }] },
          { id: '3', line: '', meta: 'Attendee · checked in', registered: <Link href="/system">registered</Link>, removed: { at: '[date]', reason: 'Named a private person; removed after a report, reviewed by a person.' } },
        ]}
      />
      <EventRatingQuotes title="What attendees said (none yet)" empty="No ratings yet. Ratings open after the event ends." quotes={[]} />
    </Grid>
  ),
};
