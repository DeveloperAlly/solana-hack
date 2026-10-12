import { useMemo } from 'react';
import { addToSummary, currentVersion, replaceInSummary } from '../../domain/rating';
import { growthSession } from './session';
import type { BoardEvent } from './types';

/**
 * Board events with the viewer's own rating from this session (Events-Board and Event-Rating agree). One rating per
 * attendee: when the loaded data already holds the viewer's rating (`viewerRatingId`), the session's version replaces
 * it and moves the means without adding to the count; otherwise it is counted in once, at its latest version.
 */
export function useBoardEvents(events: BoardEvent[]): BoardEvent[] {
  const [session] = growthSession.use();
  return useMemo(() => events.map((e) => {
    const mine = session.myRatings[e.id];
    if (!mine) return e;
    const loaded = e.ratings.find((r) => r.id === e.viewerRatingId);
    // A removed rating is out of the averages: nothing about it moves them (Codex review on PR 102).
    if (loaded?.removal) return e;
    if (loaded) {
      return { ...e, summary: replaceInSummary(e.summary, currentVersion(loaded).scores, currentVersion(mine).scores), ratings: e.ratings.map((r) => (r.id === loaded.id ? mine : r)) };
    }
    return { ...e, summary: addToSummary(e.summary, currentVersion(mine).scores), ratings: [mine, ...e.ratings] };
  }), [events, session.myRatings]);
}
