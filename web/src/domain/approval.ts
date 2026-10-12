// Gates and approvals for the loop domain. The approval model itself is the one in lib/approval.ts (an approval
// stored with a fingerprint of exactly what was approved; stale when those inputs change).
import type { Approval } from '../lib/approval';

/** A gate result: whether it blocks the action, and the sentence that says why (badges and buttons read the same one). */
export interface Gate {
  blocking: boolean;
  label: string;
}

/** A person's approval: who and when, bound to the inputs it was made on (lib/approval.ts). */
export type PersonApproval = Approval<{ by: string; at: string }>;
