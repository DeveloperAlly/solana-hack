// Sample registered posts and brands for the "Verify + ledger" page (issue #49). Shared by Verify and the Ledger, so a
// post checked on Verify is the same row the Ledger lists.
// Sources (AGENTS rule 6):
// - Canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Verify-1-Match (aDNA post, kit v1, approver,
//   5 Oct 2026 16:18 approval, LinkedIn 16:21), Verify-3-Edited (the approved original and the "banned claim" chip on
//   "10x"), Verify-5-Retracted (retracted by JamJam; [date], [reason]) and Ledger (JamJam kit v1, LinkedIn launch post).
// - Backend map .agentic/what/context/backend_map.md §4, row "Verify-1, Verify-2, Verify-3" (tables registrations,
//   drafts) and §3 (registrations gains kit_version, approver_id, platform_url, domain_verified_at_time).
// Anything the canvas brackets stays bracketed. No figure here is invented; text the canvas does not give is bracketed.
import type { ApprovedPost, BrandRef } from './types';

export const adna: BrandRef = { id: 'adna', name: 'aDNA', domain: 'adna.network', domainVerified: true };
export const jamjam: BrandRef = { id: 'jamjam', name: 'JamJam', domain: 'jamjam.tech', domainVerified: true };

/** Verify-1-Match: the exact text that returns "Brand-approved: yes". */
export const adnaLaunchPost: ApprovedPost = {
  id: 'post-adna-li',
  brand: adna,
  text: 'My coding agent lost a full day of work last week. Not the code. The context.',
  kitVersion: 1,
  approver: '[approver]',
  approvedAt: '2026-10-05T16:18',
  published: { platform: 'LinkedIn', at: '2026-10-05T16:21', url: null },
  label: 'LinkedIn post',
  signature: null,
  bannedPhrases: ['10x'],
  retraction: null,
};

/** Verify-3-Edited: the brand-approved original that the pasted copy was edited from. */
export const adnaStandardPost: ApprovedPost = {
  ...adnaLaunchPost,
  id: 'post-adna-standard',
  text: "That's the gap aDNA fills: an open standard for project context that any agent can read, version and audit. One shared file. No lock-in.",
  approvedAt: null,
  published: null,
  label: 'Post · [where published]',
};

/** Ledger: JamJam's own LinkedIn launch post. Its words are not on the canvas, so they stay bracketed. */
export const jamjamLaunchPost: ApprovedPost = {
  id: 'post-jamjam-li',
  brand: jamjam,
  text: '[JamJam launch post text]',
  kitVersion: 1,
  approver: '[approver]',
  approvedAt: null,
  published: { platform: 'LinkedIn', at: null, url: null },
  label: 'LinkedIn launch post',
  signature: null,
  bannedPhrases: [],
  retraction: null,
};

/** Verify-5-Retracted: a post JamJam approved, then retracted. */
export const jamjamRetractedPost: ApprovedPost = {
  ...jamjamLaunchPost,
  id: 'post-jamjam-retracted',
  text: '[retracted JamJam post text]',
  label: '[retracted post]',
  published: null,
  retraction: { at: null, reason: '[reason]', signature: null },
};

export const registeredPosts: ApprovedPost[] = [adnaLaunchPost, adnaStandardPost, jamjamLaunchPost, jamjamRetractedPost];
