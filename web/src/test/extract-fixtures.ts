// Synthetic fixtures for fact extraction (issue #64). They stand in for the evaluation sets of architecture §13.1
// until the real ones exist: F1 (frozen brand snapshots) and F2 (owner-labelled gold facts, issue #65) need the owner,
// so precision and recall are not measured here. F3 (planted near-miss quotes: one word changed, a number changed, a
// sentence merged from two places) is generated below from the page sentences, as §13.1 describes, and F6-style claim
// labels are hand-written for the support check. Nothing here is real brand data.

/** The brand's own site (jamjam.tech), one sentence per paragraph so the planted variants are easy to read. */
export const SITE_SENTENCES = [
  'JamJam was founded in 2020 in Melbourne.',
  'JamJam is used by teams at 10 companies.',
  'Our mission is to help brands prove what they say.',
  'Every post is checked by a person before it is registered on Solana.',
  'Plans start at $12 a month for a single brand.',
  'The brand kit covers purpose, positioning, audience, voice, origin and messaging.',
];

/** Neutral filler, so a page spans more than one chunk and facts sit in different chunks. */
export const filler = (n: number) => Array.from({ length: n }, (_, i) => `Section ${i + 1} describes how drafts move from idea to approval without changing what was said.`).join('\n\n');

export const SITE_TEXT = [SITE_SENTENCES.slice(0, 3).join('\n\n'), filler(150), SITE_SENTENCES.slice(3).join('\n\n')].join('\n\n');

/** A third-party article that disagrees with the site on one single-valued fact (founded) and agrees on another. */
export const NEWS_TEXT = 'Melbourne start-up JamJam, founded in 2021, lets brands register what they publish. JamJam is based in Melbourne.';

/** F3: near-miss quotes planted from the site sentences. kind says how each was made. */
export const PLANTED: { kind: 'word' | 'number' | 'merge_adjacent' | 'merge_distant'; quote: string; from: string }[] = [
  { kind: 'word', quote: 'Every post is checked by a robot before it is registered on Solana.', from: SITE_SENTENCES[3] },
  { kind: 'word', quote: 'The brand kit covers purpose, positioning, audience, tone, origin and messaging.', from: SITE_SENTENCES[5] },
  { kind: 'word', quote: 'Our vision is to help brands prove what they say.', from: SITE_SENTENCES[2] },
  { kind: 'number', quote: 'JamJam was founded in 2019 in Melbourne.', from: SITE_SENTENCES[0] },
  { kind: 'number', quote: 'JamJam is used by teams at 100 companies.', from: SITE_SENTENCES[1] },
  { kind: 'number', quote: 'Plans start at $15 a month for a single brand.', from: SITE_SENTENCES[4] },
  { kind: 'merge_adjacent', quote: 'JamJam is used by teams at 10 companies to help brands prove what they say.', from: `${SITE_SENTENCES[1]} ${SITE_SENTENCES[2]}` },
  { kind: 'merge_distant', quote: 'JamJam was founded in 2020 and every post is checked by a person.', from: `${SITE_SENTENCES[0]} ${SITE_SENTENCES[3]}` },
  { kind: 'merge_distant', quote: 'Our mission is to help brands start at $12 a month.', from: `${SITE_SENTENCES[2]} ${SITE_SENTENCES[4]}` },
];

/** What the stub extraction model proposes when a chunk contains `when`. */
export interface Proposal { when: string; section: string; claim: string; quote: string; slot: string; value: string }

export const SITE_PROPOSALS: Proposal[] = [
  { when: SITE_SENTENCES[0], section: 'origin', claim: 'JamJam was founded in 2020.', quote: 'JamJam was founded in 2020 in Melbourne.', slot: 'founded', value: '2020' },
  { when: SITE_SENTENCES[0], section: 'origin', claim: 'JamJam is based in Melbourne.', quote: 'founded in 2020 in Melbourne', slot: 'headquarters', value: 'Melbourne' },
  // The design-review example from issue #64: the claim upgrades the quote.
  { when: SITE_SENTENCES[1], section: 'positioning', claim: 'JamJam has 10 enterprise customers.', quote: 'JamJam is used by teams at 10 companies.', slot: 'customer_count', value: '10' },
  // Typographic differences only (curly apostrophe-free here, but a dash and quotes the normaliser unifies).
  { when: SITE_SENTENCES[2], section: 'purpose', claim: 'JamJam exists to help brands prove what they say.', quote: 'Our mission is to help brands prove what they say.', slot: 'none', value: '' },
  // Planted near-misses (F3) with claims that carry the changed content.
  { when: SITE_SENTENCES[3], section: 'messaging', claim: 'A robot checks every post before it is registered.', quote: PLANTED[0].quote, slot: 'none', value: '' },
  { when: SITE_SENTENCES[0], section: 'origin', claim: 'JamJam was founded in 2019.', quote: PLANTED[3].quote, slot: 'founded', value: '2019' },
  { when: SITE_SENTENCES[4], section: 'messaging', claim: 'Plans start at $15 a month.', quote: PLANTED[5].quote, slot: 'price_from', value: '$15' },
  // A true fact whose quote has one word added: located fuzzily, supported on the real passage, held for review.
  { when: SITE_SENTENCES[3], section: 'messaging', claim: 'A person checks every post before it is registered on Solana.', quote: 'Every post is checked by a real person before it is registered on Solana.', slot: 'none', value: '' },
  // An invented fact: its quote is nowhere in the source.
  { when: SITE_SENTENCES[4], section: 'positioning', claim: 'JamJam won a 2024 design award.', quote: 'JamJam won the 2024 Brand Design Award.', slot: 'none', value: '' },
  // A real fact with an exact quote and a number the quote states.
  { when: SITE_SENTENCES[4], section: 'messaging', claim: 'Plans start at $12 a month.', quote: 'Plans start at $12 a month for a single brand.', slot: 'price_from', value: '$12' },
];

export const NEWS_PROPOSALS: Proposal[] = [
  { when: 'founded in 2021', section: 'origin', claim: 'JamJam was founded in 2021.', quote: 'JamJam, founded in 2021', slot: 'founded', value: '2021' },
  { when: 'based in Melbourne', section: 'origin', claim: 'JamJam is based in Melbourne.', quote: 'JamJam is based in Melbourne.', slot: 'headquarters', value: 'Melbourne' },
];

/**
 * Hand labels for the stub support judge (an F6-style set): is the claim entailed by the passage it is shown with?
 * Keyed by claim; the judge fails a test on any claim it has no label for, so no verdict is ever made up.
 */
export const SUPPORT_LABELS: Record<string, boolean> = {
  'JamJam was founded in 2020.': true,
  'JamJam is based in Melbourne.': true,
  'JamJam has 10 enterprise customers.': false,
  'JamJam exists to help brands prove what they say.': true,
  'A robot checks every post before it is registered.': false,
  'Plans start at $12 a month.': true,
  'A person checks every post before it is registered on Solana.': true,
  'JamJam was founded in 2021.': true,
};
