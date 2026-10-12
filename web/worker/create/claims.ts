// The claims gate in code (backlog G2, C1; architecture §6.1 "Claims gate" row: "Split the draft into sentences and
// claims; each must cite a kept fact; rules for numbers, prices, superlatives and guarantees"; issue #93).
//
// Deterministic, so the drafter cannot talk its way past it. A refusal here is final; passing here is not enough on its
// own, because meaning (does the fact really say this?) is judged by the independent reviewer (review.ts), and at
// approval by the claims check (posts.ts policyCheck). Findings name the claim and the rule it broke.
import { numbersIn } from '../extract/facts';
import { normaliseQuote } from '../quote';
import { fold, sentences, STOP, words } from './text';
import { CTA_VERBS } from './voice';

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
const NAMED_CUSTOMER = /(?:^|[^\p{L}])(\p{Lu}[\p{L}\p{N}&.'-]*)\s+(?:uses?|used|trusts?|chose|picked|relies on|switched to|works with|partnered with|signed up)\b|\b(?:used by|trusted by|backed by|chosen by|loved by|(?:customers?|clients?|partners?|investors?) (?:include|including|like|such as)|including)\s+(\p{Lu}[\p{L}\p{N}&.'-]*)/u;

/** Names a sentence presents as customers or partners (see NAMED_CUSTOMER). */
export function namedCustomers(sentence: string): string[] {
  const m = NAMED_CUSTOMER.exec(sentence);
  return m ? [(m[1] ?? m[2]).toLowerCase()] : [];
}

/** A question: it asks, it does not state. */
const isQuestion = (s: string) => /\?\s*["'\u2019\u201d)]*$/.test(s.trim());
/** An imperative or call to action: it starts with a verb addressed to the reader ("Try it", "Let's build"). */
function isImperative(s: string): boolean {
  const w = words(s).filter((x) => !['please', 'so', 'now', 'just', 'go', 'and'].includes(x));
  return !!w.length && (CTA_VERBS.has(w[0]) || /^(let's|lets|don't|stop|imagine|picture|meet|say|think|ask|keep|make|take|bring|tag)$/.test(w[0]));
}
/** A first-person opinion, feeling or intention ("We think", "I love", "we're excited", "we will"): policy 4 allows these. */
const OPINION = /^(?:honestly,?\s+|personally,?\s+)?(?:i|we)(?:'m|'re|'ve|'d| am| are| have| would)?\s+(?:really\s+|truly\s+|so\s+|still\s+|just\s+)?(?:think|believe|feel|felt|love|hate|hope|wish|like|want|prefer|guess|suspect|wonder|care|excited|proud|glad|happy|thrilled|grateful|curious|will|plan|intend|aim|going to|love to|like to)\b|^(?:in (?:my|our) (?:view|opinion)|to (?:me|us)|for (?:me|us),)/i;
const isOpinion = (s: string) => OPINION.test(normaliseQuote(s).trim());
/** A fragment that states nothing: under 3 words without a number, or only links, hashtags and mentions. */
const isFragment = (s: string) => (words(s).length < 3 && !/\d/.test(s)) || s.replace(/https?:\/\/\S+|\bwww\.\S+|\S+\.(?:com|net|org|io|tech|network|xyz|app|dev)\S*|[#@][\w-]+/gi, '').replace(/[^\p{L}\p{N}]/gu, '') === '';

// Comparisons and multipliers: "simpler than", "more ... than", "vs", "2x", "doubles".
const COMPARISON = /\b\w+er than\b|\b(?:more|less|fewer)\s+\w+\s+than\b|\bvs\.?(?=\s)|\bversus\b|\bcompared (?:to|with)\b|\b\d+(?:\.\d+)?x\b|\b(?:doubles?|doubled|triples?|tripled|halves|halved)\b/i;
// A question that states its answer: "Did you know X ...?", "Fun fact: ...".
const LEADING = /^(?:did you know|have you heard|fun fact|ever wondered why)\b/i;
// A name doing something, inside any sentence shape: "JamJam doubles revenue", "Stripe uses JamJam".
const NAME_VERB = /(?:^|[^\p{L}\p{N}])(\p{Lu}[\p{L}\p{N}]*)\s+(?:is|are|was|were|has|had|does|did|\p{Ll}+s)\b/gu;
const NOT_NAMES = new Set(['I', 'We', 'You', 'They', 'He', 'She', 'It', 'This', 'That', 'These', 'Those', 'There', 'Here', 'What', 'Who', 'Why', 'How', 'Which', 'Where', 'When', 'Is', 'Are', 'Does', 'Do', 'Did', 'Has', 'Have', 'Can', 'Will', 'Would', 'Should', 'Could', 'Let', 'Try', 'Start']);

/**
 * True when a sentence carries an assertion whatever its shape (PR #99 review: the shape of a sentence never exempts
 * its content): a number, price, guarantee, superlative, comparison or named customer; a question that states its
 * answer ("Did you know JamJam doubles revenue?"); or a name doing something ("JamJam doubles revenue").
 */
export function embeddedAssertion(s: string): boolean {
  if (NUMBER.test(s) || PRICE.test(s) || GUARANTEE.test(s) || SUPERLATIVE.test(s) || COMPARISON.test(s) || namedCustomers(s).length) return true;
  if (LEADING.test(normaliseQuote(s).trim())) return true;
  return [...s.matchAll(NAME_VERB)].some((m) => !NOT_NAMES.has(m[1]));
}

/**
 * Which sentences of a post need evidence under the claims gate (posts.ts CLAIMS_POLICY). Inverted on review of PR #99:
 * a sentence needs evidence unless it is positively not a statement of fact, and its shape never exempts its content.
 * - light (3): any sentence with a number, statistic, price or named customer, in any shape;
 * - standard (4): every sentence with an embedded assertion (embeddedAssertion), and every other sentence except
 *   questions, imperatives and calls to action, first-person opinions, feelings and intentions ("opinions and
 *   intentions are fine"), and fragments with nothing to state;
 * - strict (5): every sentence except questions, imperatives and fragments with nothing embedded.
 */
export function needsEvidence(sentence: string, level: string): boolean {
  if (level === '3') return NUMBER.test(sentence) || PRICE.test(sentence) || namedCustomers(sentence).length > 0;
  if (embeddedAssertion(sentence)) return true;
  if (isFragment(sentence) || isQuestion(sentence) || isImperative(sentence)) return false;
  if (level === '5') return true;
  return !isOpinion(sentence);
}

/** A sentence or claim as compared: normalised, without its closing punctuation. */
const key = (s: string) => norm(s).replace(/[\s.!?…:;,"'\u2019\u201d)]+$/u, '');

/**
 * Checks a candidate's declared claims against the usable facts it was given. A claim is one whole sentence of the post,
 * as written (PR #99 review: a part of a sentence could leave the rest of it unchecked). It cites at least one usable
 * fact and says no more than its facts: every number, the counted word after each number, every superlative, guarantee
 * and name in the sentence must be in a cited fact. Every sentence that needs evidence under the gate must be a claim
 * that passed.
 */
export function checkClaims(body: string, declared: DraftClaim[], facts: FactRef[], level: string, brandName: string): ClaimsResult {
  const byId = new Map(facts.map((f) => [f.id, f]));
  const sentenceKeys = new Set(sentences(body).map(key));
  const brand = new Set(words(brandName));
  const findings: ClaimFinding[] = [];
  const claims = declared.map((c) => {
    const text = c.text.trim();
    const ids = [...new Set(c.fact_ids)];
    const before = findings.length;
    const add = (rule: ClaimFinding['rule'], detail: string) => findings.push({ rule, text, detail });
    if (!text || !sentenceKeys.has(key(text))) add('not_in_post', 'a claim must be one whole sentence of the post, as written');
    const unknown = ids.filter((id) => !byId.has(id));
    if (unknown.length) add('unknown_fact', `cites ${unknown.length} fact id(s) that are not usable facts`);
    const cited = ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
    if (!cited.length) add('no_fact', 'cites no usable fact');
    else {
      const support = norm(cited.map((f) => `${f.claim} ${f.quote ?? ''}`).join(' '));
      const have = new Set(numbersIn(support));
      const missing = numbersIn(text).filter((n) => !have.has(n));
      if (missing.length) add('number', `no cited fact states ${missing.join(', ')}`);
      const supportWords = new Set(words(support));
      const nouns = new Set([...supportWords].map(fold));
      const absent = countedNouns(text).filter((n) => !nouns.has(n));
      if (absent.length) add('counted_noun', `the cited facts do not say "${absent.join(' ')}"`);
      const sup = SUPERLATIVE.exec(text)?.[0];
      if (sup && !support.includes(sup.toLowerCase())) add('superlative', `no cited fact says "${sup}"`);
      const gua = GUARANTEE.exec(text)?.[0];
      if (gua && !support.includes(gua.toLowerCase())) add('guarantee', `no cited fact says "${gua}"`);
      // A name beside the claim ("10 companies, including Stripe") is a claim of its own and must be in a cited fact.
      const extra = [...new Set([...namesIn(text), ...namedCustomers(text)])].filter((n) => !words(n).every((x) => brand.has(x) || supportWords.has(x)));
      if (extra.length) add('name', `names ${extra.join(', ')}, which no cited fact mentions`);
    }
    return { text, factIds: ids, ok: findings.length === before };
  });
  const passed = new Set(claims.filter((c) => c.ok).map((c) => key(c.text)));
  for (const s of sentences(body)) {
    if (needsEvidence(s, level) && !passed.has(key(s))) findings.push({ rule: 'uncovered', text: s, detail: 'states something that needs evidence, and is not a supported claim' });
  }
  return { passed: findings.length === 0, claims, findings };
}
