// The pure stages of fact extraction (issue #64), each the body of one engine code step (engine/steps.ts CODE), so
// each is a small tested unit another workflow can reuse (#34 prefill, #35 research). No database, no model calls.
// Order in the extract_facts definition (engine/seed.ts): chunk -> (model: extract) -> align -> batch ->
// (model: support check) -> decide -> save.
import { isSection } from '../kit';
import { MAX_QUOTE, normaliseMapped, normaliseQuote } from '../quote';
import { alignQuote, fuzzyBudget, type MatchType } from './align';
import { chunkText, type ChunkOptions } from './chunk';
import { factKey, MAX_CLAIM, MAX_VALUE, normText, numbersSupported, SLOTS, type Slot } from './facts';

/** What a reply to the extraction prompt holds per fact (extract/schemas.ts EXTRACTED_FACTS). */
export interface ExtractedFact { section: string; claim: string; quote: string; slot: string; value: string }

/** A fact whose quote has been located in the source: the stored quote is the exact source text at [start, end). */
export interface Candidate {
  /** Local id within this run, used to match support-check verdicts. */
  id: string;
  section: string;
  claim: string;
  slot: Slot;
  value: string;
  quote: string;
  start: number;
  end: number;
  match: MatchType;
  ratio: number;
  /** The chunk the (first) extraction came from. */
  chunk: number;
  /** Distinct passages in this source that stated this fact. */
  passages: number;
}

/** Why a fact proposed by the model was not kept. Counted per run; the model's text is never kept for a dropped fact. */
export type DropReason =
  | 'incomplete' // empty claim or quote, or an unknown section
  | 'too_long' // claim, quote or value over its limit
  | 'not_in_source' // the quote is not in the source, exactly or within the fuzzy threshold
  | 'not_located' // no exact match, and the fuzzy search was skipped for its CPU budget (align.ts)
  | 'number_not_in_quote' // the claim states a number the passage does not
  | 'unsupported' // the support check found the passage does not support the claim
  | 'not_checked'; // the support check returned no usable verdict for it
export type Dropped = Partial<Record<DropReason, number>>;
const drop = (d: Dropped, r: DropReason) => { d[r] = (d[r] ?? 0) + 1; };

/** Chunk step: chunks with offsets, at most `maxChunks`; the rest is reported, never silently ignored. */
export function chunkSource(text: string, options: Partial<ChunkOptions>, maxChunks: number) {
  const all = chunkText(text, options);
  const chunks = all.slice(0, maxChunks).map((c) => ({ ...c, part: c.index + 1 }));
  const covered = chunks.length ? chunks[chunks.length - 1].end : 0;
  return { chunks, count: chunks.length, total: all.length, skipped: all.length - chunks.length, charsSkipped: text.length - covered };
}

/**
 * Align step: every proposed fact's quote located in the source (align.ts) and its number guard applied. Only the same
 * claim on the same located passage (one sentence seen by two overlapping chunks) is merged here, because the judge
 * would be asked exactly the same question twice. Different claims for the same fact (the same slot and value), and the
 * same claim on different passages, all go to the support check: an overclaim or a passage that does not support the
 * claim must never stand in for a true reading (Codex review on PR #91). Those are merged after the check
 * (decideFacts). A slot whose value is not in the passage is cleared to 'none', so a value the source does not state
 * can never raise or settle a conflict.
 */
export function alignFacts(text: string, chunks: { start: number; end: number }[], replies: ({ facts?: ExtractedFact[] } | null)[]) {
  const page = normaliseMapped(text);
  const budget = fuzzyBudget();
  const dropped: Dropped = {};
  const byKey = new Map<string, Candidate>();
  const facts: Candidate[] = [];
  let proposed = 0;
  replies.forEach((reply, j) => {
    for (const f of reply?.facts ?? []) {
      proposed++;
      const claim = f.claim.trim();
      const quote = f.quote.trim();
      if (!claim || !quote || !isSection(f.section)) { drop(dropped, 'incomplete'); continue; }
      if (claim.length > MAX_CLAIM || quote.length > MAX_QUOTE || f.value.length > MAX_VALUE) { drop(dropped, 'too_long'); continue; }
      const skippedBefore = budget.skipped;
      const at = alignQuote(text, page, quote, chunks[j], budget);
      if (!at) { drop(dropped, budget.skipped > skippedBefore ? 'not_located' : 'not_in_source'); continue; }
      let slot: Slot = f.slot in SLOTS ? (f.slot as Slot) : 'none';
      let value = slot === 'none' ? '' : f.value.trim();
      if (slot !== 'none' && (!value || !normaliseQuote(at.text).includes(normaliseQuote(value)))) { slot = 'none'; value = ''; }
      if (!numbersSupported(`${claim} ${value}`, at.text)) { drop(dropped, 'number_not_in_quote'); continue; }
      const key = `${factKey({ section: f.section, claim, slot: 'none', slot_value: '' })}|${slot}|${normText(value)}|${at.start}|${at.end}`;
      const same = byKey.get(key);
      if (same) {
        // The same passage, located exactly by one reading and fuzzily by another: keep the exact match type.
        if (same.match === 'fuzzy' && at.match === 'exact') Object.assign(same, { match: at.match, ratio: at.ratio });
        continue;
      }
      const c: Candidate = { id: `f${facts.length + 1}`, section: f.section, claim, slot, value, quote: at.text, start: at.start, end: at.end, match: at.match, ratio: at.ratio, chunk: j, passages: 1 };
      facts.push(c);
      byKey.set(key, c);
    }
  });
  return { facts, proposed, merged: proposed - facts.length - Object.values(dropped).reduce((a, b) => a + (b ?? 0), 0), dropped };
}

/**
 * Batch step: the support check's inputs, `size` facts per call. Each item holds only the claim and the exact source
 * passage: the judge never sees the extraction prompt, the chunk or the model's own quote (architecture §6.1,
 * "nothing grades itself").
 */
export function supportBatches(facts: Candidate[], size: number, maxBatches: number) {
  const batches: { ids: string[]; text: string }[] = [];
  for (let i = 0; i < facts.length; i += size) {
    const part = facts.slice(i, i + size);
    batches.push({ ids: part.map((f) => f.id), text: JSON.stringify(part.map((f) => ({ id: f.id, claim: f.claim, passage: f.quote })), null, 1) });
  }
  if (batches.length > maxBatches) throw new Error(`support check needs ${batches.length} calls, more than the ${maxBatches} the definition allows`);
  return { batches, count: batches.length };
}

/**
 * Decide step: only facts the support check marked supported are kept. A fact with no verdict, or with contradictory
 * verdicts, is dropped: it is never approved by default. Supported facts are then merged into one when they are the
 * same fact (the same slot and value, or the same claim: facts.ts factKey), or when they read the same passage for the
 * same section and slot (one sentence worded twice). The first supported reading is kept, unless a later one located
 * its passage exactly and the kept one only fuzzily: then the exact reading replaces it whole (claim, quote and
 * offsets stay a checked pair). `passages` counts the distinct passages that stated the fact.
 */
export function decideFacts(facts: Candidate[], batches: { ids: string[] }[], replies: ({ verdicts?: { id: string; supported: boolean }[] } | null)[]) {
  const verdict = new Map<string, boolean | 'mixed'>();
  batches.forEach((b, j) => {
    const asked = new Set(b.ids);
    for (const v of replies[j]?.verdicts ?? []) {
      if (!asked.has(v.id)) continue;
      const had = verdict.get(v.id);
      verdict.set(v.id, had === undefined || had === v.supported ? v.supported : 'mixed');
    }
  });
  const dropped: Dropped = {};
  const kept: Candidate[] = [];
  const spans: Set<string>[] = [];
  const at = new Map<string, number>();
  const keysOf = (f: Candidate) => [`fact|${factKey({ section: f.section, claim: f.claim, slot: f.slot, slot_value: f.value })}`, `span|${f.section}|${f.slot}|${f.value}|${f.start}|${f.end}`];
  let merged = 0;
  for (const f of facts) {
    const v = verdict.get(f.id);
    if (v !== true) {
      drop(dropped, v === undefined || v === 'mixed' ? 'not_checked' : 'unsupported');
      continue;
    }
    const keys = keysOf(f);
    const i = keys.map((k) => at.get(k)).find((x) => x !== undefined);
    if (i === undefined) {
      kept.push({ ...f });
      spans.push(new Set([`${f.start}|${f.end}`]));
      for (const k of keys) at.set(k, kept.length - 1);
      continue;
    }
    merged++;
    spans[i].add(`${f.start}|${f.end}`);
    if (kept[i].match === 'fuzzy' && f.match === 'exact') kept[i] = { ...f };
    for (const k of keys) if (!at.has(k)) at.set(k, i);
  }
  kept.forEach((f, i) => { f.passages = spans[i].size; });
  return { facts: kept, dropped, merged };
}

/** Adds drop counts together. */
export function addDropped(...all: (Dropped | null | undefined)[]): Dropped {
  const out: Dropped = {};
  for (const d of all) for (const [k, n] of Object.entries(d ?? {})) out[k as DropReason] = (out[k as DropReason] ?? 0) + (n ?? 0);
  return out;
}
