// Sample data for Draft-Review, Draft-Review-Beautified and Draft-Review-PolishError (issue #52). Source: wireframe
// canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Draft-Review, Draft-Review-Beautified and
// Draft-Review-PolishError, notes n-dr, n-drb, n-dre (text as drawn; brackets kept; scores are [placeholders],
// self-graded today, posts.ts L81 per n-dr 3). Backend map row "Draft-Review" (.agentic/what/context/backend_map.md §4).
// slopPhrases is a short sample of the kind of phrase the no-AI-slop pass removes, so the live check can be tried here.
import type { DraftReviewData } from './types';

const draft = '[Draft post in the core voice, about 220 characters, written from the brief and the approved messaging]';

export const draftReview: DraftReviewData = {
  title: 'X post · Core voice',
  context: 'aDNA · first post after kit v[n] · drafted from your brief',
  charLimit: 280,
  versions: [
    { id: 'v1', label: 'v1 · first draft', text: '[First draft, before the slop check]' },
    { id: 'v2', label: 'v2 · slop check fixes (automatic)', text: draft, action: 'slop' },
  ],
  slopFixes: [{ removed: '[generic opener]' }, { removed: '[hype adjective]', added: '[plain word]' }],
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
  vocabulary: 'Pass',
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
  versions: [...draftReview.versions, { id: 'v3', label: 'v3 · Beautify (accessible mode)', text: draftReview.polishResults.beautify, action: 'beautify' }],
};

/** Draft-Review-PolishError (n-dre): Shorten failed; the draft is unchanged. */
export const draftPolishError: DraftReviewData = {
  ...draftReview,
  failedAction: 'shorten',
  failureReason: "The model didn't respond in time. Your draft is unchanged.",
};
