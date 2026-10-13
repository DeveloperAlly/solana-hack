// The save step of fact extraction (issue #64): one idempotent database write per run (the engine may run a step more
// than once: https://developers.cloudflare.com/workflows/build/rules-of-workflows/). It needs migration 011
// (spec/db/012_fact_extraction.sql), which also seeds the extract_facts definition, so no run can reach this step on
// a database without it.
import { db } from '../db';
import type { Env } from '../env';
import { stableId } from '../ids';
import { capText } from '../engine/readers';
import { factTrust, SOURCE_TYPES, type ReviewStatus, type SourceKind } from '../sources/registry';
import type { RunRow } from '../engine/types';
import type { MatchType } from './align';
import { factKey, normText, sourceKey } from './facts';
import type { Candidate, Dropped } from './pipeline';

/** The read step's output (engine/readers.ts), as far as saving needs it. */
export interface ReadOutput { kind: string; url?: string; title: string; text: string; truncated: boolean; pages?: { url: string; title: string; start: number; end: number }[] }

/** Longest page address stored (spec/db/012 evidence_page_url_check): the sitemaps protocol's URL limit
 * (https://www.sitemaps.org/protocol.html, "must be less than 2,048 characters"). */
export const MAX_PAGE_URL = 2047;
/** Longest page title stored, in characters (code points, as Postgres char_length counts them); a title is display
 * text, so a longer one is cut, never inside a character (spec/db/012 evidence_page_title_check). */
export const MAX_PAGE_TITLE = 200;

/**
 * The page of a multi-page read that holds the quote at [start, end), so a fact links to the exact page it is on.
 * Null when no single page holds it (a single-page source, or a quote across a page boundary): the fact then links to
 * its source. A page address too long to store is left out rather than cut, because a cut address is another page.
 */
export function pageOf(read: ReadOutput, start: number, end: number): { url: string; title: string } | null {
  const p = (read.pages ?? []).find((x) => x.start <= start && end <= x.end);
  if (!p || p.url.length > MAX_PAGE_URL) return null;
  return { url: p.url, title: Array.from(p.title).slice(0, MAX_PAGE_TITLE).join('') };
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

export async function saveExtractedFacts(env: Env, run: Pick<RunRow, 'id' | 'brand_id'>, a: { sourceId: string; read: ReadOutput; facts: Candidate[]; dropped: Dropped; chunksSkipped?: number; charsSkipped?: number }) {
  const brand = run.brand_id;
  const sid = a.sourceId;
  if (!(a.read.kind in SOURCE_TYPES)) throw new Error(`unknown source kind ${a.read.kind}`);
  const kind = a.read.kind as SourceKind;
  const { trust } = factTrust(kind);
  // Which sources are independent is decided by host (facts.ts sourceKey); this source's key uses the address read.
  const ownKey = sourceKey({ id: sid, url: a.read.url ?? null });
  const rows = await Promise.all(a.facts.map(async (f) => {
    const slot = f.slot === 'none' ? null : f.slot;
    const value = slot ? f.value : null;
    const page = pageOf(a.read, f.start, f.end);
    return {
      id: await stableId('fact', sid, f.section, normText(f.claim), f.slot, normText(f.value), String(f.start), String(f.end)),
      section: f.section, claim: f.claim, quote: f.quote, trust,
      // Contested facts are held by the database (rederive_conflicts) in the same transaction.
      review_status: initialReviewFor(trust, f.match, false),
      quote_start: f.start, quote_end: f.end, match: f.match, slot, slot_value: value, slot_key: value === null ? null : normText(value),
      fact_key: factKey({ section: f.section, claim: f.claim, slot, slot_value: value }), source_key: ownKey,
      page_url: page?.url ?? null, page_title: page?.title ?? null,
    };
  }));
  const text = a.read.text;
  // One transaction (spec/db/012 save_extraction): the facts, their conflicts, confidence across sources, and the
  // source marked read. A failure anywhere leaves nothing of this save (Codex review on PR #91). A final address longer
  // than sources.url has always held is not stored rather than cut (a cut address is another page).
  const out = await db.rpc<{ facts: number; needsReview: number; conflicts: number }>(env, 'save_extraction', {
    p_run: run.id, p_brand: brand, p_source: sid, p_rows: rows,
    p_source_patch: { kind, title: a.read.title, text_excerpt: capText(text, 2000, 8000), source_text: text, ...(a.read.url && a.read.url.length <= 500 ? { url: a.read.url } : {}) },
  });
  return {
    sourceId: sid,
    facts: out.facts,
    dropped: Object.values(a.dropped).reduce((x, y) => x + (y ?? 0), 0),
    droppedBy: a.dropped,
    kind,
    needsReview: out.needsReview,
    conflicts: out.conflicts,
    truncated: a.read.truncated || (a.chunksSkipped ?? 0) > 0,
    chunksSkipped: a.chunksSkipped ?? 0,
    charsSkipped: a.charsSkipped ?? 0,
  };
}
