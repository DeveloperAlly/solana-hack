import { useState } from 'react';
import type { DraftCheck, DraftReviewData, PolishAction } from '../types';

export const polishLabels: Record<PolishAction, string> = { review: 'Review', shorten: 'Shorten', clarify: 'Clarify', beautify: 'Beautify' };

export type Decision = 'approved' | 'rejected' | 'rewrite';

/** Numbers and multipliers in the text, ignoring [bracketed] placeholders (the claims gate checks each one). */
export function numbersIn(text: string): string[] {
  return text.replace(/\[[^\]]*\]/g, ' ').match(/\d+(?:[.,]\d+)?\s?(?:%|x\b)?/gi)?.map((n) => n.trim()) ?? [];
}

/**
 * Draft-Review flow state (n-dr, n-drb, n-dre): the editable text, version history with undo, polish actions and their
 * failure, accessible mode, the live checks (no-AI-slop pass, claims gate, character limit) that gate approval, the
 * publish route, and the decision (approve, reject, ask for a rewrite).
 */
export function useDraftReview(data: DraftReviewData) {
  const [versions, setVersions] = useState(data.versions);
  const [text, setText] = useState(data.versions.at(-1)?.text ?? '');
  const [failed, setFailed] = useState<PolishAction | undefined>(data.failedAction);
  const [accessible, setAccessible] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [publish, setPublish] = useState(data.publishOptions[0]?.value ?? '');
  const [decision, setDecision] = useState<Decision | null>(null);

  const last = versions.at(-1);
  const beautified = last?.action === 'beautify' ? { before: versions.at(-2)?.text ?? '', after: last.text } : undefined;
  const slopHits = data.slopPhrases.filter((p) => text.toLowerCase().includes(p));
  const unapproved = numbersIn(text).filter((n) => !data.approvedNumbers.includes(n));
  const overLimit = text.length > data.charLimit;

  // Order as drawn: slop, voice fit, platform score, claims gate, vocabulary (n-dr 3).
  const checks: (DraftCheck & { ok: boolean })[] = [
    { label: 'No-AI-slop check', ok: slopHits.length === 0, result: slopHits.length ? `Fails · remove "${slopHits.join('", "')}"` : `Passed after ${data.slopFixes.length} fixes` },
    ...data.scores.map((s) => ({ ...s, ok: true })),
    { label: 'Claims gate', ok: unapproved.length === 0, result: unapproved.length ? `Blocked · unapproved: ${unapproved.join(', ')}` : 'Pass · 0 unapproved claims' },
    { label: 'Vocabulary', ok: true, result: data.vocabulary },
  ];

  const blockers = [
    overLimit && `Over the ${data.charLimit}-character limit`,
    slopHits.length > 0 && 'The no-AI-slop check failed',
    unapproved.length > 0 && 'A number is not an approved claim',
  ].filter(Boolean) as string[];

  function polish(action: PolishAction) {
    // INTEGRATION: POST /api/drafts/:id/polish {action, accessible} (backend map row "Draft-Review"); each makes a version.
    const n = versions.length + 1;
    const mode = action === 'beautify' && accessible ? ' (accessible mode)' : '';
    const next = data.polishResults[action];
    setVersions((v) => [...v, { id: `v${n}`, label: `v${n} · ${polishLabels[action]}${mode}`, text: next, action }]);
    setText(next);
    setFailed(undefined);
  }

  function undo(id: string) {
    // INTEGRATION: POST /api/drafts/:id/polish/undo.
    const rest = versions.filter((v) => v.id !== id);
    setVersions(rest);
    setText(rest.at(-1)?.text ?? '');
  }

  return {
    text, setText, versions, beautified, checks, blockers, overLimit,
    failed, retry: () => failed && polish(failed), dismiss: () => setFailed(undefined), polish, undo,
    accessible, setAccessible, showOriginal, toggleOriginal: () => setShowOriginal((s) => !s),
    publish, setPublish, decision,
    // INTEGRATION: POST /api/drafts/:id/approve registers the hash, kit version and approver, then publishes.
    approve: () => blockers.length === 0 && setDecision('approved'),
    reject: () => setDecision('rejected'),
    askRewrite: () => setDecision('rewrite'),
    reopen: () => setDecision(null),
  };
}

export type DraftReviewState = ReturnType<typeof useDraftReview>;
