// The first workflow definition and its prompt, as seeded by spec/db/010_workflow_engine.sql. The database rows are
// the runtime source (workflow_defs, prompt_versions); this file exists so tests can check the migration's seed and
// run the same definition. worker-engine.test.ts fails if the two drift apart.
import type { WorkflowSpec } from './types';

/** The extraction prompt that ingest used inline in api.ts before the engine, with its three values as variables. */
export const EXTRACT_FACTS_PROMPT = 'You extract facts about the brand "{{brand_name}}" from a web page. Each fact needs an exact quote copied character for character from the page text, at most {{max_quote}} characters. Sections: {{sections}}. Reply with JSON only: {"facts": [{"section": string, "claim": string, "quote": string}]}. At most 12 facts. No facts that the page does not state.';

/**
 * ingest_url v1: today's single-URL ingest (POST /api/brands/:id/sources) as four durable steps. Read the page, ask the
 * model for quoted facts, keep only facts whose quote is on the page (quote.ts, issue #31), then save.
 * Retries: limit 2, exponential from 5 s (plan §3: worst case 3 attempts per step).
 */
export const INGEST_URL: WorkflowSpec = {
  id: 'ingest_url',
  version: 1,
  title: 'Read one link',
  concurrency: 'parallel',
  retries: { limit: 2, delay: '5 seconds', backoff: 'exponential' },
  steps: [
    // maxChars and maxBytes keep the step result under the 1 MiB limit whether it is stored as UTF-16 (2 bytes a unit)
    // or UTF-8 (up to 3 bytes a unit for CJK text): https://developers.cloudflare.com/workflows/reference/limits/
    { id: 'read', type: 'fetch', label: 'Reading the page', url: '$input.url', maxChars: 300000, maxBytes: 600000, excerptChars: 14000 },
    {
      id: 'extract', type: 'llm', label: 'Finding facts', prompt: 'ingest.extract_facts', json: true,
      vars: { brand_name: '$input.brandName', max_quote: '$const.MAX_QUOTE', sections: '$const.SECTIONS' },
      user: 'Page title: {{title}}\nURL: {{url}}\n\n{{text}}',
      userVars: { title: '$steps.read.title', url: '$steps.read.url', text: '$steps.read.excerpt' },
    },
    { id: 'check', type: 'code', label: 'Checking every quote against the page', fn: 'keep_quoted_facts', args: { facts: '$steps.extract.facts', page: '$steps.read.text' } },
    { id: 'save', type: 'write', label: 'Saving the facts', op: 'save_source_facts', args: { sourceId: '$input.sourceId', link: '$input.url', website: '$input.website', facts: '$steps.check.facts', dropped: '$steps.check.dropped', url: '$steps.read.url', title: '$steps.read.title', text: '$steps.read.text' } },
  ],
  output: '$steps.save',
  onFailure: { op: 'mark_source_failed', args: { sourceId: '$input.sourceId' } },
};

export const SEED_DEFS = [INGEST_URL];
export const SEED_PROMPTS = [{ key: 'ingest.extract_facts', version: 1, body: EXTRACT_FACTS_PROMPT }];
