import { useMemo } from 'react';
import { addToSummary, currentVersion, replaceInSummary, resolveViewerRating } from '../../domain/rating';
import { growthSession } from './session';
import type { BoardEvent } from './types';

/**
 * Board events with the viewer's own rating from this session (Events-Board and Event-Rating agree). One rating per
 * attendee: when this session's copy wins over the loaded one, it replaces it and moves the means without adding to
 * the count; with no loaded rating it is counted in once, at its latest version.
 */
export function useBoardEvents(events: BoardEvent[]): BoardEvent[] {
  const [session] = growthSession.use();
  return useMemo(() => events.map((e) => {
    const cached = session.myRatings[e.id];
    const loaded = e.ratings.find((r) => r.id === e.viewerRatingId);
    // The one rule (domain/rating.ts resolveViewerRating): when the loaded rating wins (a tombstone, or a version at
    // least as new), the loaded data stands as it is; a removed rating never moves the averages.
    const mine = resolveViewerRating(loaded, cached);
    if (!mine || mine !== cached || mine.removal) return e;
    if (loaded) {
      return { ...e, summary: replaceInSummary(e.summary, currentVersion(loaded).scores, currentVersion(mine).scores), ratings: e.ratings.map((r) => (r.id === loaded.id ? mine : r)) };
    }
    return { ...e, summary: addToSummary(e.summary, currentVersion(mine).scores), ratings: [mine, ...e.ratings] };
  }), [events, session.myRatings]);
}
