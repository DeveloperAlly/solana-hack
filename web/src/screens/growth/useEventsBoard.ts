import { useState } from 'react';
import { summaryScore } from '../../domain/rating';
import { useBoardEvents } from './useBoardEvents';
import type { BoardEvent, EventsBoardData } from './types';

export const boardSorts = [
  { value: 'most', label: 'Most rated' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
  { value: 'upcoming', label: 'Upcoming' },
] as const;
export type BoardSort = (typeof boardSorts)[number]['value'];

/** Orders by score; events with no ratings yet always come after rated ones, whichever way the sort runs. */
const byScore = (dir: 1 | -1) => (a: BoardEvent, b: BoardEvent) => {
  const sa = summaryScore(a.summary);
  const sb = summaryScore(b.summary);
  if (sa === null || sb === null) return (sa === null ? 1 : 0) - (sb === null ? 1 : 0);
  return dir * (sa - sb);
};
const comparators: Record<BoardSort, (a: BoardEvent, b: BoardEvent) => number> = {
  most: (a, b) => b.summary.count - a.summary.count,
  highest: byScore(-1),
  lowest: byScore(1),
  // Upcoming: nearest first (Codex review on PR 102).
  upcoming: (a, b) => a.endsOn.localeCompare(b.endsOn),
};

export interface EventsBoardFlow {
  query: string;
  setQuery: (q: string) => void;
  sort: BoardSort;
  setSort: (s: string) => void;
  kind: string;
  setKind: (k: string) => void;
  shown: BoardEvent[];
  clear: () => void;
}

/** Events-Board flow state (one hook): search by event, city or organiser; sort; kind filter. */
export function useEventsBoard(data: EventsBoardData): EventsBoardFlow {
  const events = useBoardEvents(data.events);
  const [query, setQuery] = useState('');
  const [sort, setSortState] = useState<BoardSort>('most');
  const [kind, setKind] = useState('all');
  const q = query.trim().toLowerCase();
  const shown = events
    .filter((e) => (kind === 'all' || e.kind === kind) && (!q || [e.name, e.place, e.organiser].some((t) => t.toLowerCase().includes(q))))
    .filter((e) => sort !== 'upcoming' || e.endsOn >= data.today)
    .sort(comparators[sort]);
  return {
    query, setQuery,
    sort, setSort: (s) => setSortState(boardSorts.some((b) => b.value === s) ? (s as BoardSort) : 'most'),
    kind, setKind,
    shown,
    clear: () => { setQuery(''); setKind('all'); setSortState('most'); },
  };
}
