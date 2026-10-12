// Fact rules for extraction (issue #64; architecture §6.1 "Fact extraction with quote check"; backlog B3, B3a). Pure
// functions: no database, no model. The model proposes; these rules decide what a fact is, when two facts are the
// same, how confident the system is, and when sources disagree. Nothing here asks the model how sure it is (§6.1:
// "confidence computed from match type and number of sources, not asked of the model").
import { normaliseQuote } from '../quote';
import type { MatchType } from './align';

/**
 * Single-valued facts: two sources giving different values for one of these cannot both be right today, so a
 * disagreement becomes one question for the owner (backlog B3a: "facts from different sources that contradict go to
 * the owner; the system never picks"). The list is JamJam's own, drawn from the identity fields (architecture §4
 * row 1) and the "numbers and superlatives in sources" behind the claims section (§4 row 12). A fact outside these
 * slots is 'none' and is never compared for contradiction, only merged when it says the same thing.
 */
export const SLOTS = {
  founded: 'when the brand was founded or launched',
  headquarters: 'where the brand is based',
  legal_name: 'the registered company name',
  team_size: 'how many people work on the brand',
  customer_count: 'how many customers or clients it has',
  user_count: 'how many users it has',
  funding: 'how much money it has raised',
  price_from: 'its lowest listed price',
} as const;
export type Slot = keyof typeof SLOTS | 'none';
export const SLOT_IDS = [...Object.keys(SLOTS), 'none'] as const;
/** The slot list as the extraction prompt shows it. */
export const SLOT_PROMPT = Object.entries(SLOTS).map(([k, v]) => `${k} (${v})`).join(', ');

/** Facts asked for per chunk. Replies with more are refused as a whole (schema-shaped but over the limit). */
export const MAX_FACTS_PER_CHUNK = 20;
/** Longest claim and slot value kept; longer ones are dropped, not cut, so no fact is changed after the check. */
export const MAX_CLAIM = 300;
export const MAX_VALUE = 120;

/** Comparable form of a slot value or claim: the quote normaliser, then letters, digits and single spaces only, with
 * thousands separators removed from numbers ("1,000" and "1000" compare equal). */
export function normText(s: string): string {
  return normaliseQuote(s)
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(/[^\p{L}\p{N}.]+/gu, ' ')
    .replace(/\.(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Two facts are the same fact when they fill the same slot with the same value, or, outside slots, say the same
 * thing about the same section. */
export function factKey(f: { section: string; claim: string; slot?: string | null; slot_value?: string | null }): string {
  return f.slot && f.slot !== 'none' ? `slot:${f.slot}:${normText(f.slot_value ?? '')}` : `claim:${f.section}:${normText(f.claim)}`;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * A slot value stands alone in its passage (Codex review on PR #91: "York" must not stand for "New York"). It must
 * occur on token boundaries (no letter or digit touching either end, and a number not continuing as "10,000" or
 * "2.5"), compared through the quote normaliser. A capitalised value must also be the whole name where it occurs: the
 * word right after it is not capitalised, and neither is the word right before it unless that word starts a sentence.
 * This is a cheap guard; the support check, which now sees the slot and value, decides the meaning.
 */
export function valueStandsAlone(value: string, passage: string): boolean {
  const v = normaliseQuote(value);
  if (!v) return false;
  const p = normaliseQuote(passage);
  let at = p.indexOf(v);
  let bounded = false;
  while (at >= 0 && !bounded) {
    const before = p.slice(0, at);
    const after = p.slice(at + v.length);
    bounded = !/[\p{L}\p{N}]$/u.test(before) && !/^[\p{L}\p{N}]/u.test(after) && !(/\d$/.test(v) && /^[.,]\d/.test(after)) && !(/^\d/.test(v) && /\d[.,]$/.test(before));
    at = p.indexOf(v, at + 1);
  }
  if (!bounded) return false;
  // Capitalisation is read from the passage as written (the normaliser lowercases).
  const src = passage.normalize('NFKC');
  const word = value.normalize('NFKC').trim();
  if (!/^\p{Lu}/u.test(word)) return true;
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(word).replace(/\s+/g, '\\s+')}(?![\\p{L}\\p{N}])`, 'gu');
  let seen = false;
  for (const m of src.matchAll(re)) {
    seen = true;
    const before = src.slice(0, m.index);
    const after = src.slice(m.index! + m[0].length);
    const next = /^ (\p{Lu})/u.test(after);
    const prev = / ?(\S+) $/u.exec(before);
    const prevCapital = !!prev && /^\p{Lu}/u.test(prev[1]) && !/(^|[.!?:;]\s*)$/.test(before.slice(0, before.length - prev[0].length));
    if (!next && !prevCapital) return true;
  }
  // Not found as written (typography differs from the value): the boundary check above stands.
  return !seen;
}

/** Numbers in text, thousands separators removed: "1,250 brands in 2.5 years" -> ["1250", "2.5"]. */
export function numbersIn(s: string): string[] {
  return (normaliseQuote(s).match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? []).map((n) => n.replace(/,/g, ''));
}

/**
 * Every number in the claim (and slot value) appears in the quote. A deterministic guard ahead of the support check:
 * a changed number is the commonest synthetic claim error (architecture §13.1, F6), and no model is needed to see it.
 * The support check still decides meaning; this only refuses what is plainly not in the passage.
 */
export function numbersSupported(claim: string, quote: string): boolean {
  const have = new Set(numbersIn(quote));
  return numbersIn(claim).every((n) => have.has(n));
}

export type Confidence = 'high' | 'medium' | 'low';
/**
 * Confidence from match type and the number of independent sources (architecture §6.1; levels from §3, "confidence
 * (high / med / low)"): an exact quote backed by two or more independent sources is high; an exact quote from one
 * source, or a fuzzily located passage backed by another source, is medium; a fuzzily located passage alone is low.
 */
export function confidenceOf(match: MatchType, independentSources: number): Confidence {
  if (match === 'exact') return independentSources >= 2 ? 'high' : 'medium';
  return independentSources >= 2 ? 'medium' : 'low';
}

/** Which source counts as independent: pages on one host are one source (a site's subpages repeat each other);
 * anything without a web address (a paste, a document) is its own source. */
export function sourceKey(s: { id: string; url?: string | null }): string {
  try {
    if (s.url && /^https?:\/\//i.test(s.url)) return `host:${new URL(s.url).hostname.toLowerCase().replace(/^www\./, '')}`;
  } catch {
    // not a usable address: falls through to the source id
  }
  return `source:${s.id}`;
}

/** A stored fact as the conflict and confidence rules read it. */
export interface StoredFact {
  id: string;
  source_id: string | null;
  section: string;
  claim: string;
  slot: string | null;
  slot_value: string | null;
  match: string | null;
  review_status: string;
  trust: string;
}

export interface Conflict { slot: Exclude<Slot, 'none'>; ids: string[]; values: { value: string; ids: string[] }[]; question: string }

/**
 * Slots where the brand's live facts (not rejected) give more than one value: one conflict per slot, listing every
 * fact on every side, and the question the owner answers. The system never picks a side (backlog B3a).
 */
export function findConflicts(facts: StoredFact[]): Conflict[] {
  const bySlot = new Map<string, Map<string, { value: string; ids: string[] }>>();
  for (const f of facts) {
    if (f.review_status === 'rejected' || !f.slot || f.slot === 'none' || !(f.slot in SLOTS)) continue;
    const v = normText(f.slot_value ?? '');
    if (!v) continue;
    const values = bySlot.get(f.slot) ?? new Map();
    const side = values.get(v) ?? { value: (f.slot_value ?? '').trim(), ids: [] };
    side.ids.push(f.id);
    values.set(v, side);
    bySlot.set(f.slot, values);
  }
  const out: Conflict[] = [];
  for (const [slot, values] of [...bySlot].sort(([a], [b]) => a.localeCompare(b))) {
    if (values.size < 2) continue;
    const sides = [...values.values()].map((s) => ({ ...s, ids: [...s.ids].sort() })).sort((a, b) => a.value.localeCompare(b.value));
    const s = slot as Exclude<Slot, 'none'>;
    out.push({ slot: s, ids: sides.flatMap((x) => x.ids).sort(), values: sides, question: conflictQuestion(s, sides) });
  }
  return out;
}

/** The one question a conflict puts to the owner. */
export function conflictQuestion(slot: Exclude<Slot, 'none'>, sides: { value: string; ids: string[] }[]): string {
  const options = sides.map((s) => `"${s.value}" (${s.ids.length} ${s.ids.length === 1 ? 'fact' : 'facts'})`).join(' or ');
  return `Your sources disagree on ${SLOTS[slot]}: ${options}. Which is right?`;
}
