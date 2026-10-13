/*
 * Data contract: Event-Rating (canvas v21 board Event-Rating, ROADMAP; on page "5 · Grow your reach" since canvas v22,
 * with the public shell). One rating per attendee per event, made after attendance proof; editable by its author only.
 * Backend map: not in .agentic/what/context/backend_map.md (nothing is built). Shapes: EventRatingData in ./types.ts;
 * the rating, proof state machine and gate in domain/rating.ts.
 *
 * | Field                | Source                                                                         | Empty when      |
 * |----------------------|--------------------------------------------------------------------------------|-----------------|
 * | event                | GET /api/board/events/:id (not built yet)                                      | never           |
 * | event.summary        | registered ratings, aggregated (not built yet)                                 | no ratings yet  |
 * | event.ratings[]      | registered ratings with their line and proof kind (not built yet)              | no ratings yet  |
 * | event.replies[]      | verified organiser replies (not built yet)                                     | none            |
 * | attendance (proof)   | Luma check-in (per-ticket checked_in_at, Luma API changelog) or the guest list | not proven      |
 *
 * States (canvas note on the board): success; empty = no ratings yet; loading; error. Not an attendee (proof failed),
 * already rated (edit) and event upcoming (`?event=b-night`) come from the proof, the session and the event.
 */
import { Columns } from '../../ui/layouts/Columns';
import { StateView } from '../../ui/composites/StateView';
import { EventRatingSummary } from '../../ui/domain/EventRatingSummary';
import { EventRatingQuotes } from '../../ui/domain/EventRatingQuotes';
import { Link } from '../../ui/primitives';
import { currentVersion, overallScore, registeredLabel } from '../../domain/rating';
import { PublicFrame } from './components/PublicFrame';
import { RatePanel } from './components/RatePanel';
import { growthArtboards, useGrowthLinks } from './paths';
import { useEventRating } from './useEventRating';
import type { EventRatingData, ScreenProps } from './types';

export function EventRating({ data, state = 'success' }: ScreenProps<EventRatingData>) {
  const flow = useEventRating(data);
  const links = useGrowthLinks();
  const e = flow.event;
  const registry = <Link href={links.to('Ledger')}>registry (not built yet)</Link>;
  // Opened from a brand's Events or Event-Detail, the way back is to that brand's events; a standalone visit's is the board.
  const back = data.fromBrand
    ? { href: links.to(growthArtboards.events), label: `${data.fromBrand} events` }
    : { href: links.carry(growthArtboards.eventsBoard), label: 'All events' };
  const quotes = e.ratings.map((r) => {
    const reply = e.replies.find((x) => x.ratingId === r.id);
    const now = currentVersion(r);
    const proof = r.proof === 'luma-checkin' ? 'checked in' : 'on the guest list';
    return {
      id: r.id, line: now.line, registered: registry,
      meta: r.removal ? `${r.author} · ${proof}` : `${r.author} · ${proof} · rated ${overallScore(now.scores).toFixed(0)}`,
      earlier: r.removal ? [] : r.versions.slice(0, -1).map((v, i) => ({ id: `${r.id}-v${i + 1}`, line: v.line, meta: `Version ${i + 1} · rated ${overallScore(v.scores).toFixed(0)} · ${v.at}` })),
      removed: r.removal && { at: r.removal.at, reason: r.removal.reason },
      reply: reply && { organiser: reply.organiser, text: reply.text },
    };
  });
  return (
    <PublicFrame tag="ROADMAP" title={e.name} back={back}
      intro={`${e.place} · ${e.when} · organiser ${e.organiser} · ${registeredLabel(e.summary)}`}
      meta="Roadmap: designed, not built. One rating per attendee per event; only its author can edit it, and each edit is a new version with the earlier ones kept. Defined in: canvas v26 Event-Rating.">
      <StateView state={state === 'empty' ? 'success' : state} loading={{ title: 'Loading ratings', body: 'Reading this event’s attendee ratings.' }}
        error={{ title: 'Could not load ratings', body: 'Ratings could not be read. Reload the page in a minute.' }}
        >
        <Columns end={<EventRatingQuotes title="What attendees said" quotes={quotes} empty="No ratings yet." />} ratio="1-1">
          <EventRatingSummary summary={e.summary} />
        </Columns>
        {/* One rating per attendee: create or edit is decided on the loaded ratings, so the panel waits for them. */}
        <RatePanel flow={flow} />
      </StateView>
    </PublicFrame>
  );
}
