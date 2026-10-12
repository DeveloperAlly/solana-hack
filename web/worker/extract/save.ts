// The save step of fact extraction (issue #64): one idempotent database write per run (the engine may run a step more
// than once: https://developers.cloudflare.com/workflows/build/rules-of-workflows/). It needs migration 011
// (spec/db/011_fact_extraction.sql), which also seeds the extract_facts definition, so no run can reach this step on
// a database without it.
import { db } from '../db';
import type { Env } from '../env';
import { stableId } from '../ids';
import { factTrust, SOURCE_TYPES, type ReviewStatus, type SourceKind } from '../sources/registry';
import type { RunRow } from '../engine/types';
import type { MatchType } from './align';
import { confidenceOf, factKey, findConflicts, normText, sourceKey, type Confidence, type StoredFact } from './facts';
import type { Candidate, Dropped } from './pipeline';

/** The read step's output (engine/readers.ts), as far as saving needs it. */
export interface ReadOutput { kind: string; url?: string; title: string; text: string; truncated: boolean }

type Live = StoredFact & { confidence: string | null };
const LIVE_FIELDS = 'id,source_id,section,claim,slot,slot_value,match,review_status,trust,confidence';

/**
 * Confidence of each support-checked fact (match is set only on facts this pipeline saved): its match type and the
 * number of independent sources stating the same fact (extract/facts.ts). Older facts without a match type are not
 * counted as corroboration, because they never passed the support check.
 */
export function confidences(facts: Live[], sourceKeyOf: (sourceId: string | null) => string): Map<string, Confidence> {
  const sources = new Map<string, Set<string>>();
  const checked = facts.filter((f) => f.match === 'exact' || f.match === 'fuzzy');
  for (const f of checked) {
    const k = factKey(f);
    const set = sources.get(k) ?? new Set<string>();
    set.add(sourceKeyOf(f.source_id));
    sources.set(k, set);
  }
  return new Map(checked.map((f) => [f.id, confidenceOf(f.match as MatchType, sources.get(factKey(f))!.size)]));
}

/**
 * The review decision a new fact starts with. Third-party facts wait for the owner (sources/registry.ts initialReview).
 * An owned fact is approved only when its quote matched exactly and it passed the support check (every fact reaching
 * this step did) and it contradicts no live fact; a fuzzily located passage or a contradiction waits for the owner.
 */
export function initialReviewFor(trust: string, match: MatchType, inConflict: boolean): ReviewStatus {
  if (trust === 'third_party') return 'proposed';
  return match === 'exact' && !inConflict ? 'approved' : 'proposed';
}

export async function saveExtractedFacts(env: Env, run: Pick<RunRow, 'id' | 'brand_id'>, a: { sourceId: string; read: ReadOutput; facts: Candidate[]; dropped: Dropped }) {
  const brand = run.brand_id;
  const sid = a.sourceId;
  if (!(a.read.kind in SOURCE_TYPES)) throw new Error(`unknown source kind ${a.read.kind}`);
  const kind = a.read.kind as SourceKind;
  const { trust } = factTrust(kind);
  const live = () => db.selectAll<Live>(env, 'evidence', `${db.eq('brand_id', brand)}&review_status=in.(proposed,approved)&select=${LIVE_FIELDS}&order=created_at.asc,id.asc`);
  const [before, sources] = await Promise.all([live(), db.selectAll<{ id: string; url: string }>(env, 'sources', `${db.eq('brand_id', brand)}&select=id,url&order=created_at.asc,id.asc`)]);
  const urls = new Map(sources.map((s) => [s.id, s.url]));
  urls.set(sid, a.read.url ?? urls.get(sid) ?? '');
  const keyOf = (id: string | null) => (id ? sourceKey({ id, url: urls.get(id) }) : 'source:none');

  const mine: Live[] = await Promise.all(a.facts.map(async (f) => ({
    id: await stableId('fact', sid, f.section, normText(f.claim), f.slot, normText(f.value), String(f.start), String(f.end)),
    source_id: sid, section: f.section, claim: f.claim, slot: f.slot === 'none' ? null : f.slot, slot_value: f.slot === 'none' ? null : f.value,
    match: f.match, review_status: 'proposed', trust, confidence: null,
  })));
  const others = before.filter((b) => !mine.some((m) => m.id === b.id));
  const contested = new Set(findConflicts([...others, ...mine]).flatMap((c) => c.ids));
  const conf = confidences([...others, ...mine], keyOf);
  const byId = new Map(a.facts.map((f, i) => [mine[i].id, f]));
  const rows = mine.map((m) => {
    const f = byId.get(m.id)!;
    return {
      id: m.id, brand_id: brand, source_id: sid, section: f.section, claim: f.claim, quote: f.quote, origin: 'source',
      trust, review_status: initialReviewFor(trust, f.match, contested.has(m.id)),
      quote_start: f.start, quote_end: f.end, match: f.match, confidence: conf.get(m.id), slot: m.slot, slot_value: m.slot_value, run_id: run.id,
    };
  });
  // Rows already present (a retried step) are left alone, so a review the owner made in between is never reverted.
  if (rows.length) await db.insertNew(env, 'evidence', rows, 'id');
  const text = a.read.text;
  await db.update(env, 'sources', `${db.eq('id', sid)}&${db.eq('brand_id', brand)}`, {
    status: 'read', kind, title: a.read.title, text_excerpt: text.slice(0, 2000), source_text: text, fetched_at: new Date().toISOString(),
    ...(a.read.url ? { url: a.read.url.slice(0, 500) } : {}), error: null,
  });

  // Read again after writing: a run saving another source at the same time is seen by whichever save reads last, so
  // a contradiction between two concurrent sources is never missed. Each conflict is recorded atomically in the
  // database (record_fact_conflict, spec/db/011), which also holds every fact on every side for review. The id list
  // goes as a JSON array, which PostgREST passes to the uuid[] parameter (https://docs.postgrest.org/en/stable/references/api/functions.html).
  const after = await live();
  const conflicts = findConflicts(after);
  for (const c of conflicts) await db.rpc(env, 'record_fact_conflict', { p_brand: brand, p_slot: c.slot, p_evidence: c.ids, p_question: c.question });
  // Corroboration changes the confidence of facts already stored; only computed values are written.
  for (const [id, c] of confidences(after, keyOf)) {
    const row = after.find((r) => r.id === id);
    if (row && row.confidence !== c) await db.update(env, 'evidence', `${db.eq('id', id)}&${db.eq('brand_id', brand)}`, { confidence: c });
  }
  const mineIds = new Set(mine.map((m) => m.id));
  const saved = after.filter((r) => mineIds.has(r.id));
  return {
    sourceId: sid,
    facts: saved.length,
    dropped: Object.values(a.dropped).reduce((x, y) => x + (y ?? 0), 0),
    droppedBy: a.dropped,
    kind,
    needsReview: saved.filter((r) => r.review_status === 'proposed').length,
    conflicts: conflicts.filter((c) => c.ids.some((id) => mineIds.has(id))).length,
    truncated: a.read.truncated,
  };
}
