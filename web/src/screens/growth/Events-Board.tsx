/*
 * Data contract: Events-Board (canvas v21 board Events-Board, ROADMAP; on page "5 · Grow your reach" since canvas v22,
 * with the public shell). A public page: rated only by attendees, ratings registered so no one can quietly edit or
 * delete them. Backend map: not in .agentic/what/context/backend_map.md (nothing is built). Shapes: EventsBoardData in
 * ./types.ts; RatingSummary and EventRating in domain/rating.ts.
 *
 * | Field             | Source                                                             | Empty when        |
 * |-------------------|--------------------------------------------------------------------|-------------------|
 * | events[]          | GET /api/board/events (not built yet)                              | no ratings yet    |
 * | events[].summary  | the registered ratings, aggregated (not built yet)                 | not rated yet     |
 * | today             | the viewer's local date (sample: 13 Oct 2026), for "Upcoming"      | never             |
 *
 * States (canvas note on the board): success; empty = no ratings yet; loading; error. Search, sort and kind filter
 * change the list.
 */
import { Grid } from '../../ui/primitives';
import { StateView } from '../../ui/composites/StateView';
import { EventBoardFilters } from '../../ui/domain/EventBoardFilters';
import { GrowAreaCard } from '../../ui/domain/GrowAreaCard';
import { boardEventKinds } from '../../domain/event';
import { PublicFrame } from './components/PublicFrame';
import { BoardTable } from './components/BoardTable';
import { boardSorts, useEventsBoard } from './useEventsBoard';
import { useGrowthLinks } from './paths';
import type { EventsBoardData, ScreenProps } from './types';

const kinds = [{ value: 'all', label: 'All' }, ...boardEventKinds.map((k) => ({ value: k.id, label: k.label }))];

export function EventsBoard({ data, state = 'success' }: ScreenProps<EventsBoardData>) {
  const flow = useEventsBoard(data);
  const links = useGrowthLinks();
  const view = state === 'success' && data.events.length === 0 ? 'empty' : state;
  return (
    <PublicFrame tag="ROADMAP" title="Is this event worth it?"
      intro="Rated only by people who were there. Every rating and every edit is kept and registered, and a removal leaves a public note saying why, so no one can quietly change the record, organisers included."
      meta="Roadmap: designed, not built. Event names are bracketed sample data. Defined in: canvas v21 Events-Board.">
      <StateView state={view} loading={{ title: 'Loading the board', body: 'Reading attendee ratings.' }}
        error={{ title: 'Could not load the board', body: 'Ratings could not be read. Reload the page in a minute.' }}
        empty={{ title: 'No ratings yet', body: 'When attendees rate an event, it shows here.' }}>
        <EventBoardFilters query={flow.query} onQuery={flow.setQuery} sort={flow.sort} sortOptions={[...boardSorts]} onSort={flow.setSort}
          kind={flow.kind} kindOptions={kinds} onKind={flow.setKind} count={flow.shown.length} />
        <BoardTable events={flow.shown} onClear={flow.clear} />
      </StateView>
      <Grid min="sm">
        <GrowAreaCard title="Only attendees" body="You rate with proof you went: a checked-in ticket from the event’s Luma page, or the organiser’s guest list." links={[]} />
        <GrowAreaCard title="Can’t be scrubbed" body="Every version of a rating is kept, and its hash is registered on Solana. A rating removed after a report, reviewed by a person, leaves a public note with the date and reason, and its registration stays. Organisers can reply; they can’t edit or remove." links={[{ label: 'Public ledger', href: links.to('Ledger') }]} />
        <GrowAreaCard title="Five plain questions" body="Talks worth it · well run · met the right people · value for sponsors · would go again." links={[]} />
      </Grid>
    </PublicFrame>
  );
}
