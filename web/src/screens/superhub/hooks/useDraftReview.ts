import { useRef, useState } from 'react';
import { useHubSession } from './useHubSession';
import type { DraftContent, DraftReviewData, PolishAction } from '../types';
import { draftLength, evaluateDraftChecks } from './draftChecks';
import { decisionInputs, draftStatusOf, isPostUrl, type Decision, type DraftRecord } from './draftStatus';
import { approve, isCurrent, isStale, type Approval } from '../../../lib/approval';
import { publishRoutesFor } from './publishRoutes';
import { useActiveBrand } from '../../../flows/brand/activeBrand';
import { useBrandCatalog } from '../../../flows/brand/brandCatalog';
import { registerPost } from '../../../flows/registry/registeredPosts';
import { OWNER } from '../../../domain/fixtures/brain';
import { nowIso } from '../../../lib/time';

export const polishLabels: Record<PolishAction, string> = { review: 'Review', shorten: 'Shorten', clarify: 'Clarify', beautify: 'Beautify' };

export type { Decision } from './draftStatus';

/**
 * Draft-Review flow state (n-dr, n-drb, n-dre): the editable text, version history with undo, polish actions and their
 * failure, accessible mode, the live checks (no-AI-slop pass, claims gate, character limit) that gate approval, the
 * publish route (no default: the person picks it), and the decision: approve, then register; or reject, or ask for a
 * rewrite. `busy` (the draft is still being written) disables approval.
 */
export function useDraftReview(data: DraftReviewData, draftId: string, draft: DraftContent, busy = false) {
  const [session, update] = useHubSession();
  // Where this draft can go comes from its channel (config/platforms.ts), never one list for every draft.
  const brand = useActiveBrand();
  const catalogBrand = useBrandCatalog().brands.find((b) => b.id === brand.id);
  const routes = publishRoutesFor(draft.channel, brand.name);
  // A decision already taken on this draft (hub session) is where a reopened draft starts.
  const [recorded] = useState<DraftRecord | undefined>(session.drafts[draftId]);
  const [versions, setVersions] = useState(draft.versions);
  // Version numbers only go up, so an undo followed by a new polish never reuses a version id.
  const lastVersion = useRef(draft.versions.length);
  const [text, setTextState] = useState(recorded?.text ?? draft.versions.at(-1)?.text ?? '');
  const [failed, setFailed] = useState<PolishAction | undefined>(data.failedAction);
  const [accessible, setAccessible] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [publish, setPublish] = useState(recorded?.route ?? '');
  const [approval, setApproval] = useState<Approval<Decision> | null>(recorded?.approval ?? null);
  // A decision counts only on the text and route it was made on (lib/approval), so a stale one never shows.
  const decision = approval && isCurrent(approval, decisionInputs(text, publish)) ? approval.decision : null;
  const [postedUrl, setPostedUrl] = useState<string | undefined>(recorded?.postedUrl);
  const [urlError, setUrlError] = useState<string | null>(null);
  // Every decision is recorded in the hub session; the dashboard buckets it with draftStatusOf, like the badge here.
  // No decision (a rewrite request undone, or an approval reset by an edit) removes the record: back to Needs approval.
  function writeStatus(a: Approval<Decision> | null, url?: string) {
    update((s) => {
      const { [draftId]: _old, ...rest } = s.drafts;
      return { ...s, drafts: a ? { ...rest, [draftId]: { approval: a, route: publish, text, postedUrl: url } } : rest };
    });
  }
  function setDecision(d: Decision | null) {
    const next = d ? approve(decisionInputs(text, publish), d) : null;
    setApproval(next);
    setPostedUrl(undefined);
    writeStatus(next);
  }
  // Manual route: the post is Posted only once its URL is pasted back (INTEGRATION: PATCH /api/drafts/:id platform_url).
  function pasteUrl(url: string) {
    if (!isPostUrl(url)) return setUrlError('Paste the full https link to the post.');
    setUrlError(null);
    setPostedUrl(url.trim());
    if (decision) writeStatus(approval, url.trim());
  }

  // Mirrors web/worker/posts.ts: a registered post cannot change (:107), and any edit, polish or undo of an approved
  // post resets it to drafted (:112, :233, :244), so it has to be approved again.
  const locked = decision === 'registered';
  function changeText(next: string) {
    if (locked) return;
    setTextState(next);
    // Any edit, polish or undo makes a decision on the old text stale: it is dropped, and the draft is decided again.
    if (approval && isStale(approval, decisionInputs(next, publish))) {
      setApproval(null);
      setPostedUrl(undefined);
      writeStatus(null);
    }
  }

  const last = versions.at(-1);
  const beautified = last?.action === 'beautify' ? { before: versions.at(-2)?.text ?? '', after: last.text } : undefined;
  // One evaluation feeds both the badges and the Approve gate (draftChecks.ts).
  const checks = evaluateDraftChecks(text, data, draft);
  const blockers = checks.filter((c) => c.blocking).map((c) => c.reason ?? c.label);
  const length = draftLength(text, draft.channel);
  const overLimit = length.limit !== null && length.size > length.limit;
  const routeOk = routes.some((r) => r.value === publish);
  const canApprove = !busy && blockers.length === 0 && routeOk;

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
    draft, length, text, setText: changeText, locked, versions, beautified, checks, blockers, overLimit, canApprove,
    failed, retry: () => failed && polish(failed), dismiss: () => setFailed(undefined), polish, undo,
    accessible, setAccessible, showOriginal, toggleOriginal: () => setShowOriginal((s) => !s),
    routes, routeLabel: routes.find((r) => r.value === publish)?.label ?? '', publish, setPublish, decision, status: draftStatusOf(decision, publish, postedUrl), postedUrl, urlError, pasteUrl,
    // INTEGRATION: POST /api/drafts/:id/approve (backend map row "Draft-Review"); approval is not on-chain.
    approve: () => canApprove && setDecision('approved'),
    // INTEGRATION: registration (SAS attestation by the Registrar) runs only on an approved post, then it is published.
    // Register goes through the same blocking checks as Approve.
    register: () => {
      if (decision !== 'approved' || blockers.length > 0 || busy) return;
      setDecision('registered');
      // The registration is public (flows/registry): Verify finds it by its text, and this brand's Verify-Home lists it.
      registerPost({
        id: `${brand.id}:${draftId}`,
        brand: { id: brand.id, name: brand.name, domain: catalogBrand?.domain ?? '[domain]', domainVerified: Boolean(catalogBrand?.verified) },
        text,
        kitVersion: 1,
        approver: OWNER,
        approvedAt: nowIso(),
        published: null,
        label: draft.title,
        signature: null,
        bannedPhrases: [],
        retraction: null,
      });
    },
    reject: () => setDecision('rejected'),
    askRewrite: () => setDecision('rewrite'),
    reopen: () => setDecision(null),
  };
}

export type DraftReviewState = ReturnType<typeof useDraftReview>;
