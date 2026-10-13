import { Button } from '../../../ui/primitives';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { StatePanel } from '../../../ui/composites/StatePanel';
import type { ScreenState } from '../../../ui/composites/DemoStateSwitcher';
import { growthArtboards, useGrowthLinks } from '../paths';
import type { EventDetailLookup } from '../useEventDetail';
import { GrowthFrame } from './GrowthFrame';

/** What Event-Detail says without an event: `?event=` names no event, or the brand has none yet. */
const absent = {
  missing: { title: 'Event not found', heading: 'No event with that id', body: 'It may have been removed. Your events, and the ones you add, are on Events.' },
  none: { title: 'No events yet', heading: 'No events yet', body: 'Add one from Luma or by hand on Events, and its plan opens here.' },
};

export interface EventDetailAbsentProps {
  lookup: Exclude<EventDetailLookup, { kind: 'found' }>;
  state: ScreenState;
}

/** Event-Detail with no event to show. Loading and error still win (screens/resolveState.ts precedence). */
export function EventDetailAbsent({ lookup, state }: EventDetailAbsentProps) {
  const links = useGrowthLinks();
  const copy = absent[lookup.kind];
  const events = links.to(growthArtboards.events);
  return (
    <GrowthFrame artboard="Event-Detail" under="Events" title={copy.title} tag="COMING SOON" back={{ href: events, label: 'All events' }}>
      {state === 'loading' && <StatePanel kind="loading" title="Loading the event" body="Reading the event and its drafts." />}
      {state === 'error' && <StatePanel kind="error" title="Couldn’t load this event" body="Nothing changed. Try again in a minute." />}
      {state !== 'loading' && state !== 'error' && <EmptyState title={copy.heading} body={copy.body} actions={<Button href={events}>All events</Button>} />}
    </GrowthFrame>
  );
}
