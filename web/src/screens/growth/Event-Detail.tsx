/*
 * Data contract: Event-Detail (canvas v21 page "5 · Grow your reach", board Event-Detail, COMING SOON; ADR-012 #86;
 * issue #90 row "Events"). Backend map: not in .agentic/what/context/backend_map.md yet (no events endpoint). Shapes:
 * EventDetailData in ./types.ts; BrandEvent and planTemplates in domain/event.ts; drafts as Post (domain/post.ts).
 *
 * | Field            | Source                                                                         | Empty when            |
 * |------------------|--------------------------------------------------------------------------------|-----------------------|
 * | event            | GET /api/events/:id (not built yet); Luma: GET /v1/events/get (Luma API)       | never: opened on one  |
 * | event.plan       | the role's plan template (domain/event.ts)                                      | plan not made yet     |
 * | drafts           | GET /api/drafts?event= (not built yet): ordinary drafts, reviewed like any     | nothing drafted       |
 * | event.guests     | Luma: GET /v1/events/guests/list (Luma API); null for hand-added events         | hand-added            |
 * | event.going      | ambassadors who said yes (Grow › Ambassadors, not built yet)                   | nobody asked          |
 * | event.results    | after the event: verified posts (registry), reach, leads, cost (not built yet) | before it ends        |
 *
 * States (canvas note on the board): before (plan) is the default event; on the day and after are other events
 * (`?event=ev-clinic`, `?event=ev-main-stage`); error = Luma cancelled the event (banner); empty = plan not made yet;
 * loading. The role select swaps the plan template; plan items take their status from their drafts.
 */
import { Alert, Button, Stack } from '../../ui/primitives';
import { Columns } from '../../ui/layouts/Columns';
import { StateView } from '../../ui/composites/StateView';
import { EventPeopleCard } from '../../ui/domain/EventPeopleCard';
import { EventResultsCard } from '../../ui/domain/EventResultsCard';
import { GrowAreaCard } from '../../ui/domain/GrowAreaCard';
import { roleLabel } from '../../domain/event';
import { GrowthFrame } from './components/GrowthFrame';
import { EventKpis } from './components/EventKpis';
import { EventPlan } from './components/EventPlan';
import { eventDay, eventTime } from './eventPlan';
import { dataLoaded, listState } from './listState';
import { growthArtboards, useGrowthLinks } from './paths';
import { useEventDetail } from './useEventDetail';
import type { EventDetailData, ScreenProps } from './types';

const timingAlert = {
  before: null,
  live: <Alert tone="info" title="Happening today">Your live posts are ready to go out as it happens.</Alert>,
  after: <Alert tone="success" title="This event has ended">Recap and follow-up are due. Results are in, and you can rate it.</Alert>,
};

export function EventDetail({ data, state = 'success' }: ScreenProps<EventDetailData>) {
  const flow = useEventDetail(data);
  const links = useGrowthLinks();
  const e = flow.event;
  const role = e.role ? `you’re ${roleLabel(e.role).toLowerCase()}` : 'role not set';
  // A cancelled event (the error state) is still in hand; while loading nothing is actionable.
  const loaded = dataLoaded(state, true);
  const review = loaded && flow.needsYou > 0 && <Button href={links.to('Draft-Review')}>Review {flow.needsYou} {flow.needsYou === 1 ? 'post' : 'posts'}</Button>;
  const aside = (
    <Stack gap={4}>
      <EventPeopleCard title="Who’s going" people={e.going} empty="No ambassadors asked yet." link={{ label: 'Invite more ambassadors', href: links.to('Dashboard') }} />
      <EventResultsCard results={flow.timing === 'after' ? e.results : null} pending="Appear after the event: posts verified, reach, leads, cost. Learn compares events so you know which are worth it." link={{ label: 'Learn', href: links.to('Analytics') }} />
      <GrowAreaCard title="Was it worth it?" body="After the event, rate it on the public events board." links={[{ label: 'Rate this event', href: e.boardId ? links.rating(e.boardId) : links.to(growthArtboards.eventsBoard) }]} />
    </Stack>
  );
  return (
    <GrowthFrame artboard="Event-Detail" under="Events" title={e.name} tag="COMING SOON"
      intro={`${eventDay(e.startsAt)} · ${eventTime(e.startsAt)} · ${e.place} · ${e.source.kind === 'luma' ? 'from Luma' : 'added by hand'} · ${role}`}
      meta="Drawn, not built. Every post goes through the same checks and approval as any draft. Defined in: canvas v21 Event-Detail."
      back={{ href: links.to(growthArtboards.events), label: 'All events' }} actions={review}>
      {e.cancelled && <Alert tone="danger" title="Luma says this event was cancelled">Its posts are paused and nothing will be scheduled for it. Change the plan or remove the event.</Alert>}
      {!e.cancelled && timingAlert[flow.timing]}
      {loaded && <EventKpis flow={flow} />}
      <Columns end={loaded && aside}>
        <StateView state={listState(state, flow.phases.length)} loading={{ title: 'Loading the plan', body: 'Reading the event and its drafts.' }}
          empty={{ title: 'No content plan yet', body: 'Make the plan from your role’s template. Every post goes to approval.', actions: <Button onClick={flow.makePlan}>Make the plan</Button> }}>
          <EventPlan phases={flow.phases} onDraft={flow.draftItem} />
        </StateView>
      </Columns>
    </GrowthFrame>
  );
}
