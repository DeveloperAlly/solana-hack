// The two reply schemas of fact extraction (issue #64). Sent as OpenRouter structured outputs and checked on every
// reply (schema.ts). Shapes only; limits (fact count, lengths) are enforced by the steps after the check.
import { SECTIONS } from '../kit';
import type { NamedSchema } from '../schema';
import { MAX_FACTS_PER_CHUNK, SLOT_IDS } from './facts';

/** One extraction call's reply: the facts one chunk states. */
export const EXTRACTED_FACTS: NamedSchema = {
  name: 'extracted_facts',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['facts'],
    properties: {
      facts: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['section', 'claim', 'quote', 'slot', 'value'],
          properties: {
            section: { type: 'string', enum: Object.keys(SECTIONS), description: 'Brand kit section the fact belongs to' },
            claim: { type: 'string', description: 'One short sentence stating the fact, using only what the quote says' },
            quote: { type: 'string', description: 'The exact passage stating the fact, copied character for character' },
            slot: { type: 'string', enum: SLOT_IDS, description: 'The single-valued fact this fills, or none' },
            value: { type: 'string', description: 'For a slot, the value alone as written; otherwise empty' },
          },
        },
      },
    },
  },
  limits: (v, context) => {
    const n = (v as { facts: unknown[] }).facts.length;
    if (n > MAX_FACTS_PER_CHUNK) return `$.facts: more than ${MAX_FACTS_PER_CHUNK} facts`;
    // An empty list for a part with real text is treated as a bad reply, so the step is retried (engine retries, limit 2)
    // instead of saving "done, 0 facts". Live evidence (issue #114, 2026-10-13): the same 1028-token page and prompt gave
    // 9 facts on one call and an empty 187-token reply on the next; 2 of 13 prompt-v2 calls were empty.
    if (n === 0 && context && partText(context.user).length >= MIN_TEXT_FOR_FACTS) return '$.facts: empty for a part with readable text';
    return null;
  },
};

/** Characters of page text below which an empty extraction is accepted as genuine (a near-empty part). */
export const MIN_TEXT_FOR_FACTS = 400;
/** The page text of an extraction request: the user message after its "Part n of m:" header (engine/seed.ts extract_part). */
const partText = (user: string) => user.replace(/^Part \d+ of \d+:\s*/, '').trim();

/** One support-check call's reply: a verdict per fact id it was given. */
export const SUPPORT_VERDICTS: NamedSchema = {
  name: 'support_verdicts',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['verdicts'],
    properties: {
      verdicts: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'supported'],
          properties: {
            id: { type: 'string', description: 'The id of the item judged' },
            supported: { type: 'boolean', description: 'True only if the passage alone states everything in the claim' },
          },
        },
      },
    },
  },
};
