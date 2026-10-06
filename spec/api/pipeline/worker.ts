/**
 * Waterlily: pipeline Worker (BOILERPLATE, proposed 2026-10-06). Not runnable.
 * A SEPARATE plain Cloudflare Worker (not the vinext app). It hosts queue consumers, cron and Workflows.
 * Reason: vinext documents bindings for route handlers, but not exporting queue()/scheduled()/WorkflowEntrypoint.
 *
 * Verified (backend_map.md §9):
 *  - Queues are on the Free plan: 10k ops/day, 24 h retention, 128 KB messages, consumer handler queue(batch, env, ctx),
 *    message.ack()/retry(); a throw retries the whole batch; dead_letter_queue is configured in wrangler.
 *  - Workflows are on the Free plan: class X extends WorkflowEntrypoint (import from "cloudflare:workers"),
 *    run(event, step), step.do(name, {retries:{limit, delay, backoff}, timeout}, cb), step.sleep.
 *    Free: 10 ms CPU per STEP (waiting on fetch is free), 1,024 steps, 100 concurrent, 1 MiB per step result.
 *  - Cron Triggers: 5 per account on Free; scheduled(controller, env, ctx).
 * Design rule: each LLM, Exa or RPC call is its own step.do (retries per call). Steps return small ids, not
 * page text (1 MiB cap): big text is written to Supabase inside the step.
 */
// import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

/** IngestWorkflow: architecture §2 stages 2→4 (Ingestor, Extractor, Gap analyst). Started by POST /api/brands/:id/ingest. */
export class IngestWorkflow /* extends WorkflowEntrypoint<Env, { brandId: string }> */ {
  async run(event: any, step: any) {
    // const sources = await step.do("list sources", async () => /* select id,url,kind from sources where brand_id and status='queued' */ []);
    // for (const s of sources) {
    //   await step.do(`read ${s.id}`, { retries: { limit: 3, delay: "10 seconds", backoff: "exponential" }, timeout: "2 minutes" }, async () => {
    //     // URL → fetchPages([s.url]) (Exa /contents). statuses[] error → sources.status='failed', error=…  (Ingest-Error)
    //     // upload → Storage download → text extraction  ⚠ G-INGEST-1 (PDF/DOCX parsing within 10 ms CPU is unverified)
    //     // write the text to Storage (raw/<sourceId>.txt); sources.status='read'
    //     return { sourceId: s.id };
    //   });
    //   await step.do(`extract ${s.id}`, { retries: { limit: 3, delay: "20 seconds", backoff: "exponential" } }, async () => {
    //     // chunk the text (≤ ~8k chars) → llm("extractor@v", jsonSchema [{section, fact, quote, confidence}]) per chunk
    //     // insert evidence(status 'evidenced' if quote is verbatim from an owned source and confidence high, else 'inferred')
    //     // Waterlily 2023 legacy sources → status 'legacy' (§9 E(legacy))
    //   });
    // }
    // await step.do("coverage", async () => { /* §12.3.1 rules → nothing stored; coverage is computed on read */ });
    // await step.do("done", async () => { /* jobs.status='done' → Realtime → UI moves to Coverage-Map */ });
  }
}

/** DraftWorkflow: Writer → Critic → checks → scores (create.ts createDraft, §12.3.5). */
export class DraftWorkflow {
  async run(event: any, step: any) {
    // const ctx = await step.do("assemble context", async () => /* kit sections, voice writer_rules, claims allow-list, platform rules */ ({}));
    // const draft = await step.do("write", { retries: { limit: 3, delay: "10 seconds", backoff: "exponential" } }, async () => /* llm writer */ ({}));
    // const fixed = await step.do("slop pass", async () => /* llm critic.slop → slop_fixes */ ({}));
    // await step.do("checks + scores", async () => /* rules + llm score.voice_fit → drafts.scores; status 'in_review' */ ({}));
  }
}

/** Queue consumer: short jobs (verify_submission, register retries, metrics pulls). */
export default {
  async queue(batch: any, env: any, ctx: any) {
    // for (const m of batch.messages) {
    //   switch (m.body.kind) {
    //     case "verify_submission": /* grow.ts verify steps 1–5 */ break;
    //     case "register_retry":    /* registerMemo again for registrations.status='failed' */ break;
    //   }
    //   m.ack();
    // }
  },
  /** Cron: publish due scheduled drafts; poll X mentions for the reply queue (capped daily spend); refresh X tokens. */
  async scheduled(controller: any, env: any, ctx: any) {
    // 1. select drafts where status='scheduled' and scheduled_for <= now() → publishDraft (create.ts)
    // 2. X mentions (GET via the X API, pay-per-use) → Engage-Queue rows → DraftWorkflow(reply)
    // 3. ⚠ Supabase Free pauses after 1 week of inactivity: this cron also keeps the project active (one cheap query/day)
  },
};
