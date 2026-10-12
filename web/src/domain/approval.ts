// Gates and approvals for the loop domain. The approval model itself is the one in lib/approval.ts (an approval
// stored with a fingerprint of exactly what was approved; stale when those inputs change).
import type { Approval, Approver } from '../lib/approval';

/** The one gate type, from lib/approval.ts (approveThrough takes it): re-exported for the loop domain. */
export type { Gate } from '../lib/approval';

/** A person's approval: who and when, bound to the inputs it was made on (lib/approval.ts). */
export type PersonApproval = Approval<Approver>;
