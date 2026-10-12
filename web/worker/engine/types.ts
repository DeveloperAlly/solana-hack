// Workflow engine types (issue #32; backlog X4, X5, X14). Definitions are data (workflow_defs.spec, spec/db/010); the
// step types are code. Contract: backend map §10.2 "Workflow engine", architecture §6.1 system map.

/** Retry policy for one step, in the shape of a Cloudflare Workflows step config
 * (https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/#retry-steps). */
export interface RetrySpec { limit: number; delay: string; backoff: 'constant' | 'linear' | 'exponential' }

interface StepBase {
  id: string; label: string; retries?: RetrySpec; timeout?: string;
  /**
   * Most metered external calls one run of this step makes (paid or rate-limited calls whose cost is recorded as
   * run_steps.cost_usd): the start budget (engine/guards.ts) counts them. Default: 1 for an llm step and for a fetch
   * step with a reader (a reader may call a paid service such as Exa), 0 otherwise. Declare it on any other step kind
   * that calls a metered service.
   */
  metered?: number;
}
/** Reads one public page (ingest.ts readPage). Output: {url, title, text, excerpt}. The text keeps at most maxChars
 * UTF-16 units and maxBytes UTF-8 bytes, so the step result stays under Workflows' 1 MiB limit in either encoding. */
export interface FetchStep extends StepBase { type: 'fetch'; reader?: undefined; url: string; maxChars: number; maxBytes: number; excerptChars: number }
/**
 * Reads a source through a source adapter (issue #33) named in engine/readers.ts READERS, as a 'fetch' step: reader
 * is a name or a reference ($input.reader); args is one reference to an object (the run's checked reader arguments,
 * $input.args) or a map of references, passed to the reader. Output: engine/readers.ts
 * ReadStepOutput, its text capped at maxChars UTF-16 units and maxBytes UTF-8 bytes, as for FetchStep (issue #64).
 */
export interface SourceStep extends StepBase { type: 'fetch'; reader: string; args: string | Record<string, string>; maxChars: number; maxBytes: number }
/**
 * One call through the LLM gateway (llm.ts chat) with a versioned prompt (prompt_versions) as the system message.
 * schema names a reply schema in steps.ts SCHEMAS: it is sent as a strict structured output with providers required to
 * honour it, and the reply is refused unless it conforms (issue #64). json without a schema keeps the loose parse.
 */
export interface LlmStep extends StepBase { type: 'llm'; prompt: string; promptVersion?: number; vars?: Record<string, string>; user: string; userVars?: Record<string, string>; json?: boolean; schema?: string }
/** A named pure function from the code registry (steps.ts CODE). */
export interface CodeStep extends StepBase { type: 'code'; fn: string; args: Record<string, string> }
/** A named database read from the registry (steps.ts READS): it changes nothing, so it is safe to repeat. */
export interface ReadStep extends StepBase { type: 'read'; op: string; args: Record<string, string> }
/** A named, idempotent database write from the registry (steps.ts WRITES). */
export interface WriteStep extends StepBase { type: 'write'; op: string; args: Record<string, string> }
/** Runs an inner step once per item of a list, each item as its own durable step. Output: the list of results. */
export interface MapStep extends StepBase {
  type: 'map'; over: string; max: number; step: Exclude<StepSpec, MapStep>;
  /** Run the items at once instead of one after another. Each item is still its own named durable step, so a replay
   * returns each finished item by name (https://developers.cloudflare.com/workflows/build/rules-of-workflows/). */
  parallel?: boolean;
}
export type StepSpec = FetchStep | SourceStep | LlmStep | CodeStep | ReadStep | WriteStep | MapStep;

export interface WorkflowSpec {
  id: string;
  version: number;
  title: string;
  /** 'parallel': runs of this kind may overlap; 'supersede': a new run marks the brand's active run of this kind superseded. */
  concurrency: 'parallel' | 'supersede';
  retries: RetrySpec;
  steps: StepSpec[];
  /** A reference ($steps.x...) whose value becomes runs.output. */
  output: string;
  /** A write op called with {error} when the run fails, so the rows it started (a pending source) are closed. */
  onFailure?: { op: string; args: Record<string, string> };
}

export type RunStatus = 'running' | 'paused' | 'done' | 'failed' | 'superseded';

export interface StepProgress { id: string; label: string; status: 'pending' | 'running' | 'done' | 'failed' | 'paused' }
export interface Progress { steps: StepProgress[]; done: number; total: number; message?: string | null }

export interface RunRow {
  id: string;
  brand_id: string;
  kind: string;
  workflow_version: number;
  executor: 'workflows' | 'inline';
  status: RunStatus;
  input: Record<string, unknown>;
  output: unknown;
  progress: Progress;
  resume_at: string | null;
  error: string | null;
  error_code: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** One attempt of one step (run_steps). Never holds prompt or page content: ids, versions, counts and timings only. */
export interface StepTrace {
  step: string;
  attempt: number;
  type: StepSpec['type'];
  outcome: 'ok' | 'error' | 'paused';
  prompt_key?: string | null;
  prompt_version?: number | null;
  prompt_hash?: string | null;
  model?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  /** What the step's external call cost in US dollars: a reader's meta.cost, or the model call's reported cost (0 for
   * free models); null when not reported. A brand's cost is the sum over its runs' steps (spec/db/011). */
  cost_usd?: number | null;
  duration_ms: number;
  error?: string | null;
}
