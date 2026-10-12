// Synthetic fixture brand for the prefill tests (issue #34). Tidewater is invented: nothing here is real brand data.
// It stands in for the F1 brand snapshots and F2 gold labels of architecture §13.1 until the owner's exist (the aDNA
// snapshot and its labels are not in the repo; issue #65), so these tests prove the pipeline's rules and wiring, not
// model accuracy. Each proposal says what the stub extraction model returns for a chunk containing `when`, and the
// hand labels say what the stub support judge and the stub router answer; both stubs throw on any claim without a label.

const filler = (topic: string, n: number) => Array.from({ length: n }, (_, i) => `Note ${i + 1} on ${topic}: every order is roasted, packed and logged the same day it is placed.`).join(' ');

export const SITE = 'https://tidewater.example';

export const HOME = [
  'Tidewater helps small coffee roasters sell direct to cafes.',
  'Unlike wholesale brokers, Tidewater takes no cut of the sale.',
  'Roasters still sell through brokers and spreadsheets today.',
  'Only Tidewater ships same-day roast batches to cafes across Victoria.',
  'Fresh roast, fair price.',
];
export const ABOUT = [
  'We started Tidewater because roasters lost a third of their margin to middlemen.',
  'Before Tidewater, cafes waited two weeks for fresh beans.',
  'Our first cafe customer, Harbour Lane, switched in its first month.',
  'Tidewater was founded in 2019 in Geelong.',
  'We believe great coffee should reward the people who roast it.',
];
export const HOW = ['Tidewater is built for independent roasters with fewer than ten staff.'];
export const NEWS = 'Geelong start-up Tidewater, founded in 2020, connects roasters with cafes.';

const page = (title: string, paras: string[], links: string[] = []) =>
  `<html><head><title>${title}</title></head><body>${links.map((l) => `<a href="${l}">${l}</a>`).join('')}${paras.map((p) => `<p>${p}</p>`).join('')}</body></html>`;

/** The pages the stubbed web serves. /private is linked from the home page and disallowed by robots.txt. */
export const PAGES: Record<string, string> = {
  [`${SITE}/`]: page('Tidewater', [...HOME, filler('roasting', 12)], ['/about', '/how-it-works', '/private']),
  [`${SITE}/about`]: page('About Tidewater', [...ABOUT, filler('our story', 6)]),
  [`${SITE}/how-it-works`]: page('How it works', [...HOW, filler('delivery', 6)]),
  [`${SITE}/private`]: page('Private', ['Tidewater secret plans.']),
  'https://news.example/tidewater': page('Roasting news', [NEWS]),
};
export const ROBOTS: Record<string, string> = { [SITE]: 'User-agent: *\nDisallow: /private' };

export interface Proposal { when: string; section: string; claim: string; quote: string; slot: string; value: string }
const p = (when: string, section: string, claim: string, quote = when, slot = 'none', value = ''): Proposal => ({ when, section, claim, quote, slot, value });

export const PROPOSALS: Proposal[] = [
  p(HOME[0], 'positioning', 'Tidewater helps small coffee roasters sell direct to cafes.'),
  p(HOME[1], 'positioning', 'Tidewater takes no cut of the sale, unlike wholesale brokers.'),
  p(HOME[2], 'positioning', 'Roasters sell through brokers and spreadsheets today.'),
  p(HOME[3], 'positioning', 'Only Tidewater ships same-day roast batches to cafes across Victoria.'),
  p(HOME[4], 'messaging', 'Tidewater says "Fresh roast, fair price."'),
  p(ABOUT[0], 'origin', 'Tidewater started because roasters lost a third of their margin to middlemen.'),
  p(ABOUT[1], 'origin', 'Before Tidewater, cafes waited two weeks for fresh beans.'),
  p(ABOUT[2], 'origin', 'Harbour Lane, the first cafe customer, switched in its first month.'),
  p(ABOUT[3], 'origin', 'Tidewater was founded in 2019.', ABOUT[3], 'founded', '2019'),
  p(ABOUT[4], 'purpose', 'Tidewater believes great coffee should reward the people who roast it.'),
  p(HOW[0], 'audience', 'Tidewater is built for independent roasters with fewer than ten staff.'),
  // Invented: the quote is nowhere on the page.
  p(HOW[0], 'audience', 'Tidewater serves 500 cafes nationwide.', 'Tidewater serves 500 cafes nationwide.'),
  // Upgraded: the passage does not support the claim; the support judge says so.
  p(HOME[0], 'positioning', 'Tidewater is the leading coffee marketplace in Australia.', HOME[0]),
  p('founded in 2020', 'origin', 'Tidewater was founded in 2020.', 'Tidewater, founded in 2020', 'founded', '2020'),
];

/** Support-judge labels (F6-style): is the claim entailed by its passage? */
export const SUPPORT: Record<string, boolean> = Object.fromEntries(PROPOSALS.map((x) => [x.claim, !/leading coffee marketplace/.test(x.claim)]));

/** The claims extraction may keep: every proposal whose quote is on its page and whose claim the passage supports. */
export const TRUE_CLAIMS = new Set(PROPOSALS.filter((x) => SUPPORT[x.claim] && !/500 cafes/.test(x.claim)).map((x) => x.claim));

/** Router labels: the question each claim answers. */
export const ROUTES: Record<string, string> = {
  'Tidewater helps small coffee roasters sell direct to cafes.': 'golden_circle.what',
  'Tidewater takes no cut of the sale, unlike wholesale brokers.': 'golden_circle.how',
  'Roasters sell through brokers and spreadsheets today.': 'alternatives.instead',
  'Only Tidewater ships same-day roast batches to cafes across Victoria.': 'alternatives.edge',
  'Tidewater says "Fresh roast, fair price."': 'none',
  'Tidewater started because roasters lost a third of their margin to middlemen.': 'origin.why',
  'Before Tidewater, cafes waited two weeks for fresh beans.': 'origin.broken',
  'Harbour Lane, the first cafe customer, switched in its first month.': 'origin.first_win',
  'Tidewater was founded in 2019.': 'none',
  'Tidewater believes great coffee should reward the people who roast it.': 'golden_circle.why',
  'Tidewater is built for independent roasters with fewer than ten staff.': 'audience.who',
  'Tidewater was founded in 2020.': 'none',
};
