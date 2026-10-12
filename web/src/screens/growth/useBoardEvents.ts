import { useMemo } from 'react';
import { addToSummary, currentVersion } from '../../domain/rating';
import { growthSession } from './session';
import type { BoardEvent } from './types';

/** Board events with the viewer's own rating counted in once, at its latest version (Events-Board and Event-Rating agree). */
export function useBoardEvents(events: BoardEvent[]): BoardEvent[] {
  const [session] = growthSession.use();
  return useMemo(() => events.map((e) => {
    const mine = session.myRatings[e.id];
    return mine ? { ...e, summary: addToSummary(e.summary, currentVersion(mine).scores), ratings: [mine, ...e.ratings] } : e;
  }), [events, session.myRatings]);
}
