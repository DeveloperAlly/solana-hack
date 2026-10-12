import { useEffect, useMemo } from 'react';
import { fingerprintOf, isStale, type Approval, type Gate } from '../../domain/approval';
import { postFingerprint } from '../../domain/post';
import { findPlatform, postLength, type Platform } from '../../config/platforms';
import { scheduleGate, versionCheck, type ClaimsResult } from './adaptChecks';
import { growthSession, nowIso, type AdaptEdits } from './session';
import type { AdaptData } from './types';

export type VersionApproval = 'approved' | 'stale' | 'none';

export interface AdaptVersion {
  platform: Platform;
  text: string;
  length: { used: number; max: number } | null;
  check: Gate;
  /** The claims gate's result for this text, or pending while it re-reads an edit. */
  claims: ClaimsResult;
  approval: VersionApproval;
  slot: string;
  /** What already holds this slot on this platform, or null. */
  conflict: string | null;
}

export interface AdaptFlow {
  original: string;
  originalApproval: VersionApproval;
  /** The brand's platforms for this post, in registry order. */
  platforms: Platform[];
  chosen: string[];
  setChosen: (ids: string[]) => void;
  versions: AdaptVersion[];
  /** Versions approved before the original changed. */
  staleCount: number;
  schedule: Gate;
  scheduled: boolean;
  editOriginal: (text: string) => void;
  approveOriginal: () => void;
  editVersion: (platformId: string, text: string) => void;
  approveVersion: (platformId: string) => void;
  setSlot: (platformId: string, slot: string) => void;
  /** Sends every chosen version to the calendar. INTEGRATION: POST /api/schedule (not built yet). */
  confirmSchedule: () => void;
}

const empty: AdaptEdits = { texts: {}, claims: {}, approvals: {}, when: {} };

/** How long the sample claims gate takes to re-read an edit, so "re-checking" is a real state on screen. */
export const CLAIMS_RECHECK_MS = 300;

/** The sample claims gate: the seed's unsourced phrases still present in the text. INTEGRATION: POST /api/claims/check. */
const runClaims = (phrases: string[], text: string) => phrases.filter((p) => text.includes(p)).length;

/**
 * Distribute-Adapt flow state (one hook): the original and each platform version, each with its own approval bound
 * to its text and the original's by fingerprint (domain/approval.ts). Editing the original makes every version
 * approval stale, and the original's own approval too; editing a version makes only that one stale.
 */
export function useAdapt(data: AdaptData): AdaptFlow {
  const [session, setSession] = growthSession.use();
  const edits = session.adapt[data.post.id] ?? empty;
  const patch = (p: Partial<AdaptEdits>) => setSession({ adapt: { ...session.adapt, [data.post.id]: { ...edits, ...p } } });

  const original = edits.original ?? data.post.text;
  const originalFp = postFingerprint({ ...data.post, text: original }, data.brainVersion);
  const originalApprovalRec = edits.originalApproval ?? data.post.lifecycle.approval;
  const originalApproval: VersionApproval = !originalApprovalRec ? 'none' : isStale(originalApprovalRec, originalFp) ? 'stale' : 'approved';
  const chosen = edits.chosen ?? data.chosen;

  const platforms = useMemo(() => data.platformIds.map((id) => findPlatform(id)).filter((p): p is Platform => Boolean(p)), [data.platformIds]);

  const all = platforms.map((platform): AdaptVersion => {
    const seed = data.versions[platform.id] ?? { text: '', unsourcedClaims: [] };
    const text = edits.texts[platform.id] ?? seed.text;
    // The seed text was checked when it was drafted; any other text waits for the claims gate to re-read it.
    const last = edits.claims[platform.id];
    const claims: ClaimsResult = text === seed.text ? runClaims(seed.unsourcedClaims, text) : last?.text === text ? last.unsourced : 'pending';
    const approval: Approval | undefined = edits.approvals[platform.id] ?? data.approvals[platform.id];
    const fresh = approval ? !isStale(approval, fingerprintOf(original, text)) : false;
    const slot = edits.when[platform.id] ?? data.slots[0];
    const taken = data.taken.find((t) => t.platformId === platform.id && t.slot === slot);
    return {
      platform,
      text,
      length: platform.limit ? { used: postLength(platform, text), max: platform.limit.max } : null,
      check: versionCheck(platform, text, claims),
      claims,
      approval: !approval ? 'none' : fresh ? 'approved' : 'stale',
      slot,
      conflict: taken ? taken.what : null,
    };
  });
  const versions = all.filter((v) => chosen.includes(v.platform.id));
  const schedule = scheduleGate(originalApproval === 'approved', versions.map((v) => ({ name: v.platform.name, check: v.check, approved: v.approval === 'approved', conflict: v.conflict, slot: v.slot })));
  // Re-run the claims gate on every edited text still pending, and store its result with the text it read.
  const pending = all.filter((v) => v.claims === 'pending').map((v) => [v.platform.id, v.text] as const);
  const pendingKey = JSON.stringify(pending);
  useEffect(() => {
    if (pending.length === 0) return undefined;
    const t = setTimeout(() => {
      const current = growthSession.read().adapt[data.post.id] ?? empty;
      const claims = { ...current.claims };
      for (const [id, text] of pending) claims[id] = { text, unsourced: runClaims(data.versions[id]?.unsourcedClaims ?? [], text) };
      growthSession.set({ adapt: { ...growthSession.read().adapt, [data.post.id]: { ...current, claims } } });
    }, CLAIMS_RECHECK_MS);
    return () => clearTimeout(t);
    // pendingKey stands for `pending` (texts per platform), so the timer restarts only when they change.
  }, [pendingKey, data.post.id, data.versions]);
  const stamp = (fp: string): Approval => ({ by: data.approver, at: nowIso(), fingerprint: fp });

  return {
    original,
    originalApproval,
    platforms,
    chosen,
    setChosen: (ids) => patch({ chosen: ids, scheduled: undefined }),
    versions,
    staleCount: versions.filter((v) => v.approval === 'stale').length,
    schedule,
    scheduled: Boolean(edits.scheduled),
    // INTEGRATION: PATCH /api/posts/:id (web/worker/posts.ts resets an approved post to drafted on any edit).
    editOriginal: (text) => patch({ original: text, scheduled: undefined }),
    // INTEGRATION: POST /api/posts/:id/approve (web/worker/posts.ts).
    approveOriginal: () => patch({ originalApproval: stamp(originalFp) }),
    // INTEGRATION: PUT /api/posts/:id/versions/:platform (not built yet).
    editVersion: (id, text) => patch({ texts: { ...edits.texts, [id]: text }, scheduled: undefined }),
    // INTEGRATION: POST /api/posts/:id/versions/:platform/approve (not built yet).
    approveVersion: (id) => {
      const v = all.find((x) => x.platform.id === id);
      if (!v || v.check.blocking) return;
      patch({ approvals: { ...edits.approvals, [id]: stamp(fingerprintOf(original, v.text)) } });
    },
    setSlot: (id, slot) => patch({ when: { ...edits.when, [id]: slot }, scheduled: undefined }),
    confirmSchedule: () => {
      if (schedule.blocking) return;
      patch({ scheduled: Object.fromEntries(versions.map((v) => [v.platform.id, v.slot])) });
    },
  };
}
