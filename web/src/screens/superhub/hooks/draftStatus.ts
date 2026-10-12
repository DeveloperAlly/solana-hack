import type { DraftStatus } from '../types';

/** Approval and registration are separate steps (web/worker/posts.ts: approved, then registering, then registered). */
export type Decision = 'approved' | 'registered' | 'rejected' | 'rewrite';

/**
 * A decision taken in Draft-Review, kept in the hub session by draft id so the dashboard and a reopened draft show it:
 * the decision, the publish route, the text decided on and, on the manual route, the pasted post URL.
 */
export interface DraftRecord {
  decision: Decision;
  route: string;
  text: string;
  postedUrl?: string;
}

/** The publish route that needs the person to post it and paste the URL back. */
export const MANUAL_ROUTE = 'manual';

export const draftStatusLabel: Record<DraftStatus, string> = {
  approval: 'Needs approval',
  scheduled: 'Scheduled',
  'awaiting-url': 'Awaiting the post URL',
  posted: 'Posted',
  rejected: 'Rejected',
};

/**
 * The one status function for a reviewed draft: the badge on the publish card and the content dashboard's buckets both
 * read it. Approved or registered on the manual route waits for the URL; it is Posted only once a URL was pasted back.
 */
export function draftStatusOf(decision: Decision | null, route: string, postedUrl?: string): DraftStatus {
  if (decision === 'rejected') return 'rejected';
  if (decision !== 'approved' && decision !== 'registered') return 'approval';
  if (route === 'schedule') return 'scheduled';
  if (route === MANUAL_ROUTE && !postedUrl) return 'awaiting-url';
  return 'posted';
}

/** The status of a recorded draft (the same function as the badge). */
export const recordStatus = (r: DraftRecord): DraftStatus => draftStatusOf(r.decision, r.route, r.postedUrl);

/** A pasted post URL: https, with a host. */
export function isPostUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' && u.hostname.includes('.');
  } catch {
    return false;
  }
}
