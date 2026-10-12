import { afterEach, describe, expect, it, vi } from 'vitest';
import { followRun, POLL_MAX_MS, POLL_START_MS, runMessage, type RunView } from './followRun';

// PR #99 review: no fixed deadline. A run paused for the model's daily allowance, or simply long, is followed to its end.
afterEach(() => vi.useRealTimers());

function deps(states: RunView[]) {
  let i = 0;
  const seen: string[] = [];
  const waits: number[] = [];
  return {
    seen, waits,
    get: async () => states[Math.min(i++, states.length - 1)],
    sleep: (ms: number) => { waits.push(ms); return new Promise<void>((r) => setTimeout(r, ms)); },
    onUpdate: (r: RunView) => seen.push(r.status),
    cancelled: () => false,
  };
}
const run = (status: string, extra: Partial<RunView> = {}): RunView => ({ status, error: null, resume_at: null, ...extra });

describe('following a draft run', () => {
  it('keeps polling a run that goes on for hours, backing off, until it is done', async () => {
    vi.useFakeTimers();
    const d = deps([...Array.from({ length: 400 }, () => run('running')), run('done')]);
    const p = followRun('r', d);
    await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);
    await expect(p).resolves.toMatchObject({ status: 'done' });
    expect(d.seen).toHaveLength(401);
    expect(d.waits[0]).toBe(POLL_START_MS);
    expect(Math.max(...d.waits)).toBe(POLL_MAX_MS);
    expect(d.waits.reduce((a, b) => a + b, 0)).toBeGreaterThan(5 * 60 * 1000);
  });

  it('follows a run paused for the model allowance through to its end, reporting the pause', async () => {
    vi.useFakeTimers();
    const d = deps([run('running'), run('paused', { resume_at: '2026-10-14T00:00:00Z' }), run('paused', { resume_at: '2026-10-14T00:00:00Z' }), run('running'), run('done')]);
    const p = followRun('r', d);
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    await expect(p).resolves.toMatchObject({ status: 'done' });
    expect(d.seen).toEqual(['running', 'paused', 'paused', 'running', 'done']);
    expect(runMessage(run('paused', { resume_at: '2026-10-14T00:00:00Z' }))).toMatch(/^Waiting for the AI model's daily allowance\. This draft resumes at .+, and will appear here when it is ready\.$/);
  });

  it('stops at a failed run, and stops quietly when the screen has gone', async () => {
    await expect(followRun('r', deps([run('failed', { error: 'busy' })]))).resolves.toMatchObject({ status: 'failed', error: 'busy' });
    await expect(followRun('r', { ...deps([run('running')]), cancelled: () => true })).resolves.toBeNull();
  });
});
