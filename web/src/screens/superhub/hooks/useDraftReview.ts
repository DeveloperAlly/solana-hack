import { useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useHubSession } from './useHubSession';
import type { DraftReviewData, DraftStatus, PolishAction } from '../types';
import { evaluateDraftChecks } from './draftChecks';

export const polishLabels: Record<PolishAction, string> = { review: 'Review', shorten: 'Shorten', clarify: 'Clarify', beautify: 'Beautify' };

/** Approval and registration are separate steps (web/worker/posts.ts: approved, then registering, then registered). */
export type Decision = 'approved' | 'registered' | 'rejected' | 'rewrite';

/**
 * Draft-Review flow state (n-dr, n-drb, n-dre): the editable text, version history with undo, polish actions and their
 * failure, accessible mode, the live checks (no-AI-slop pass, claims gate, character limit) that gate approval, the
 * publish route (no default: the person picks it), and the decision: approve, then register; or reject, or ask for a
 * rewrite. `busy` (the draft is still being written) disables approval.
 */
/** Where a decision moves the draft on the content dashboard; undefined keeps it in Needs approval. */
function movedTo(d: Decision | null, route: string): DraftStatus | undefined {
  if (d === 'rejected') return 'rejected';
  if (d !== 'approved' && d !== 'registered') return undefined;
  return route === 'schedule' ? 'scheduled' : 'posted';
}

export function useDraftReview(data: DraftReviewData, busy = false) {
  // The draft opened from the content dashboard (router state), else the fixture's.
  const draftId = (useLocation().state as { draftId?: string } | null)?.draftId ?? data.draftId;
  const [, update] = useHubSession();
  const [versions, setVersions] = useState(data.versions);
  // Version numbers only go up, so an undo followed by a new polish never reuses a version id.
  const lastVersion = useRef(data.versions.length);
  const [text, setTextState] = useState(data.versions.at(-1)?.text ?? '');
  const [failed, setFailed] = useState<PolishAction | undefined>(data.failedAction);
  const [accessible, setAccessible] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [publish, setPublish] = useState('');
  const [decision, setDecisionState] = useState<Decision | null>(null);
  // The decision moves the draft on the content dashboard (hub session): approved and registered → Scheduled, or
  // Posted when it was posted now or by hand; rejected → Rejected; a rewrite or Undo keeps it in Needs approval.
  function setDecision(d: Decision | null) {
    setDecisionState(d);
    const moved = movedTo(d, publish);
    update((s) => ({ ...s, drafts: moved ? { ...s.drafts, [draftId]: moved } : Object.fromEntries(Object.entries(s.drafts).filter(([k]) => k !== draftId)) }));
  }

  // Mirrors web/worker/posts.ts: a registered post cannot change (:107), and any edit, polish or undo of an approved
  // post resets it to drafted (:112, :233, :244), so it has to be approved again.
  const locked = decision === 'registered';
  function changeText(next: string) {
    if (locked) return;
    setTextState(next);
    if (decision === 'approved') setDecision(null);
  }

  const last = versions.at(-1);
  const beautified = last?.action === 'beautify' ? { before: versions.at(-2)?.text ?? '', after: last.text } : undefined;
  // One evaluation feeds both the badges and the Approve gate (draftChecks.ts).
  const checks = evaluateDraftChecks(text, data);
  const blockers = checks.filter((c) => c.blocking).map((c) => c.reason ?? c.label);
  const overLimit = text.length > data.charLimit;
  const canApprove = !busy && blockers.length === 0 && publish !== '';

  function polish(action: PolishAction) {
    if (locked) return;
    // INTEGRATION: POST /api/drafts/:id/polish {action, accessible} (backend map row "Draft-Review"); each makes a version.
    const mode = action === 'beautify' && accessible ? ' (accessible mode)' : '';
    const next = data.polishResults[action];
    lastVersion.current += 1;
    const id = `v${lastVersion.current}`;
    setVersions((v) => [...v, { id, label: `${id} · ${polishLabels[action]}${mode}`, text: next, action }]);
    changeText(next);
    setFailed(undefined);
  }

  function undo(id: string) {
    if (locked) return;
    // INTEGRATION: POST /api/drafts/:id/polish/undo. Undoing a version also drops every version made after it, so the
    // draft goes back to the version before the one undone and the history never keeps versions built on it.
    const at = versions.findIndex((v) => v.id === id);
    if (at <= 0) return;
    const rest = versions.slice(0, at);
    setVersions(rest);
    changeText(rest.at(-1)?.text ?? '');
  }

  return {
    text, setText: changeText, locked, versions, beautified, checks, blockers, overLimit, canApprove,
    failed, retry: () => failed && polish(failed), dismiss: () => setFailed(undefined), polish, undo,
    accessible, setAccessible, showOriginal, toggleOriginal: () => setShowOriginal((s) => !s),
    publish, setPublish, decision,
    // INTEGRATION: POST /api/drafts/:id/approve (backend map row "Draft-Review"); approval is not on-chain.
    approve: () => canApprove && setDecision('approved'),
    // INTEGRATION: registration (SAS attestation by the Registrar) runs only on an approved post, then it is published.
    // Register goes through the same blocking checks as Approve.
    register: () => decision === 'approved' && blockers.length === 0 && !busy && setDecision('registered'),
    reject: () => setDecision('rejected'),
    askRewrite: () => setDecision('rewrite'),
    reopen: () => setDecision(null),
  };
}

export type DraftReviewState = ReturnType<typeof useDraftReview>;
