// Sample data for Draft-Review, Draft-Review-Beautified and Draft-Review-PolishError (issue #52). Source: wireframe
// canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Draft-Review, Draft-Review-Beautified and
// Draft-Review-PolishError, notes n-dr, n-drb, n-dre (text as drawn; brackets kept; scores are [placeholders],
// self-graded today, posts.ts L81 per n-dr 3). Backend map row "Draft-Review" (.agentic/what/context/backend_map.md §4).
// slopPhrases and avoidTerms are short samples of what the no-AI-slop pass and the kit's vocabulary block, so the live
// checks can be tried here; the real lists come from the slop rules and the kit (Brand-Build section 11).
import type { DraftContent, DraftReviewData } from './types';
import { contentDashboard } from './ContentDashboard.fixtures';

const draft = '[Draft post in the core voice, about 220 characters, written from the brief and the approved messaging]';

/** The two drawn versions of a draft: the first draft and the slop check's automatic fixes. */
const drawnVersions = (text: string) => [
  { id: 'v1', label: 'v1 · first draft', text: '[First draft, before the slop check]' },
  { id: 'v2', label: 'v2 · slop check fixes (automatic)', text, action: 'slop' as const },
];

/** Bracketed placeholder fixes, as many as the content dashboard says the slop check made. */
const fixes = (slop: string) => Array.from({ length: Number(/(\d+) fix/.exec(slop)?.[1] ?? 0) }, (_, i) => ({ removed: `[slop phrase ${i + 1}]` }));

/** d1 is the drawn Draft-Review board; the others take their text from the content dashboard rows. */
const drafts: Record<string, DraftContent> = Object.fromEntries(
  contentDashboard.drafts.map((d) => [
    d.id,
    d.id === 'd1'
      ? { title: 'X post · Core voice', context: 'aDNA · first post after kit v[n] · drafted from your brief', channel: 'X', versions: drawnVersions(draft), slopFixes: [{ removed: '[generic opener]' }, { removed: '[hype adjective]', added: '[plain word]' }] }
      : { title: `${d.format} · ${d.meta.split(' · ')[0]}`, context: d.meta, channel: d.channel, versions: drawnVersions(d.title), slopFixes: fixes(d.slop) },
  ]),
);

export const draftReview: DraftReviewData = {
  draftId: 'd1',
  drafts,
  slopPhrases: ['game-changer', 'revolutionary', 'unlock the power', 'delve'],
  approvedNumbers: [],
  polishResults: {
    review: draft,
    shorten: '[Shorter version of the draft, same message]',
    clarify: '[Clearer version of the draft, same message]',
    beautify: '[Hook line]\n• [Point one]\n• [Point two]\n• [Point three]\n[One clear ask] [link]',
  },
  beautifyNotes: [
    'Added a hook line and spacing between blocks.',
    'Turned a list into bullets.',
    'No Unicode bold: accessible mode is on, so screen readers read every word normally.',
  ],
  scores: [
    { label: 'Voice fit · Core voice', result: '[score] / 100 · self-graded today' },
    { label: 'Platform score · X', result: '[score] / 100 · self-graded today' },
  ],
  avoidTerms: ['seamless', 'revolutionize'],
  scoresNote: 'Scores are sample data until the scorers are calibrated.',
  publishOptions: [
    { value: 'now', label: 'Post to @[aDNA X handle] now' },
    { value: 'schedule', label: 'Schedule: [suggested slot]' },
    { value: 'manual', label: 'Copy, post it yourself, paste the URL back' },
  ],
  approvalNote: "After you approve, registering puts the post's hash, the kit version and your name on Solana, so anyone can check it.",
};

/** Draft-Review-Beautified (n-drb): v3 Beautify (accessible mode) on top of v2 slop fixes. */
export const draftBeautified: DraftReviewData = {
  ...draftReview,
  drafts: {
    ...drafts,
    d1: { ...drafts.d1, versions: [...drafts.d1.versions, { id: 'v3', label: 'v3 · Beautify (accessible mode)', text: draftReview.polishResults.beautify, action: 'beautify' }] },
  },
};

/** Draft-Review-PolishError (n-dre): Shorten failed; the draft is unchanged. */
export const draftPolishError: DraftReviewData = {
  ...draftReview,
  failedAction: 'shorten',
  failureReason: "The model didn't respond in time. Your draft is unchanged.",
};
