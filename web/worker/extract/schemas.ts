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
  limits: (v) => ((v as { facts: unknown[] }).facts.length > MAX_FACTS_PER_CHUNK ? `$.facts: more than ${MAX_FACTS_PER_CHUNK} facts` : null),
};

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
