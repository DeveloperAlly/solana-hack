// Routing facts to interview questions (issue #34; backlog B5). Fact extraction (#64) tags each fact with a kit section;
// the interview asks questions, several per section, so a fact is sorted into the one question it answers, or none.
// The model only sorts: it never sees a quote it could change, never states a fact, and never rates confidence.
// Code then refuses any route the fact's section cannot answer (fields.ts answeredBy) and any fact whose quote no
// longer checks against its stored source text (quote.ts, the one normaliser; issue #31), so a prefilled field always
// carries a checked quote.
import type { NamedSchema } from '../schema';
import { normalisePage, quoteOnPage } from '../quote';
import { fieldById, ROUTABLE_FIELDS } from './fields';

/** One routing call's reply: a field (or none) per fact id given. */
export const FACT_FIELDS: NamedSchema = {
  name: 'fact_fields',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['routes'],
    properties: {
      routes: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'field'],
          properties: {
            id: { type: 'string', description: 'The id of the fact' },
            field: { type: 'string', enum: [...ROUTABLE_FIELDS.map((f) => f.id), 'none'], description: 'The question the fact answers, or none' },
          },
        },
      },
    },
  },
};

/** The questions as the routing prompt lists them. */
export const FIELD_PROMPT = ROUTABLE_FIELDS.map((f) => `${f.id}: ${f.question}`).join('\n');

/** A fact as routing reads it. */
export interface RouteFact { id: string; source_id: string | null; section: string; claim: string; quote: string | null; quote_start?: number | null; quote_end?: number | null }

/**
 * The routing calls' inputs, `size` facts per call. Each item holds a local id, the fact's kit section and its claim:
 * the claim is what the question is answered with, and the model is never shown evidence ids it could repeat wrongly.
 */
export function routeBatches(facts: RouteFact[], size: number, maxBatches: number) {
  const batches: { ids: string[]; local: string[]; text: string }[] = [];
  const kept = facts.slice(0, size * maxBatches);
  for (let i = 0; i < kept.length; i += size) {
    const part = kept.slice(i, i + size);
    const local = part.map((_, j) => `f${i + j + 1}`);
    batches.push({ ids: part.map((f) => f.id), local, text: JSON.stringify(part.map((f, j) => ({ id: local[j], section: f.section, claim: f.claim })), null, 1) });
  }
  return { batches, count: batches.length, skipped: facts.length - kept.length };
}

/** Whether a stored quote still checks against the text it was read from: the exact slice at its offsets when it has
 * them (#64 stores the exact source text with offsets), else found in the text through the shared normaliser. */
export function quoteChecks(f: Pick<RouteFact, 'quote' | 'quote_start' | 'quote_end'>, sourceText: string | null | undefined): boolean {
  const q = (f.quote ?? '').trim();
  if (!q || !sourceText) return false;
  if (typeof f.quote_start === 'number' && typeof f.quote_end === 'number') return sourceText.slice(f.quote_start, f.quote_end) === f.quote;
  return quoteOnPage(normalisePage(sourceText), q);
}

export type RouteDrop = 'not_routed' | 'wrong_section' | 'quote_failed';

/**
 * Applies the replies: each fact gets the field its batch's reply gave, if that field accepts facts of the fact's
 * section and the quote checks; otherwise 'none'. A fact with no verdict, or two different ones, is left unrouted: a
 * route is never assumed. Every other fact is settled once and not sent again.
 */
export function applyRoutes(
  facts: RouteFact[],
  batches: { ids: string[]; local: string[] }[],
  replies: ({ routes?: { id: string; field: string }[] } | null)[],
  sourceText: (sourceId: string | null) => string | null | undefined,
) {
  const verdict = new Map<string, string | null>();
  batches.forEach((b, j) => {
    const local = new Map(b.local.map((l, k) => [l, b.ids[k]]));
    for (const r of replies[j]?.routes ?? []) {
      const id = local.get(r.id);
      if (!id) continue;
      verdict.set(id, verdict.has(id) && verdict.get(id) !== r.field ? null : r.field);
    }
  });
  const asked = new Set(batches.flatMap((b) => b.ids));
  const dropped: Partial<Record<RouteDrop, number>> = {};
  const drop = (r: RouteDrop) => { dropped[r] = (dropped[r] ?? 0) + 1; };
  const routes: { id: string; field: string }[] = [];
  for (const f of facts.filter((x) => asked.has(x.id))) {
    const v = verdict.get(f.id);
    const spec = fieldById(v);
    let field = 'none';
    // No usable verdict: left unrouted (null), so the next read asks again rather than settling it as 'none'.
    if (v === undefined || v === null) { drop('not_routed'); continue; }
    if (v !== 'none' && (!spec || !spec.routable || !(spec.answeredBy as readonly string[]).includes(f.section))) drop('wrong_section');
    else if (v !== 'none' && !quoteChecks(f, sourceText(f.source_id))) drop('quote_failed');
    else field = v;
    routes.push({ id: f.id, field });
  }
  return { routes, routed: routes.filter((r) => r.field !== 'none').length, dropped };
}
