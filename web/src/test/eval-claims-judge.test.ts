import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { describe, expect, it } from 'vitest';

// Live evaluation of the gating claims judge (issue #93; architecture §13.1 F6, §13.2 "Unsupported claims caught >= 95%
// recall, precision reported"; §13.3). It calls the pinned free reviewer models through the real gateway, so it runs
// only when OPENROUTER_API_KEY is set (CI and local runs without the key skip it), and it paces itself under the free
// limit of 20 requests a minute (https://openrouter.ai/docs/api-reference/limits).
// Run: OPENROUTER_API_KEY=... npx vitest run src/test/eval-claims-judge.test.ts
const KEY = process.env.OPENROUTER_API_KEY;
const { chat } = await import('../../worker/llm');
const { render } = await import('../../worker/engine/prompts');
const { CREATE_REVIEW_PROMPT, CREATE_MODELS } = await import('../../worker/engine/seed');
const { REVIEW_FINDINGS } = await import('../../worker/create/schemas');
const { EVALUATORS } = await import('../../worker/create/evaluators');
const { evidenceSentences, checkClaims } = await import('../../worker/create/claims');
const { CLAIMS_POLICY, CONTENT_QUESTIONS } = await import('../../worker/posts');
const { voiceSpec, toneTargets } = await import('../../worker/create/voice');
const { schemaError } = await import('../../worker/schema');

const fx = JSON.parse(readFileSync(resolvePath(process.cwd(), '../spec/evals/create/claims.json'), 'utf8')) as { facts: { id: string; claim: string; quote: string }[]; items: { id: string; level: string; body: string; claims: { text: string; fact_ids: string[] }[]; expect: string }[] };
const GENERATOR = CREATE_MODELS['create.draft'][0];

describe.skipIf(!KEY)('claims judge on F6 (live, pinned free reviewer)', () => {
  it('reports recall, false alarms, latency and calls; recall must meet the §13.2 gate', async () => {
    const env = { OPENROUTER_API_KEY: KEY } as never;
    const spec = voiceSpec({ template: 'candid_founder', registeredAt: null }, null);
    const rows: { id: string; expect: string; judge: boolean; code: boolean; ms: number; model: string }[] = [];
    for (const item of fx.items) {
      const system = render(CREATE_REVIEW_PROMPT, { channel: 'LinkedIn', claims_policy: CLAIMS_POLICY[item.level], tone_targets: toneTargets(spec), content_questions: CONTENT_QUESTIONS, flirty_note: '' });
      const user = JSON.stringify({ post: item.body, sentences: evidenceSentences(item.body, item.level), facts: fx.facts });
      const t0 = Date.now();
      const r = await chat(env, system, user, { schema: REVIEW_FINDINGS, models: CREATE_MODELS['create.review'] });
      const ms = Date.now() - t0;
      const value = JSON.parse(r.text.slice(r.text.indexOf('{'), r.text.lastIndexOf('}') + 1));
      const ok = !schemaError(REVIEW_FINDINGS.schema, value);
      const judged = ok && EVALUATORS.review_claims.run({ body: item.body, claims: [], facts: fx.facts, spec, channel: 'LinkedIn', claimsLevel: item.level, brandName: 'JamJam', template: null, review: value, generator: GENERATOR, judge: r.model }).pass;
      const code = checkClaims(item.body, item.claims, fx.facts, item.level, 'JamJam').passed;
      rows.push({ id: item.id, expect: item.expect, judge: judged, code, ms, model: r.model });
      await new Promise((res) => setTimeout(res, 3100)); // under 20 requests a minute
    }
    const un = rows.filter((r) => r.expect === 'unsupported');
    const su = rows.filter((r) => r.expect === 'supported');
    const report = {
      judgeRecall: `${un.filter((r) => !r.judge).length}/${un.length}`,
      judgeFalseAlarms: `${su.filter((r) => !r.judge).length}/${su.length}`,
      gateRecall: `${un.filter((r) => !r.judge || !r.code).length}/${un.length}`,
      gateFalseAlarms: `${su.filter((r) => !r.judge || !r.code).length}/${su.length}`,
      medianMs: [...rows.map((r) => r.ms)].sort((a, b) => a - b)[Math.floor(rows.length / 2)],
      callsPerItem: 1, models: [...new Set(rows.map((r) => r.model))],
      missedByJudge: un.filter((r) => r.judge).map((r) => r.id), flaggedByJudge: su.filter((r) => !r.judge).map((r) => r.id),
    };
    console.info('claims judge F6', JSON.stringify(report));
    expect(un.filter((r) => !r.judge || !r.code).length / un.length).toBeGreaterThanOrEqual(0.95);
  }, 30 * 60 * 1000);
});
