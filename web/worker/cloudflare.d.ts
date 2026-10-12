// The parts of the Cloudflare Workflows runtime API this Worker uses, declared by hand (as env.ts does for its other
// bindings) instead of adding @cloudflare/workers-types. Shapes from
// https://developers.cloudflare.com/workflows/build/workers-api/ (WorkflowEntrypoint, WorkflowStep, WorkflowStepConfig,
// NonRetryableError, Workflow, WorkflowInstance, InstanceStatus).
declare module 'cloudflare:workers' {
  export interface WorkflowEvent<T> { payload: Readonly<T>; timestamp: Date; instanceId: string; workflowName: string }
  export interface WorkflowStepContext { step: { name: string; count: number }; attempt: number }
  export interface WorkflowStepConfig {
    retries?: { limit: number; delay: string | number | ((i: { ctx: WorkflowStepContext; error: Error }) => string | number | Promise<string | number>); backoff?: 'constant' | 'linear' | 'exponential' };
    timeout?: string | number;
  }
  export interface WorkflowStep {
    do<T>(name: string, config: WorkflowStepConfig, callback: (ctx: WorkflowStepContext) => Promise<T>): Promise<T>;
    sleepUntil(name: string, timestamp: Date | number): Promise<void>;
  }
  export abstract class WorkflowEntrypoint<Env = unknown, Params = unknown> {
    protected env: Env;
    constructor(ctx: unknown, env: Env);
    run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<unknown>;
  }
}

declare module 'cloudflare:workflows' {
  export class NonRetryableError extends Error {
    constructor(message: string, name?: string);
  }
}
