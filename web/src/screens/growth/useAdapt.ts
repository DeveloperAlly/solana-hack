import { useMemo } from 'react';
import { fingerprintOf, isStale, type Approval, type Gate } from '../../domain/approval';
import { postFingerprint } from '../../domain/post';
import { findPlatform, postLength, type Platform } from '../../config/platforms';
import { scheduleGate, versionCheck } from './adaptChecks';
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

const empty: AdaptEdits = { texts: {}, approvals: {}, when: {} };

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
    const seed = data.versions[platform.id] ?? { text: '', unsupportedClaims: 0 };
    const text = edits.texts[platform.id] ?? seed.text;
    // An edit clears the version's own sample claim flag only when the person rewrote it; the gate re-reads the text.
    const claims = edits.texts[platform.id] !== undefined && edits.texts[platform.id] !== seed.text ? 0 : seed.unsupportedClaims;
    const approval: Approval | undefined = edits.approvals[platform.id] ?? data.approvals[platform.id];
    const fresh = approval ? !isStale(approval, fingerprintOf(original, text)) : false;
    const slot = edits.when[platform.id] ?? data.slots[0];
    const taken = data.taken.find((t) => t.platformId === platform.id && t.slot === slot);
    return {
      platform,
      text,
      length: platform.limit ? { used: postLength(platform, text), max: platform.limit.max } : null,
      check: versionCheck(platform, text, claims),
      approval: !approval ? 'none' : fresh ? 'approved' : 'stale',
      slot,
      conflict: taken ? taken.what : null,
    };
  });
  const versions = all.filter((v) => chosen.includes(v.platform.id));
  const schedule = scheduleGate(originalApproval === 'approved', versions.map((v) => ({ name: v.platform.name, check: v.check, approved: v.approval === 'approved', conflict: v.conflict, slot: v.slot })));
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
