// Reply schemas for drafting and review (issue #93), sent as OpenRouter structured outputs and checked on every reply
// (schema.ts). Neither asks the model for a score: the drafter returns text and the claims it makes, the reviewer
// returns findings, and every score and verdict is computed from those (architecture §6.1, "nothing grades itself").
import type { NamedSchema } from '../schema';

/** Most claims one candidate may declare; a reply over it is refused as a whole. */
export const MAX_CLAIMS = 20;

export const DRAFT_CANDIDATE: NamedSchema = {
  name: 'draft_candidate',
  schema: {
    type: 'object', additionalProperties: false, required: ['body', 'claims'],
    properties: {
      body: { type: 'string', description: 'The post, ready to publish' },
      claims: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['text', 'fact_ids'],
          properties: {
            text: { type: 'string', description: 'One whole sentence of the post that states a fact, copied exactly' },
            fact_ids: { type: 'array', items: { type: 'string' }, description: 'Ids of the facts that state this claim' },
          },
        },
      },
    },
  },
  limits: (v) => ((v as { body: string; claims: unknown[] }).claims.length > MAX_CLAIMS ? `$.claims: more than ${MAX_CLAIMS}` : (v as { body: string }).body.trim() ? null : '$.body: empty'),
};

export const ISSUE_KINDS = ['unclear', 'off_voice', 'platform', 'other'] as const;
export const TONE_DIMENSIONS = ['warmth', 'energy', 'humour'] as const;
export const TONE_READINGS = ['below', 'on', 'above'] as const;

export const REVIEW_FINDINGS: NamedSchema = {
  name: 'review_findings',
  schema: {
    type: 'object', additionalProperties: false, required: ['claims', 'issues', 'tone', 'sexual', 'minors', 'explicitLanguage'],
    properties: {
      claims: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['text', 'fact_ids', 'supported'],
          properties: {
            text: { type: 'string', description: 'A claim needing evidence, copied exactly from the post' },
            fact_ids: { type: 'array', items: { type: 'string' }, description: 'Ids of the facts that state it in full' },
            supported: { type: 'boolean', description: 'True only if those facts state everything in the claim' },
          },
        },
      },
      issues: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['kind', 'quote', 'note'],
          properties: { kind: { type: 'string', enum: ISSUE_KINDS }, quote: { type: 'string' }, note: { type: 'string' } },
        },
      },
      tone: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['dimension', 'observed'],
          properties: { dimension: { type: 'string', enum: TONE_DIMENSIONS }, observed: { type: 'string', enum: TONE_READINGS } },
        },
      },
      sexual: { type: 'boolean' },
      minors: { type: 'boolean' },
      explicitLanguage: { type: 'boolean' },
    },
  },
  limits: (v) => ((v as { claims: unknown[]; issues: unknown[] }).claims.length > MAX_CLAIMS * 2 || (v as { issues: unknown[] }).issues.length > 20 ? '$: too many items' : null),
};
