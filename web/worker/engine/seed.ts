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

/**
 * ingest_site v1: the brand's own website read as a site (architecture §6.1: home page plus about 8 key subpages, robots.txt
 * first, a rendered fallback for script-only pages), through the source adapter registry (sources/site.ts). Facts are
 * extracted per page, each quote checked against its own page, and each page saved as its own source.
 * Budget: the home page plus 3 subpages. Workers Free allows 50 subrequests per Workflow instance
 * (https://developers.cloudflare.com/workflows/reference/limits/; the account's plan is not verified). Measured: 30
 * requests for a 3-page site (worker-site-ingest.test.ts asserts under 50); a 4th page adds about 7. A retried step
 * adds its own requests. Architecture §6.1's "about 8 subpages" needs Workers Paid (10,000 per instance).
 */
export const INGEST_SITE: WorkflowSpec = {
  id: 'ingest_site',
  version: 1,
  title: 'Read the website',
  concurrency: 'parallel',
  retries: { limit: 2, delay: '5 seconds', backoff: 'exponential' },
  steps: [
    { id: 'read', type: 'source', label: 'Reading your site', source: 'site', url: '$input.url', website: '$input.website', subpages: 3, maxChars: 20000, excerptChars: 14000 },
    {
      id: 'extract', type: 'map', label: 'Finding facts on each page', over: '$steps.read.pages', max: 4,
      step: {
        id: 'extract_page', type: 'llm', label: 'Finding facts', prompt: 'ingest.extract_facts', json: true,
        vars: { brand_name: '$input.brandName', max_quote: '$const.MAX_QUOTE', sections: '$const.SECTIONS' },
        user: 'Page title: {{title}}\nURL: {{url}}\n\n{{text}}',
        userVars: { title: '$input.item.title', url: '$input.item.url', text: '$input.item.excerpt' },
      },
    },
    { id: 'check', type: 'code', label: 'Checking every quote against its page', fn: 'keep_quoted_facts_per_page', args: { pages: '$steps.read.pages', extracts: '$steps.extract' } },
    { id: 'save', type: 'write', label: 'Saving the facts', op: 'save_site_facts', args: { sourceId: '$input.sourceId', pages: '$steps.check', link: '$input.url', website: '$input.website' } },
  ],
  output: '$steps.save',
  onFailure: { op: 'mark_source_failed', args: { sourceId: '$input.sourceId' } },
};

export const SEED_DEFS = [INGEST_URL, INGEST_SITE];
export const SEED_PROMPTS = [{ key: 'ingest.extract_facts', version: 1, body: EXTRACT_FACTS_PROMPT }];
