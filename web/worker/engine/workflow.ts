// The one Cloudflare Workflows class (wrangler.jsonc "workflows": RUN_WORKFLOW -> RunWorkflow). Each instance is one
// run; its id is the run id. Everything it does is in runner.ts, so the same code runs inline and in tests.
// API: https://developers.cloudflare.com/workflows/build/workers-api/ (WorkflowEntrypoint, step.do, NonRetryableError).
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import type { Env } from '../env';
import { runWorkflow } from './runner';

export class RunWorkflow extends WorkflowEntrypoint<Env, { runId: string }> {
  async run(event: WorkflowEvent<{ runId: string }>, step: WorkflowStep) {
    await runWorkflow(this.env, event.payload.runId, step, { nonRetryable: (m) => new NonRetryableError(m) });
  }
}
