// Ordinary drafts for the Growth loop screens, in the shared Post type (domain/post.ts): event plan items and the
// post Distribute-Adapt adapts are the same drafts Create shows, never a second draft system (issue #90, row "Events").
// Provenance values are placeholders (README "Fixtures"): the kit and Brain versions follow the loop fixtures.
import { postInputs, approvalState, type Post } from '../../domain/post';
import { baseBrainVersion } from '../../flows/loop/brainVersion';
import { approve } from '../../lib/approval';
import { checksGate } from '../../domain/queue';
import { findPlatform, postLength } from '../../config/platforms';
import type { BadgeTone } from '../../ui/primitives/Badge';

export const sampleKitVersion = 3;
/** The Brain fixture's version, which sample approvals were made under (flows/loop/brainVersion.ts). */
export const sampleBrainVersion = baseBrainVersion;
export const sampleApprover = '[approver]';

/** "231 of 280 characters" where the platform has a limit, else "231 characters". */
export function lengthLabel(platformId: string, text: string): string {
  const p = findPlatform(platformId);
  const n = p ? postLength(p, text) : [...text].length;
  return p?.charLimit ? `${n} of ${p.charLimit.value} characters` : `${n} characters`;
}

export interface DraftSeed {
  id: string;
  name: string;
  platform: string;
  campaign: string;
  text: string;
  /** Approved by `[approver]` under the sample Brain version (fingerprint of exactly this text). */
  approved?: boolean;
  /** Published on its platform (keeps its approval). */
  published?: boolean;
}

/** A draft in the shared Post shape, with placeholder provenance and passing checks. */
export function sampleDraft(seed: DraftSeed): Post {
  const base: Post = {
    id: seed.id,
    name: seed.name,
    platform: seed.platform,
    campaign: seed.campaign,
    text: seed.text,
    length: lengthLabel(seed.platform, seed.text),
    provenance: { kitVersion: sampleKitVersion, brainVersion: sampleBrainVersion, evidenceIds: [], ruleIds: [], voice: '[voice]', prompt: { id: '[prompt]', version: '[version]' }, model: '[model]' },
    checks: { slop: 'passed', claims: { backed: 1, total: 1 }, disclosure: 'n/a' },
    lifecycle: {
      drafted: { voiceLabel: '[voice]' },
      published: seed.published ? [{ platform: seed.platform, version: 'Original', status: 'published', detail: 'Published', registered: true }] : [],
      amplified: [],
      results: { status: 'not-started', detail: 'Not started' },
    },
  };
  if (!seed.approved && !seed.published) return base;
  const approval = approve(postInputs(base, sampleBrainVersion), { by: sampleApprover, at: '[date]' });
  return { ...base, lifecycle: { ...base.lifecycle, approval } };
}

/** One draft's state for a plan item: published, approved, blocked by a check, or waiting for the person. */
export type DraftStatus = 'published' | 'approved' | 'blocked' | 'needs-you';

export function draftStatus(post: Post, brainVersion: string): DraftStatus {
  if (post.lifecycle.published.some((r) => r.status === 'published')) return 'published';
  if (approvalState(post, brainVersion) === 'valid') return 'approved';
  return checksGate(post.checks).blocking ? 'blocked' : 'needs-you';
}

export const draftStatusLabel: Record<DraftStatus, { label: string; tone?: BadgeTone }> = {
  published: { label: 'Published', tone: 'solid' },
  approved: { label: 'Approved', tone: 'success' },
  blocked: { label: 'Blocked by a check', tone: 'warning' },
  'needs-you': { label: 'Needs you', tone: 'warning' },
};
