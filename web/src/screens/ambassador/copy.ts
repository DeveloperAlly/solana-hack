// Text the Ambassador screens build from the flow's choices (campaign, piece, route), so no screen shows a fixture
// string where the user chose something else. Wording follows the canvas boards Amb-3 to Amb-5d
// (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #53).
import type { AmbTimelineStep } from '../../ui/domain/AmbStatusTimeline';
import type { DraftReview, PieceFormat, PostOutcome, PostStatusData } from './types';

/** "LinkedIn post · 10 USDC", with "(done)" for a piece already written (canvas Amb-3 format select). */
export const pieceLabel = (p: PieceFormat) => `${p.name} · ${p.payout}${p.done ? ' (done)' : ''}`;

/** Publish chips (canvas Amb-4: "On-brand 91% ✓", "No flags", "Disclosure added"). */
export function reviewChips(r: DraftReview): string[] {
  const flags = r.openFlags === 0 ? 'No flags' : `${r.openFlags} ${r.openFlags === 1 ? 'flag' : 'flags'} open`;
  return [`On-brand ${r.score}% ✓`, flags, r.disclosed ? 'Disclosure added' : 'No disclosure'];
}

/** The collapsed post preview (canvas Amb-4: first line … last line). */
export function postPreview(draft: string): string {
  const lines = draft.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 2) return lines.join(' ');
  return `${lines[0]} …  ${lines[lines.length - 1]}`;
}

const statusTitles: Record<PostOutcome, (d: PostStatusData) => string> = {
  verifying: () => 'Checking your post',
  paid: (d) => `Paid ${d.piece.payout}`,
  failed: () => "We couldn't verify your post",
  budget: () => 'This campaign ran out of budget',
};
export const statusTitle = (d: PostStatusData) => statusTitles[d.outcome](d);

/** "aDNA launch week · LinkedIn post · 10 USDC"; the paid board leaves out the amount, which is its title. */
export const statusContext = (d: PostStatusData) =>
  [d.campaign.title, d.piece.name, d.outcome === 'paid' ? undefined : d.piece.payout].filter(Boolean).join(' · ');

/** First step: "Published" when JamJam posted it, "Submitted · URL pasted" when the ambassador sent a link. */
function firstStep(d: PostStatusData): AmbTimelineStep {
  if (d.route === 'on-behalf') return { label: 'Published', state: 'done', note: d.times.published };
  return { label: 'Submitted', state: 'done', note: [d.times.published, 'URL pasted'].filter(Boolean).join(' · ') };
}

const verifiedHow = (d: PostStatusData) => (d.route === 'on-behalf' ? 'posted from your account' : 'matches your draft');
const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' · ');

const stepBuilders: Record<PostOutcome, (d: PostStatusData) => AmbTimelineStep[]> = {
  verifying: (d) => [
    firstStep(d),
    { label: 'Verifying…', state: 'current', note: 'Usually under a minute' },
    { label: 'Approved', state: 'todo', note: `${d.campaign.brand} reviews within 48 h` },
    { label: 'Paid', state: 'todo', note: d.piece.payout },
  ],
  paid: (d) => [
    firstStep(d),
    { label: 'Verified', state: 'done', note: join(d.times.verified, verifiedHow(d)) },
    { label: 'Approved', state: 'done', note: join(d.times.approved, `by ${d.campaign.brand}`) },
    { label: 'Paid', state: 'done', note: d.times.paid },
  ],
  failed: (d) => [
    firstStep(d),
    { label: 'Not verified', state: 'failed', note: d.times.failed },
    { label: 'Approved', state: 'todo' },
    { label: 'Paid', state: 'todo' },
  ],
  budget: (d) => [
    firstStep(d),
    { label: 'Verified', state: 'done', note: d.verifiedNote },
    { label: 'Not paid', state: 'failed', note: 'Budget reached' },
    { label: 'Paid', state: 'todo' },
  ],
};
export const statusSteps = (d: PostStatusData) => stepBuilders[d.outcome](d);

/** Amb-5d headline and body, for the brand and piece of this submission. */
export const budgetTitle = (d: PostStatusData, cap: string) => `${d.campaign.brand}'s ${cap} cap was used up before your ${d.piece.name.toLowerCase()} was approved`;
export const budgetBody = (d: PostStatusData) =>
  `Your ${d.piece.name.toLowerCase()} is still verified and shows as brand-approved on the public check. It just can't be paid from this campaign.`;

/** Receipt sheet rows: amount, time and receipt link (canvas note n-a5b). */
export const receiptRows = (d: PostStatusData) => [
  { label: 'Amount', value: d.piece.payout },
  { label: 'Time', value: d.times.paid ?? '' },
  { label: 'Receipt', value: d.paid?.receiptLink ?? '' },
];
