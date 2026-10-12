// The one Cloudflare Workflows class (wrangler.jsonc "workflows": RUN_WORKFLOW -> RunWorkflow). Each instance is one
// run (its id is the run id) or one item of a run's map step (a child; runner.ts fanOut). Everything it does is in
// runner.ts, so the same code runs inline and in tests.
// API: https://developers.cloudflare.com/workflows/build/workers-api/ (WorkflowEntrypoint, step.do, step.waitForEvent,
// createBatch, instance.sendEvent, NonRetryableError).
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import type { Env } from '../env';
import { runChild, runWorkflow, type ChildReport, type RunnerDeps, type RunParams, type StepApi } from './runner';

type Binding = { create(o: { id: string; params: RunParams }): Promise<unknown>; get(id: string): Promise<{ sendEvent(e: { type: string; payload: ChildReport }): Promise<void> }> };

export class RunWorkflow extends WorkflowEntrypoint<Env, RunParams> {
  async run(event: WorkflowEvent<RunParams>, step: WorkflowStep) {
    const binding = this.env.RUN_WORKFLOW as unknown as Binding | undefined;
    const deps: RunnerDeps = {
      nonRetryable: (m) => new NonRetryableError(m),
      ...(binding ? { fanout: {
        // create() per child (a wave is at most FANOUT_WAVE). A replayed spawn step meets ids it already created:
        // create throws for an id in use, and that child is already running, so that error is not a failure.
        spawn: async (children) => {
          for (const c of children) {
            try { await binding.create(c); }
            catch (e) { if (!/already exists|already in use|duplicate/i.test(String((e as Error)?.message))) throw e; }
          }
        },
        report: async (parent, type, payload) => { await (await binding.get(parent)).sendEvent({ type, payload }); },
      } } : {}),
    };
    const api = step as unknown as StepApi;
    if (event.payload.child) await runChild(this.env, event.payload.runId, event.payload.child, api, deps);
    else await runWorkflow(this.env, event.payload.runId, api, deps);
  }
}
