// The claims gate in code (backlog G2, C1; architecture §6.1 "Claims gate" row: "Split the draft into sentences and
// claims; each must cite a kept fact; rules for numbers, prices, superlatives and guarantees"; issue #93).
//
// Deterministic, so the drafter cannot talk its way past it. A refusal here is final; passing here is not enough on its
// own, because meaning (does the fact really say this?) is judged by the independent reviewer (review.ts), and at
// approval by the claims check (posts.ts policyCheck). Findings name the claim and the rule it broke.
import { numbersIn } from '../extract/facts';
import { normaliseQuote } from '../quote';
import { fold, sentences, STOP, words } from './text';

export interface DraftClaim { text: string; fact_ids: string[] }
export interface FactRef { id: string; claim: string; quote?: string | null }
export interface ClaimFinding { rule: 'not_in_post' | 'no_fact' | 'unknown_fact' | 'number' | 'counted_noun' | 'superlative' | 'guarantee' | 'uncovered' | 'name'; text: string; detail: string }
export interface ClaimsResult { passed: boolean; claims: { text: string; factIds: string[]; ok: boolean }[]; findings: ClaimFinding[] }

// Superlatives and firsts, and guarantees: research 06 treats claims strictness as a gate (FTC substantiation), and
// §6.1 names superlatives and guarantees as claim rules.
const SUPERLATIVE = /\b(best|first|only|leading|largest|biggest|fastest|cheapest|top\s+\d+|number one|no\.\s?1|the most\s+\w+|world'?s\s+\w+|unmatched|unrivalled|unrivaled|unbeatable)\b|#\s?1\b/i;
const GUARANTEE = /\b(guarantee[ds]?|always|never fails?|100\s?%|risk[- ]free|promise[ds]?|certain(ly)?|proven)\b/i;
const NUMBER = /\d/;
const PRICE = /[$€£¥]\s?\d|\b\d+(\.\d+)?\s?(usd|usdc|eur|dollars?|cents?)\b|(?<!feel )\bfree\b(?!\s+to\b)/i;

/** Comparable text: the quote normaliser, lower case, single spaces. */
const norm = (s: string) => normaliseQuote(s).toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * The counted word after each number in a claim: the first content word after it ("10 enterprise customers" ->
 * enterprise). It must appear in a cited fact, so a fact about "10 companies" never backs "10 enterprise customers"
 * (the #64 design review example), even though the number matches; an added qualifier ("10 big companies") is refused
 * the same way. A year (1900-2099) counts nothing, so "in 2026, JamJam ..." is not read as a count of JamJams.
 */
export function countedNouns(text: string): string[] {
  const w = words(text);
  const out: string[] = [];
  for (let i = 0; i < w.length; i++) {
    if (!/^\d/.test(w[i]) || /^(19|20)\d\d$/.test(w[i])) continue;
    for (let j = i + 1; j < w.length; j++) {
      if (/^\d/.test(w[j])) break;
      if (STOP.has(w[j]) || ['percent', 'per', 'over', 'more', 'than', 'about', 'around', 'nearly', 'almost', 'plus'].includes(w[j])) continue;
      out.push(fold(w[j]));
      break;
    }
  }
  return out;
}

/** Capitalised words inside a sentence (not its first word): names of customers, partners, places and products. */
export function namesIn(sentence: string): string[] {
  const toks = sentence.match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) ?? [];
  return toks.slice(1).filter((t) => /^\p{Lu}/u.test(t) && !/^(I|I'm|I've)$/.test(t)).map((t) => t.toLowerCase());
}

// Named customers and partners: "Stripe uses JamJam", "trusted by Acme", "customers include Acme".
const NAMED_CUSTOMER = /(?:^|[^\p{L}])(\p{Lu}[\p{L}\p{N}&.'-]*)\s+(?:uses?|used|trusts?|chose|picked|relies on|runs on|switched to|works with|partnered with|signed up)\b|\b(?:used by|trusted by|backed by|chosen by|loved by|(?:customers?|clients?|partners?|investors?) (?:include|including|like|such as)|including)\s+(\p{Lu}[\p{L}\p{N}&.'-]*)/u;
// Customers, users and results stated as fact: "our customers ship twice as fast".
const CUSTOMERS = /\b(customers?|clients?|partners?|investors?|users?|companies|brands use|teams use)\b/i;
// Comparisons with something else: "simpler than", "more ... than", "vs".
const COMPARISON = /\b\w+er than\b|\b(more|less|fewer)\s+\w+\s+than\b|\bvs\.?(?=\s)|\bversus\b|\bcompared (to|with)\b/i;

/** Names a sentence presents as customers or partners (see NAMED_CUSTOMER). */
export function namedCustomers(sentence: string): string[] {
  const m = NAMED_CUSTOMER.exec(sentence);
  return m ? [(m[1] ?? m[2]).toLowerCase()] : [];
}

/**
 * Which sentences of a post state something that needs evidence under the claims gate (posts.ts CLAIMS_POLICY):
 * light (3): numbers, statistics and named customers; standard (4): every factual claim, so also customers and users,
 * results, comparisons, superlatives, firsts and guarantees; strict (5): all of that and every sentence about the brand.
 */
export function needsEvidence(sentence: string, level: string, brandName: string): boolean {
  const numeric = NUMBER.test(sentence) || PRICE.test(sentence);
  const named = namedCustomers(sentence).length > 0;
  if (level === '3') return numeric || named;
  const risky = numeric || named || SUPERLATIVE.test(sentence) || GUARANTEE.test(sentence) || CUSTOMERS.test(sentence) || COMPARISON.test(sentence);
  if (level === '5') return risky || new RegExp(`\\b(we|our|us|${brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i').test(sentence);
  return risky;
}

/**
 * Checks a candidate's declared claims against the usable facts it was given. A claim must be the post's own words, cite
 * at least one usable fact, and say no more than its facts: every number and counted noun, superlative and guarantee
 * must be in a cited fact. Every sentence that needs evidence under the gate must contain a claim that passed.
 */
export function checkClaims(body: string, declared: DraftClaim[], facts: FactRef[], level: string, brandName: string): ClaimsResult {
  const byId = new Map(facts.map((f) => [f.id, f]));
  const post = norm(body);
  const findings: ClaimFinding[] = [];
  const claims = declared.map((c) => {
    const text = c.text.trim();
    const ids = [...new Set(c.fact_ids)];
    const before = findings.length;
    const add = (rule: ClaimFinding['rule'], detail: string) => findings.push({ rule, text, detail });
    if (!text || !post.includes(norm(text))) add('not_in_post', 'the claim is not worded as in the post');
    const unknown = ids.filter((id) => !byId.has(id));
    if (unknown.length) add('unknown_fact', `cites ${unknown.length} fact id(s) that are not usable facts`);
    const cited = ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
    if (!cited.length) add('no_fact', 'cites no usable fact');
    else {
      const support = norm(cited.map((f) => `${f.claim} ${f.quote ?? ''}`).join(' '));
      const have = new Set(numbersIn(support));
      const missing = numbersIn(text).filter((n) => !have.has(n));
      if (missing.length) add('number', `no cited fact states ${missing.join(', ')}`);
      const nouns = new Set(words(support).map(fold));
      const absent = countedNouns(text).filter((n) => !nouns.has(n));
      if (absent.length) add('counted_noun', `the cited facts do not say "${absent.join(' ')}"`);
      const sup = SUPERLATIVE.exec(text)?.[0];
      if (sup && !support.includes(sup.toLowerCase())) add('superlative', `no cited fact says "${sup}"`);
      const gua = GUARANTEE.exec(text)?.[0];
      if (gua && !support.includes(gua.toLowerCase())) add('guarantee', `no cited fact says "${gua}"`);
    }
    return { text, factIds: ids, ok: findings.length === before };
  });
  const good = claims.filter((c) => c.ok).map((c) => ({ text: norm(c.text), ids: c.factIds }));
  const brand = brandName.toLowerCase();
  for (const s of sentences(body)) {
    if (!needsEvidence(s, level, brandName)) continue;
    const covering = good.filter((g) => g.text && norm(s).includes(g.text));
    if (!covering.length) { findings.push({ rule: 'uncovered', text: s, detail: 'states something that needs evidence, with no supported claim' }); continue; }
    // A name added beside a supported claim ("10 companies, including Stripe") is a claim of its own: every name in a
    // sentence that needs evidence must be in a fact its claims cite.
    const support = new Set(words(covering.flatMap((g) => g.ids.flatMap((id) => (byId.has(id) ? [`${byId.get(id)!.claim} ${byId.get(id)!.quote ?? ''}`] : []))).join(' ')));
    const extra = [...new Set([...namesIn(s), ...namedCustomers(s)])].filter((n) => !brand.split(/\s+/).includes(n) && !words(n).every((x) => support.has(x)));
    if (extra.length) findings.push({ rule: 'name', text: s, detail: `names ${extra.join(', ')}, which no cited fact mentions` });
  }
  return { passed: findings.length === 0, claims, findings };
}
