/*
 * Data contract: Events (canvas v21 page "5 · Grow your reach", board Events, COMING SOON; ADR-012 #86; issue #90 row
 * "Events": source registry, plan templates by role, plan items are ordinary drafts). Backend map: not in
 * .agentic/what/context/backend_map.md yet (no events table or endpoint exists). Shapes: EventsData in ./types.ts,
 * BrandEvent in domain/event.ts, sources in config/eventSources.ts, drafts as Post (domain/post.ts).
 *
 * | Field         | Source                                                                                | Empty when          |
 * |---------------|---------------------------------------------------------------------------------------|---------------------|
 * | events[]      | GET /api/events (not built yet); Luma: GET /v1/calendars/events/list (Luma API)       | no events, no Luma  |
 * | events[].plan | plan template by role (domain/event.ts planTemplates)                                  | pending Luma events |
 * | drafts[]      | GET /api/drafts?event= (not built yet): the same drafts Create lists                  | nothing drafted     |
 * | lumaCalendar  | the connected calendar (GET /api/connections, not built yet)                          | Luma not connected  |
 * | today         | the viewer's local date (sample: 13 Oct 2026)                                          | never               |
 *
 * States (canvas note on the board): success = Upcoming with Luma events to accept; empty = no events (connect Luma or
 * add one); error = Luma disconnected; loading. The Past tab shows results; the role filter and Add an event work.
 */
import { Alert, Button, Grid } from '../../ui/primitives';
import { StateView } from '../../ui/composites/StateView';
import { EventAddForm } from '../../ui/domain/EventAddForm';
import { EventSourceCard } from '../../ui/domain/EventSourceCard';
import { GrowAreaCard } from '../../ui/domain/GrowAreaCard';
import { eventRoles, isEventRole } from '../../domain/event';
import { eventSourceStatus, findEventSource } from '../../config/eventSources';
import { GrowthFrame } from './components/GrowthFrame';
import { EventsControls } from './components/EventsControls';
import { EventsPending } from './components/EventsPending';
import { EventsTable } from './components/EventsTable';
import { dataLoaded, listState } from './listState';
import { growthArtboards, useGrowthLinks } from './paths';
import { useEvents } from './useEvents';
import type { EventsData, ScreenProps } from './types';

const luma = findEventSource('luma');
const roles = eventRoles.map((r) => ({ value: r.id, label: r.label }));

export function Events({ data, state = 'success' }: ScreenProps<EventsData>) {
  const flow = useEvents(data);
  const links = useGrowthLinks();
  const connect = <Button variant="secondary" href={links.to('Settings-Connections')}>{data.lumaCalendar ? 'Luma settings' : 'Connect Luma'}</Button>;
  // Luma being disconnected keeps the events in hand; while loading nothing is actionable.
  const loaded = dataLoaded(state, true);
  const add = <Button onClick={() => flow.setAdding(true)} disabled={flow.adding}>Add an event</Button>;
  return (
    <GrowthFrame artboard="Events" title="Events" tag="COMING SOON" actions={loaded && <>{connect}{add}</>}
      intro="Every event aDNA hosts, speaks at, sponsors or attends, with the content that makes it count."
      meta="Drawn, not built. Defined in: canvas v21 Events; event sources in config/eventSources.ts.">
      {state === 'error' && <Alert tone="danger" title="Luma is disconnected">New Luma events can’t arrive until you reconnect. Events already here stay. {connect}</Alert>}
      {loaded && flow.adding && (
        <EventAddForm roles={roles} onCancel={() => flow.setAdding(false)} onSubmit={(v) => {
          if (!isEventRole(v.role)) return;
          flow.add({ ...v, role: v.role });
          flow.setAdding(false);
          flow.setTab('upcoming');
        }} />
      )}
      <StateView state={listState(state === 'error' ? 'success' : state, flow.events.length)}
        loading={{ title: 'Loading events', body: 'Reading your Luma calendar and the events you added.' }}
        empty={{ title: 'No events yet', body: 'Connect your Luma calendar (needs Luma Plus), or add an event by hand. Each one gets a content plan.', actions: <>{connect}{add}</> }}>
        <EventsPending flow={flow} />
        <EventsControls flow={flow} />
        <EventsTable tab={flow.tab} events={flow.shown} drafts={flow.drafts} brainVersion={flow.brainVersion} onClear={() => flow.setRoleFilter('all')} />
      </StateView>
      <Grid min="md">
        <EventSourceCard title="From your Luma calendar" status={eventSourceStatus('luma')} facts={luma.facts} requirement={luma.requirement} unverified={luma.unverified}
          summary={data.lumaCalendar ? `${data.events.filter((e) => e.source.kind === 'luma').length} events synced from ${data.lumaCalendar} · new events arrive here to accept or skip.` : 'Not connected. Connect a calendar and its events arrive here to accept or skip.'} />
        <GrowAreaCard title="Past events, rated" body="After an event, rate it on the public events board, and see how others rated the ones you’re considering." links={[{ label: 'Events board', href: links.to(growthArtboards.eventsBoard) }]} />
      </Grid>
    </GrowthFrame>
  );
}
