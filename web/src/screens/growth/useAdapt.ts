import { useEffect, useMemo } from 'react';
import { approveThrough, isCurrent, type Approval, type Approver, type Gate } from '../../lib/approval';
import { postInputs } from '../../domain/post';
import { findPlatform, postLength, type Platform } from '../../config/platforms';
import { useBrainVersion } from '../../flows/loop/brainVersion';
import { originalCheck, runChecks, scheduleGate, versionCheck, type CheckResult } from './adaptChecks';
import { growthSession, nowIso, type AdaptEdits } from './session';
import type { AdaptData } from './types';

export type VersionApproval = 'approved' | 'stale' | 'none';

export interface AdaptVersion {
  platform: Platform;
  text: string;
  length: { used: number; max: number } | null;
  check: Gate;
  approval: VersionApproval;
  slot: string;
  /** What already holds this slot on this platform, or null. */
  conflict: string | null;
}

export interface AdaptFlow {
  original: string;
  /** The original's own gate: its checks, pending while they re-run after an edit. */
  originalGate: Gate;
  originalApproval: VersionApproval;
  /** The brand's platforms for this post, in registry order. */
  platforms: Platform[];
  chosen: string[];
  setChosen: (ids: string[]) => void;
  versions: AdaptVersion[];
  /** Versions whose approval no longer matches their text, the original or the Brain version. */
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

const empty: AdaptEdits = { texts: {}, checks: {}, approvals: {}, when: {} };
const ORIGINAL = 'original';

/** How long the sample checks take to re-read an edit, so "re-checking" is a real state on screen. */
export const CHECKS_RERUN_MS = 300;

const approvalOf = (a: Approval<Approver> | undefined, inputs: unknown): VersionApproval => {
  if (!a) return 'none';
  return isCurrent(a, inputs) ? 'approved' : 'stale';
};

/**
 * Distribute-Adapt flow state (one hook): the original and each platform version, each with its own approval bound
 * to its text, the original's and the current Brain version (lib/approval.ts). Every approval is made only through
 * its gate (approveThrough), and an edited text is pending until its checks re-run, so an edit is never approved
 * unchecked (Codex review on PR 102). Editing the original makes every version approval stale, and its own too.
 */
export function useAdapt(data: AdaptData): AdaptFlow {
  const [session, setSession] = growthSession.use();
  const edits = session.adapt[data.post.id] ?? empty;
  const patch = (p: Partial<AdaptEdits>) => setSession({ adapt: { ...session.adapt, [data.post.id]: { ...edits, ...p } } });
  // Every approval here is bound to the current Brain version: a rule change makes them stale.
  const brainVersion = useBrainVersion();

  // The seed texts were checked when drafted; any other text waits for the checks to re-run on exactly that text.
  const checksFor = (key: string, text: string, seedText: string, claims: string[]): CheckResult => {
    if (text === seedText) return runChecks(text, claims, data.slopPhrases);
    const last = edits.checks[key];
    return last?.text === text ? last : 'pending';
  };

  const original = edits.original ?? data.post.text;
  const originalChecks = checksFor(ORIGINAL, original, data.post.text, data.originalUnsourcedClaims);
  const originalGate = originalCheck(original, originalChecks);
  const originalInputs = postInputs({ ...data.post, text: original }, brainVersion);
  const originalApproval = approvalOf(edits.originalApproval ?? data.post.lifecycle.approval, originalInputs);
  const chosen = edits.chosen ?? data.chosen;
  const platforms = useMemo(() => data.platformIds.map((id) => findPlatform(id)).filter((p): p is Platform => Boolean(p)), [data.platformIds]);

  const all = platforms.map((platform) => {
    const seed = data.versions[platform.id] ?? { text: '', unsourcedClaims: [] };
    const text = edits.texts[platform.id] ?? seed.text;
    const checks = checksFor(platform.id, text, seed.text, seed.unsourcedClaims);
    const slot = edits.when[platform.id] ?? data.slots[0];
    const taken = data.taken.find((t) => t.platformId === platform.id && t.slot === slot);
    const inputs = [original, text, brainVersion];
    return {
      platform,
      text,
      inputs,
      checks,
      length: platform.charLimit ? { used: postLength(platform, text), max: platform.charLimit.value } : null,
      check: versionCheck(platform, text, checks, originalGate),
      approval: approvalOf(edits.approvals[platform.id] ?? data.approvals[platform.id], inputs),
      slot,
      conflict: taken ? taken.what : null,
    };
  });
  const versions = all.filter((v) => chosen.includes(v.platform.id));
  const schedule = scheduleGate(originalGate, originalApproval === 'approved', versions.map((v) => ({ name: v.platform.name, check: v.check, approved: v.approval === 'approved', conflict: v.conflict, slot: v.slot })));

  // Re-run the checks on every edited text still pending, and store each result with the text it read.
  const pending = [
    ...(originalChecks === 'pending' ? [[ORIGINAL, original, data.originalUnsourcedClaims] as const] : []),
    ...all.filter((v) => v.checks === 'pending').map((v) => [v.platform.id, v.text, data.versions[v.platform.id]?.unsourcedClaims ?? []] as const),
  ];
  const pendingKey = JSON.stringify(pending.map(([k, t]) => [k, t]));
  useEffect(() => {
    if (pending.length === 0) return undefined;
    const t = setTimeout(() => {
      const current = growthSession.read().adapt[data.post.id] ?? empty;
      const checks = { ...current.checks };
      for (const [key, text, claims] of pending) checks[key] = { text, ...runChecks(text, claims, data.slopPhrases) };
      growthSession.set({ adapt: { ...growthSession.read().adapt, [data.post.id]: { ...current, checks } } });
    }, CHECKS_RERUN_MS);
    return () => clearTimeout(t);
    // pendingKey stands for `pending` (the texts per key), so the timer restarts only when they change.
  }, [pendingKey, data.post.id, data.slopPhrases]);

  const by = (): Approver => ({ by: data.approver, at: nowIso() });

  return {
    original,
    originalGate,
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
    // INTEGRATION: POST /api/posts/:id/approve (web/worker/posts.ts). Refused while the original's gate blocks.
    approveOriginal: () => {
      const a = approveThrough(originalGate, originalInputs, by());
      if (a) patch({ originalApproval: a });
    },
    // INTEGRATION: PUT /api/posts/:id/versions/:platform (not built yet).
    editVersion: (id, text) => patch({ texts: { ...edits.texts, [id]: text }, scheduled: undefined }),
    // INTEGRATION: POST /api/posts/:id/versions/:platform/approve (not built yet). Refused while its gate blocks.
    approveVersion: (id) => {
      const v = all.find((x) => x.platform.id === id);
      const a = v && approveThrough(v.check, v.inputs, by());
      if (a) patch({ approvals: { ...edits.approvals, [id]: a } });
    },
    setSlot: (id, slot) => patch({ when: { ...edits.when, [id]: slot }, scheduled: undefined }),
    confirmSchedule: () => {
      if (schedule.blocking) return;
      patch({ scheduled: Object.fromEntries(versions.map((v) => [v.platform.id, v.slot])) });
    },
  };
}
