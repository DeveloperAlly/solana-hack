// Approvals bound to what was approved (issue #45 rule "approvals go stale when their inputs change"; ADR-012
// decision 4: approvals bound to an older Brain go stale). The Worker does the same for posts: any edit resets an
// approved post to drafted (web/worker/posts.ts). Shared by every stage, so every screen agrees on staleness.

/** One recorded decision by a person: who, when, and a fingerprint of the exact inputs they approved. */
export interface Approval {
  by: string;
  at: string;
  fingerprint: string;
}

/** A gate result: whether it blocks the action, and the sentence that says why (badges and buttons read the same one). */
export interface Gate {
  blocking: boolean;
  label: string;
}

/** A stable fingerprint of the inputs an approval covers (text, versions, ids). Order matters; JSON keeps it exact. */
export const fingerprintOf = (...inputs: unknown[]): string => JSON.stringify(inputs);

/** An approval is stale when the inputs it covered have changed since. */
export const isStale = (approval: Approval, currentFingerprint: string): boolean => approval.fingerprint !== currentFingerprint;
