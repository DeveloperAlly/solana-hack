import { api, ApiError } from './api';
import { followRun, type RunView } from '../screens/create/followRun';

/** Follow the server's accepted operation; a 409 with a run ID means work continues (issue 114). */
export async function operation<T>(request: () => Promise<T & { runId?: string }>, signal: AbortSignal, onProgress?: (run: RunView) => void): Promise<T> {
  let first: T & { runId?: string };
  try { first = await request(); }
  catch (e) {
    if (!(e instanceof ApiError) || e.status !== 409 || typeof e.data.runId !== 'string') throw e;
    first = e.data as T & { runId: string };
  }
  if (!first.runId || ('facts' in (first as object))) return first;
  let last: RunView & { output?: T } | undefined;
  const done = await followRun(first.runId, {
    get: async id => { last = (await api<{ run: RunView & { output?: T } }>(`/runs/${id}`, { signal })).run; return last; },
    sleep: ms => new Promise<void>(resolve => { if (signal.aborted) return resolve(); const end = () => { clearTimeout(timer); signal.removeEventListener('abort', end); resolve(); }; const timer = setTimeout(end, ms); signal.addEventListener('abort', end, { once: true }); }),
    onUpdate: run => onProgress?.(run), cancelled: () => signal.aborted,
  });
  if (!done || signal.aborted) throw new DOMException('Operation cancelled', 'AbortError');
  if (done.status !== 'done') throw new ApiError(502, done.error ?? 'The operation did not finish. Try again.');
  if (!last?.output) throw new ApiError(502, 'The operation completed without a result. Refresh and try again.');
  return last.output;
}
