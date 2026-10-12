// A failure that happened after money was spent (Codex review on PR #100): an Exa call charged and then returned
// nothing usable, a model reply charged and then refused. Throw it from a reader, a step or the model gateway; the
// engine's runner records its cost (and any trace it carries) on the step's error record (run_steps.cost_usd), so the
// brand-day spend and the admission budget (spec/db/011 admit_run) count failed calls too. It is an HttpError, so the
// runner retries or stops on its status exactly as for any other failure.
import { HttpError } from './env';

export interface SpentTrace {
  model?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  prompt_key?: string | null;
  prompt_version?: number | null;
  prompt_hash?: string | null;
}

export class MeteredFailure extends HttpError {
  /** What the failed call cost in US dollars (0 for a free call that counts against a limit); null when not reported. */
  readonly cost: number | null;
  /** The call that was made (model, tokens, prompt), when there is one to record. */
  readonly trace?: SpentTrace;
  constructor(status: number, message: string, cost: number | null, trace?: SpentTrace) {
    super(status, message);
    this.cost = typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? cost : null;
    if (trace) this.trace = trace;
  }

  /** The same failure as `e` (its status and message; 502 for anything that is not an HttpError), carrying spend. */
  static from(e: unknown, cost: number | null, trace?: SpentTrace): MeteredFailure {
    if (e instanceof MeteredFailure) return e;
    const status = e instanceof HttpError ? e.status : 502;
    const message = e instanceof HttpError ? e.message : 'the AI model reply was not usable, try again';
    return new MeteredFailure(status, message, cost, trace);
  }
}

/**
 * The brand's metered-call budget ran out mid-run (spec/db/011 consume_metered refused the next call). Not retried:
 * the run ends failed with this message, which says when to start again.
 */
export class BudgetExhausted extends HttpError {
  constructor(message: string) {
    super(429, message);
  }
}
