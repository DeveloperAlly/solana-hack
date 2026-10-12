// The read_brand workflow's own steps (issue #34; engine/seed.ts READ_BRAND), registered in engine/steps.ts WRITES.
// Each is idempotent, since the engine may run a step more than once
// (https://developers.cloudflare.com/workflows/build/rules-of-workflows/).
import { db } from '../db';
import type { Env } from '../env';
import type { ReadStepOutput } from '../engine/readers';
import type { RunRow } from '../engine/types';
import { coverageMap } from './coverage';
import { loadJourney } from './load';
import { applyRoutes, routeBatches, type RouteFact } from './route';

type Ctx = { env: Env; run: Pick<RunRow, 'id' | 'brand_id'> };
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const whole = (v: unknown, name: string) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new Error(`step argument ${name} must be a whole number`);
  return n;
};

/** Words in a text: runs of letters or digits in any script. */
export const wordCount = (s: string) => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length;

/**
 * Keeps where each page sits in the stored source text, the reader's notes on pages it passed over, and the word
 * count, on the source row (spec/db/012 sources.read_meta), so the Journey can list pages with their facts.
 */
export async function recordReadMeta({ env, run }: Ctx, a: { sourceId: unknown; read: unknown }) {
  const read = a.read as ReadStepOutput;
  const meta = { pages: read.pages ?? [], notes: read.meta?.notes ?? [], words: wordCount(read.text ?? '') };
  await db.update(env, 'sources', `${db.eq('id', String(a.sourceId))}&${db.eq('brand_id', run.brand_id)}`, { read_meta: meta });
  return { pages: meta.pages.length, words: meta.words };
}

const ROUTE_FIELDS = 'id,source_id,section,claim,quote,quote_start,quote_end';

/** Every live fact of the brand read from a source and not yet routed, in batches for the routing calls. */
export async function routeCandidates({ env, run }: Ctx, a: { size: unknown; max_batches: unknown }) {
  const facts = await db.selectAll<RouteFact>(env, 'evidence', `${db.eq('brand_id', run.brand_id)}&${db.eq('origin', 'source')}&review_status=in.(proposed,approved)&field=is.null&select=${ROUTE_FIELDS}&order=created_at.asc,id.asc`);
  const usable = facts.filter((f) => f.quote && f.claim);
  const out = routeBatches(usable, whole(a.size, 'size'), whole(a.max_batches, 'max_batches'));
  const asked = new Set(out.batches.flatMap((b) => b.ids));
  return { ...out, facts: usable.filter((f) => asked.has(f.id)) };
}

/**
 * Saves each fact's route, checked (prefill/route.ts applyRoutes): one write per question, and only on facts still
 * unrouted, so a retry or a concurrent read never overwrites a route already saved.
 */
export async function saveFactFields({ env, run }: Ctx, a: { facts: unknown; batches: unknown; replies: unknown }) {
  const facts = list<RouteFact>(a.facts);
  const ids = [...new Set(facts.map((f) => f.source_id).filter((x): x is string => !!x))];
  const texts = ids.length
    ? await db.select<{ id: string; source_text: string | null }>(env, 'sources', `${db.eq('brand_id', run.brand_id)}&id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,source_text`)
    : [];
  const byId = new Map(texts.map((t) => [t.id, t.source_text]));
  const { routes, routed, dropped } = applyRoutes(facts, list(a.batches), list(a.replies), (id) => (id ? byId.get(id) : null));
  const byField = new Map<string, string[]>();
  for (const r of routes) byField.set(r.field, [...(byField.get(r.field) ?? []), r.id]);
  for (const [field, fids] of [...byField].sort(([x], [y]) => x.localeCompare(y))) {
    await db.update(env, 'evidence', `${db.eq('brand_id', run.brand_id)}&id=in.(${fids.map(encodeURIComponent).join(',')})&field=is.null`, { field });
  }
  return { routed, settled: routes.length, dropped };
}

/** Kit sections drafted automatically from evidence: the gated ones a site can support. Voice is drafted only after
 * the owner picks a voice by example (§1 principle 5), through the existing POST /sections/voice/draft. */
export const AUTO_DRAFT = ['purpose', 'positioning'] as const;

/**
 * Creates drafts for the gated sections the evidence supports (found or partly found), through the existing drafting
 * path (api.ts draftSection: usable facts only, citations kept). A section that already has a draft, whoever wrote it,
 * is left alone, so a retry or a second read never overwrites the owner's work. The gates still need a person.
 */
export async function prefillDrafts({ env, run }: Ctx, a: { saved: unknown; routed: unknown }) {
  const [brand] = await db.select<{ id: string; owner_id: string; name: string; type: string; description: string | null; website: string | null; goal: string | null; channel: string | null }>(env, 'brands', db.eq('id', run.brand_id));
  if (!brand) throw new Error('brand not found');
  const input = await loadJourney(env, brand);
  const map = coverageMap(input);
  const existing = await db.select<{ section: string }>(env, 'kit_sections', `${db.eq('brand_id', brand.id)}&select=section`);
  const drafted: string[] = [];
  const skipped: { section: string; reason: string }[] = [];
  // Imported when needed: api.ts imports the engine, so a static import here would be circular at load time.
  const { draftSection } = await import('../api');
  for (const s of AUTO_DRAFT) {
    const status = map.sections.find((x) => x.id === s)!.status;
    if (existing.some((e) => e.section === s)) { skipped.push({ section: s, reason: 'already drafted' }); continue; }
    if (status === 'needs-you') { skipped.push({ section: s, reason: 'nothing in the sources supports it yet' }); continue; }
    await draftSection(env, brand, s);
    drafted.push(s);
  }
  return { ...(a.saved && typeof a.saved === 'object' ? (a.saved as object) : {}), routing: a.routed ?? null, coverage: map.coverage, prefill: map.prefill, questionsLeft: map.questionsLeft, drafted, notDrafted: skipped };
}

/** On failure: a source the run never finished reading is marked failed; one it already read stays read. */
export async function closePendingSource({ env, run }: Ctx, a: { sourceId: unknown; error: unknown }) {
  const error = typeof a.error === 'string' && a.error ? a.error : 'reading the source failed';
  await db.update(env, 'sources', `${db.eq('id', String(a.sourceId))}&${db.eq('brand_id', run.brand_id)}&status=eq.pending`, { status: 'failed', error });
  return null;
}
