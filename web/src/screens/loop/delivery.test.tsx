import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { selectBrand, resetActiveBrand } from '../../flows/brand/activeBrand';
import { loopStore } from '../../flows/loop/store';
import { useLoop } from '../../flows/loop/useLoop';
import { growthSession } from '../growth/session';
import { useAdapt } from '../growth/useAdapt';
import { useEventRating } from '../growth/useEventRating';
import { useBoardEvents } from '../growth/useBoardEvents';
import { currentVersion, withVersion } from '../../domain/rating';
import { adapt } from '../growth/adapt.fixtures';
import { eventRating } from '../growth/board.fixtures';
import { today } from './fixtures';
import { useToday } from './useToday';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
beforeEach(() => { resetActiveBrand(); loopStore.reset(); growthSession.reset(); });

describe('delivery integration regressions', () => {
  it('isolates decisions, Brain history and growth edits when switching brands', () => {
    const { result } = renderHook(() => useLoop(today), { wrapper });
    act(() => {
      result.current.finish('post', 'Sent.');
      result.current.retireRule(today.brain.rules[0]);
      growthSession.set({ connections: { x: 'connected' } });
    });
    const version = result.current.brain.version;
    act(() => selectBrand('other'));
    expect(result.current.outcomes).toEqual({});
    expect(result.current.brain.version).toBe(today.brain.version);
    expect(growthSession.read().connections).toEqual({});
    act(() => selectBrand('adna'));
    expect(result.current.outcomes.post).toBe('Sent.');
    expect(result.current.brain.version).toBe(version);
    expect(growthSession.read().connections.x).toBe('connected');
  });

  it('invalidates a Today approval when its checks change without changing its text', () => {
    const draft = today.queue.find((i) => i.kind === 'draft' && i.checks.claims.backed === i.checks.claims.total)!;
    const { result, rerender } = renderHook(({ data }) => useToday(data), { wrapper, initialProps: { data: today } });
    act(() => result.current.shown.find((r) => r.item.id === draft.id)!.act!());
    expect(result.current.done.some((r) => r.item.id === draft.id)).toBe(true);
    const changed = { ...today, queue: today.queue.map((i) => i.id === draft.id && i.kind === 'draft' ? { ...i, checks: { ...i.checks, slop: 'failed' as const } } : i) };
    rerender({ data: changed });
    const row = result.current.needsYou.find((r) => r.item.id === draft.id)!;
    expect(row.gate.blocking).toBe(true);
    expect(row.status).toMatch(/stale/);
    act(() => row.act!());
    expect(result.current.done.some((r) => r.item.id === draft.id)).toBe(false);
  });

  it('refuses empty and oversized originals in both approval and schedule actions', () => {
    const { result } = renderHook(() => useAdapt(adapt), { wrapper });
    for (const text of ['', 'x'.repeat(281)]) {
      act(() => result.current.editOriginal(text));
      expect(result.current.originalCheck.blocking).toBe(true);
      act(() => { result.current.approveOriginal(); result.current.confirmSchedule(); });
      expect(result.current.originalApproval).not.toBe('approved');
      expect(result.current.schedule.blocking).toBe(true);
      expect(result.current.scheduled).toBe(false);
    }
  });

  it('loads the existing viewer rating and edits it without duplicating the row or count', () => {
    const event = eventRating.events.find((e) => e.id === eventRating.defaultId)!;
    const mine = { ...event.ratings[0], author: 'You' as const };
    const data = { ...eventRating, events: eventRating.events.map((e) => e.id === event.id ? { ...e, ratings: [mine, ...e.ratings.slice(1)] } : e) };
    const rating = renderHook(() => useEventRating(data), { wrapper });
    expect(rating.result.current.mine?.id).toBe(mine.id);
    act(() => rating.result.current.startEdit());
    expect(rating.result.current.editing).toBe(true);
    expect(rating.result.current.scores).toEqual(currentVersion(mine).scores);
    const board = renderHook(() => useBoardEvents(data.events), { wrapper });
    act(() => growthSession.set({ myRatings: { [event.id]: withVersion(mine, { ...currentVersion(mine), line: 'Edited line' }) } }));
    const updated = board.result.current.find((e) => e.id === event.id)!;
    expect(updated.ratings.filter((r) => r.id === mine.id)).toHaveLength(1);
    expect(updated.summary.count).toBe(event.summary.count);
    expect(updated.summary.averages).toEqual(event.summary.averages);
  });
});
