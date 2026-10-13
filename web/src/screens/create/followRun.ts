// Following a draft run that outlasted its request (issue #93; PR #99 review): POST /posts answers 202 with the run id,
// and the screen polls GET /api/runs/:id until the run ends. There is no deadline: a run can pause until the model's
// daily allowance resets (engine/runner.ts, 00:00 UTC), so the screen keeps following, with backoff, and says so.

export interface RunView { status: string; error: string | null; resume_at: string | null; progress?: { message?: string | null } | null }

/**
 * First wait between polls, the factor between waits, and the most it backs off to: POLL_ACTIVE_MAX_MS while the run is
 * working, so a finished read or draft appears within a few seconds (a 30 s cap left a finished read showing "Reading…"
 * for up to 30 s on the live site, issue #114), and POLL_MAX_MS only while it is paused for the model's allowance.
 */
export const POLL_START_MS = 1500;
export const POLL_ACTIVE_MAX_MS = 4000;
export const POLL_MAX_MS = 30_000;
export const POLL_FACTOR = 1.5;

export const TERMINAL = new Set(['done', 'failed', 'superseded']);

export interface FollowDeps {
  get(runId: string): Promise<RunView>;
  sleep(ms: number): Promise<void>;
  /** Every state read, so the screen can show "drafting" or "waiting for the model's allowance". */
  onUpdate(run: RunView): void;
  /** True once the screen has gone: stop polling. */
  cancelled(): boolean;
}

/** Polls until the run reaches a terminal state (returned), or the screen goes (null). */
export async function followRun(runId: string, deps: FollowDeps): Promise<RunView | null> {
  for (let wait = POLL_START_MS; ; ) {
    if (deps.cancelled()) return null;
    const run = await deps.get(runId);
    if (deps.cancelled()) return null;
    deps.onUpdate(run);
    if (TERMINAL.has(run.status)) return run;
    wait = Math.min(wait, run.status === 'paused' ? POLL_MAX_MS : POLL_ACTIVE_MAX_MS);
    await deps.sleep(wait);
    wait = wait * POLL_FACTOR;
  }
}

/** What the screen says about a run still going. */
export function runMessage(run: RunView): string {
  if (run.status === 'paused') {
    const at = run.resume_at ? new Date(run.resume_at) : null;
    const when = at && !Number.isNaN(at.getTime()) ? at.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'when the allowance resets';
    return `Waiting for the AI model's daily allowance. This draft resumes at ${when}, and will appear here when it is ready.`;
  }
  return 'Still drafting your post. It will appear here when it is ready.';
}
