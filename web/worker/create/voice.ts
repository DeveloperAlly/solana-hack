// Voice spec and measured voice fit (backlog T1a; research 06 "Measuring each dimension automatically"; issue #93).
//
// The spec is the registered kit's template and dials (architecture §6.2 rung 0). Five dimensions are measured in code,
// where research 06 names a countable metric: sentence length (words per sentence; Flesch-Kincaid reported), jargon
// (difficult-word ratio, here the share of words of three or more syllables), emoji and punctuation (per 100 words),
// call to action (imperatives and a CTA lexicon) and formality (a closed-class proxy of the Heylighen and Dewaele
// F-score). Warmth, energy and humour have no validated text metric (research 06: "LLM rater plus human spot check"),
// so they are left to the independent reviewer (review.ts), never to the model that wrote the draft.
//
// Calibration: research 06 recommends "numeric targets with tolerance bands" calibrated "with a small user test"; no
// band values exist in the research yet. The bands below are this PR's initial values, marked uncalibrated, versioned
// as VOICE_BANDS_VERSION, and are to be fitted to owner labels per architecture §13.3 before any gate depends on them.
// Voice fit is therefore reported and ranks candidates; it does not refuse a draft.
import { emojiCount, sentences, syllables, words } from './text';

export const DIALS = ['formality', 'energy', 'humour', 'warmth', 'sentence_length', 'jargon', 'emoji', 'cta'] as const;
export type Dial = (typeof DIALS)[number];
export type Dials = Record<Dial, number>;

/**
 * Research 06 starter set (1-5), in DIALS order, as the Voice step offers it (web/src/screens/build/steps.ts
 * VOICE_TEMPLATES; the build test keeps the two equal). Efficient energy is 3 (owner, 2026-10-12).
 */
export const TEMPLATE_DIALS: Record<string, number[]> = {
  academic: [5, 1, 1, 2, 5, 4, 1, 1], enterprise: [4, 2, 1, 3, 3, 3, 1, 2], professional: [4, 2, 1, 3, 3, 2, 1, 2],
  friendly: [2, 3, 2, 5, 2, 1, 3, 2], plainspoken: [2, 2, 2, 3, 2, 1, 1, 2], efficient: [3, 3, 1, 2, 1, 2, 1, 2],
  candid_founder: [2, 3, 2, 3, 2, 2, 1, 3], playful: [1, 4, 5, 4, 2, 1, 4, 2], flirty: [1, 4, 4, 5, 1, 1, 4, 2],
  sales: [3, 4, 2, 3, 2, 2, 2, 5], hype_launch: [2, 5, 3, 3, 1, 2, 4, 4], empathetic_support: [3, 2, 1, 5, 2, 1, 1, 1],
};
/** The Voice step's default template (steps.ts normaliseVoice). */
export const DEFAULT_TEMPLATE = 'candid_founder';

export const VOICE_SPEC_VERSION = 'voice_spec_v1';
export interface VoiceSpec { version: string; source: 'answer' | 'template'; template: string; dials: Dials; sample: string | null }

/**
 * The voice spec a post is drafted to. The template is the one the registered kit recorded (kits.payload.policy). The
 * owner's own dial settings and sample are used only when the voice answer is the one that kit was registered under:
 * a later change reopens Gate 3 (api.ts saveAnswer), so an answer saved after registration belongs to no registered
 * kit, and the template's dials are used instead.
 */
export function voiceSpec(kit: { template: string | null; registeredAt: string | null }, answer: { data: Record<string, string>; updated_at?: string | null; skipped?: boolean } | null): VoiceSpec {
  const template = kit.template && TEMPLATE_DIALS[kit.template] ? kit.template : DEFAULT_TEMPLATE;
  const base = Object.fromEntries(DIALS.map((d, i) => [d, TEMPLATE_DIALS[template][i]])) as Dials;
  const current = !!answer && !answer.skipped && !!kit.registeredAt && !!answer.updated_at && new Date(answer.updated_at) <= new Date(kit.registeredAt);
  if (!current) return { version: VOICE_SPEC_VERSION, source: 'template', template, dials: base, sample: null };
  const dials = { ...base };
  for (const d of DIALS) if (/^[1-5]$/.test(answer!.data[d] ?? '')) dials[d] = Number(answer!.data[d]);
  const sample = typeof answer!.data.sample === 'string' && answer!.data.sample.trim() ? answer!.data.sample.trim().slice(0, 1000) : null;
  return { version: VOICE_SPEC_VERSION, source: 'answer', template, dials, sample };
}

/** One directive per dial level, so a number becomes an instruction (research 06 recommendation, after Grain's
 * graded directives; these are authored for JamJam's 8 dials, which Grain's set does not cover). */
const DIRECTIVES: Record<Dial, [string, string, string, string, string]> = {
  formality: ['Very casual: write as you talk, contractions welcome.', 'Casual and conversational.', 'Neutral: neither chatty nor stiff.', 'Professional and precise.', 'Formal: no contractions, no slang.'],
  energy: ['Calm and understated.', 'Measured, low key.', 'Steady, with some momentum.', 'Lively and upbeat.', 'High energy, launch-day momentum, still without hype words.'],
  humour: ['No jokes.', 'Rare dry wit at most.', 'Light humour where it fits.', 'Playful, with a joke or two.', 'Funny is the point, while the facts stay exact.'],
  warmth: ['Reserved and matter-of-fact.', 'Polite and a little distant.', 'Friendly.', 'Warm, speaks to the reader.', 'Very warm and personal.'],
  sentence_length: ['Very short sentences, under 8 words on average.', 'Short sentences, about 8 to 12 words.', 'Medium sentences, about 13 to 17 words.', 'Longer sentences, about 18 to 23 words.', 'Long, developed sentences.'],
  jargon: ['Plain words only; explain anything technical.', 'Mostly plain words.', 'Some domain terms where the audience knows them.', 'Technical vocabulary is fine.', 'Expert vocabulary, written for specialists.'],
  emoji: ['No emoji.', 'At most one emoji.', 'A few emoji where they help.', 'Emoji are part of the style.', 'Emoji-rich.'],
  cta: ['No call to action.', 'A soft invitation at most.', 'One clear call to action.', 'A direct call to action.', 'A strong, direct call to action.'],
};
const LABEL: Record<Dial, string> = { formality: 'Formality', energy: 'Energy', humour: 'Humour', warmth: 'Warmth', sentence_length: 'Sentence length', jargon: 'Jargon', emoji: 'Emoji', cta: 'Call to action' };

/** The spec as prompt lines: "Formality (2/5): Casual and conversational." Exclamation marks stay banned (slop.ts). */
export function directives(spec: VoiceSpec): string {
  return DIALS.map((d) => `- ${LABEL[d]} (${spec.dials[d]}/5): ${DIRECTIVES[d][spec.dials[d] - 1]}`).join('\n');
}
/** Targets for the dimensions only the reviewer judges. */
export const JUDGED: readonly Dial[] = ['warmth', 'energy', 'humour'];
export const toneTargets = (spec: VoiceSpec) => JUDGED.map((d) => `${d} ${spec.dials[d]}/5 (${DIRECTIVES[d][spec.dials[d] - 1]})`).join('; ');

export const VOICE_BANDS_VERSION = 'bands_v1_uncalibrated';
/** Upper bounds of levels 1 to 4 (level 5 is above the last). Initial, uncalibrated values; see the file comment. */
export const BANDS: Record<'sentence_length' | 'jargon' | 'emoji' | 'formality', [number, number, number, number]> = {
  // Words per sentence. GOV.UK flags sentences over 25 words (research 06, style guides), so level 5 starts near there.
  sentence_length: [8, 13, 18, 24],
  // Percent of words with three or more syllables.
  jargon: [8, 12, 16, 20],
  // Emoji plus exclamation marks per 100 words (exclamation marks are also a slop hit).
  emoji: [0, 1, 3, 6],
  // Closed-class formality proxy, 0-100 (see formalityProxy).
  formality: [44, 48, 52, 56],
};
const level = (v: number, b: [number, number, number, number]) => (v <= b[0] ? 1 : v <= b[1] ? 2 : v <= b[2] ? 3 : v <= b[3] ? 4 : 5);

const ARTICLES = new Set(['a', 'an', 'the']);
const PREPOSITIONS = new Set('about above across after against along among around at before behind below beneath beside between beyond by despite down during except for from in inside into like near of off on onto out outside over past per since through throughout to toward towards under until upon via with within without'.split(' '));
const PRONOUNS = new Set("i me my mine myself we us our ours ourselves you your yours yourself yourselves he him his she her hers it its they them their theirs".split(' '));
const INTERJECTIONS = new Set('oh wow hey yeah yep nope ok okay hmm ah aha oops ugh yay lol omg'.split(' '));
/**
 * Formality proxy, 0-100: the part of the Heylighen and Dewaele F-score that needs no part-of-speech tagger
 * (https://pespmc1.vub.ac.be/Papers/Formality.pdf, cited in research 06). F rises with articles and prepositions and falls
 * with pronouns and interjections; contractions are counted as informal too. 50 + half the net percentage.
 */
export function formalityProxy(text: string): number {
  const w = words(text);
  if (!w.length) return 50;
  let net = 0;
  for (const t of w) {
    if (ARTICLES.has(t) || PREPOSITIONS.has(t)) net++;
    else if (PRONOUNS.has(t) || INTERJECTIONS.has(t)) net--;
    if (/'(s|re|ve|ll|d|m|t)$/.test(t) || /n't$/.test(t)) net--;
  }
  return Math.round((50 + (net / w.length) * 50) * 10) / 10;
}

const CTA_VERBS = new Set('try join sign start get book download read learn follow share comment reply subscribe register visit check see watch grab claim apply contact dm message tell send ask build create explore discover install use'.split(' '));
const SOFT_CTA = /\b(if you('re| are)? (curious|interested|want)|happy to|let me know|feel free|reach out|we'd love|would love to hear)\b/i;
/** Call-to-action sentences: imperatives starting with a CTA verb (after an optional "please", "so" or "now"). */
export function ctaCount(text: string): { direct: number; soft: number } {
  let direct = 0;
  let soft = 0;
  for (const s of sentences(text)) {
    const w = words(s).filter((x) => !['please', 'so', 'now', 'just', 'go'].includes(x));
    if (w.length && CTA_VERBS.has(w[0])) direct++;
    else if (SOFT_CTA.test(s)) soft++;
  }
  return { direct, soft };
}
const ctaLevel = ({ direct, soft }: { direct: number; soft: number }) => (direct >= 3 ? 5 : direct === 2 ? 4 : direct === 1 ? 3 : soft ? 2 : 1);

export interface VoiceMeasure {
  bands: string;
  metrics: { wordsPerSentence: number; fkGrade: number; polysyllablePct: number; emojiPer100: number; formality: number; cta: { direct: number; soft: number } };
  levels: Partial<Dials>;
  /** 0-100: mean closeness of the measured levels to the targets (each dial 1 - |level - target| / 4). */
  fit: number;
  findings: string[];
}

/** Measures a draft against the spec's targets for the five computable dials. */
export function measureVoice(text: string, spec: VoiceSpec): VoiceMeasure {
  const w = words(text);
  const n = Math.max(1, w.length);
  const s = Math.max(1, sentences(text).length);
  const syl = w.reduce((k, x) => k + syllables(x), 0);
  const wps = w.length / s;
  const metrics = {
    wordsPerSentence: Math.round(wps * 10) / 10,
    // Flesch-Kincaid grade level (Kincaid et al. 1975): 0.39 * words/sentence + 11.8 * syllables/word - 15.59.
    fkGrade: Math.round((0.39 * wps + 11.8 * (syl / n) - 15.59) * 10) / 10,
    polysyllablePct: Math.round((w.filter((x) => syllables(x) >= 3).length / n) * 1000) / 10,
    emojiPer100: Math.round(((emojiCount(text) + (text.match(/!/g) ?? []).length) / n) * 1000) / 10,
    formality: formalityProxy(text),
    cta: ctaCount(text),
  };
  const levels: Partial<Dials> = {
    sentence_length: level(metrics.wordsPerSentence, BANDS.sentence_length),
    jargon: level(metrics.polysyllablePct, BANDS.jargon),
    emoji: level(metrics.emojiPer100, BANDS.emoji),
    formality: level(metrics.formality, BANDS.formality),
    cta: ctaLevel(metrics.cta),
  };
  const dims = Object.keys(levels) as Dial[];
  const fit = Math.round((dims.reduce((k, d) => k + (1 - Math.abs(levels[d]! - spec.dials[d]) / 4), 0) / dims.length) * 100);
  const findings = dims.filter((d) => Math.abs(levels[d]! - spec.dials[d]) >= 2).map((d) => `${LABEL[d]} reads as ${levels[d]}/5; the voice asks for ${spec.dials[d]}/5`);
  return { bands: VOICE_BANDS_VERSION, metrics, levels, fit, findings };
}
