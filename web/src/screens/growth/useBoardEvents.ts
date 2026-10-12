import { useMemo } from 'react';
import { addToSummary, currentVersion, shownCount, ratingQuestions } from '../../domain/rating';
import { growthSession } from './session';
import type { BoardEvent } from './types';

/** Board events with the viewer's own rating counted in once, at its latest version (Events-Board and Event-Rating agree). */
export function useBoardEvents(events: BoardEvent[]): BoardEvent[] {
  const [session] = growthSession.use();
  return useMemo(() => events.map((e) => {
    const mine = session.myRatings[e.id];
    if (!mine) return e;
    const previous = e.ratings.find((r) => r.id === mine.id);
    const n = shownCount(e.summary);
    const summary = previous && !previous.removal && e.summary.averages && n > 0
      ? { ...e.summary, averages: Object.fromEntries(ratingQuestions.map((q) => [q.id, (e.summary.averages![q.id] * n - currentVersion(previous).scores[q.id] + currentVersion(mine).scores[q.id]) / n])) as typeof e.summary.averages }
      : previous ? e.summary : addToSummary(e.summary, currentVersion(mine).scores);
    return { ...e, summary, ratings: [mine, ...e.ratings.filter((r) => r.id !== mine.id)] };
  }), [events, session.myRatings]);
}
