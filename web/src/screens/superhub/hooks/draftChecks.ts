import type { DraftReviewData } from '../types';

/** One row of the Checks panel. `blocking` is the only thing the Approve button reads. */
export interface DraftCheckResult {
  label: string;
  value: string;
  blocking: boolean;
  /** Why it blocks, in words, for the line under Approve. */
  reason?: string;
}

/** Numbers and multipliers in the text, ignoring [bracketed] placeholders (the claims gate checks each one). */
export function numbersIn(text: string): string[] {
  return text.replace(/\[[^\]]*\]/g, ' ').match(/\d+(?:[.,]\d+)?\s?(?:%|x\b)?/gi)?.map((n) => n.trim()) ?? [];
}

const found = (text: string, phrases: string[]) => phrases.filter((p) => text.toLowerCase().includes(p.toLowerCase()));

/**
 * The single mapping from a draft to its checks (n-dr 3): the no-AI-slop pass, the scores (placeholders, never
 * blocking), the claims gate, vocabulary (terms to avoid) and the channel's character limit. Badges render from these
 * rows and Approve is disabled when any row is blocking, so a badge and the button can never disagree.
 */
export function evaluateDraftChecks(text: string, data: DraftReviewData): DraftCheckResult[] {
  const slop = found(text, data.slopPhrases);
  const unapproved = numbersIn(text).filter((n) => !data.approvedNumbers.includes(n));
  const avoided = found(text, data.avoidTerms);
  return [
    slop.length
      ? { label: 'No-AI-slop check', value: `Fails · remove "${slop.join('", "')}"`, blocking: true, reason: 'the no-AI-slop check failed' }
      : { label: 'No-AI-slop check', value: `Passed after ${data.slopFixes.length} fixes`, blocking: false },
    ...data.scores.map((s) => ({ label: s.label, value: s.result, blocking: false })),
    unapproved.length
      ? { label: 'Claims gate', value: `Blocked · unapproved: ${unapproved.join(', ')}`, blocking: true, reason: 'a number is not an approved claim' }
      : { label: 'Claims gate', value: 'Pass · 0 unapproved claims', blocking: false },
    avoided.length
      ? { label: 'Vocabulary', value: `Blocked · avoid "${avoided.join('", "')}"`, blocking: true, reason: 'it uses a term the kit says to avoid' }
      : { label: 'Vocabulary', value: 'Pass', blocking: false },
    lengthCheck(text, data.charLimit),
  ];
}

/** The channel's character limit; an empty post blocks too. */
function lengthCheck(text: string, limit: number): DraftCheckResult {
  if (!text.trim()) return { label: 'Length', value: 'Empty', blocking: true, reason: 'the post is empty' };
  if (text.length > limit) return { label: 'Length', value: `${text.length} / ${limit} · over the limit`, blocking: true, reason: `it is over the ${limit}-character limit` };
  return { label: 'Length', value: `${text.length} / ${limit}`, blocking: false };
}
