// The one approval model for every flow (issue #45, "Approvals go stale when their inputs change"; Codex reviews on
// PRs #73, #75, #79, #81 and #103). An approval is stored with a fingerprint of exactly what was approved. When those
// inputs change, the approval is stale: every screen treats it as not approved, and the person approves again. This
// mirrors the Worker, which resets an approved post to drafted on any edit (web/worker/posts.ts).

/** A gate result: whether it blocks the action, and the sentence that says why (badges and buttons read the same one). */
export interface Gate {
  blocking: boolean;
  label: string;
}

/** Who approved and when: the decision recorded by the loop's approvals (posts, versions, queue items). */
export interface Approver {
  by: string;
  at: string;
}

/** A decision bound to the inputs it was made on. */
export interface Approval<D = true> {
  decision: D;
  fingerprint: string;
}

/** The fingerprint of a set of inputs: equal inputs give equal fingerprints. */
export const fingerprintOf = (inputs: unknown): string => JSON.stringify(inputs);

/** Records a decision on these inputs. */
export function approve<D = true>(inputs: unknown, decision: D = true as D): Approval<D> {
  return { decision, fingerprint: fingerprintOf(inputs) };
}

/** True when there is an approval and the inputs changed since it was made. */
export function isStale(approval: Approval<unknown> | null | undefined, inputs: unknown): boolean {
  return Boolean(approval) && approval!.fingerprint !== fingerprintOf(inputs);
}

/** True when there is an approval and it was made on exactly these inputs. */
export function isCurrent(approval: Approval<unknown> | null | undefined, inputs: unknown): approval is Approval<unknown> {
  return Boolean(approval) && approval!.fingerprint === fingerprintOf(inputs);
}

/**
 * Records a decision only through the current gate on these inputs (Codex review on PR 102): while the gate blocks, or
 * is pending a re-check, there is no approval. Every approve action that has checks goes through this, so an edit can
 * never be approved before its checks have re-run.
 */
export function approveThrough<D = true>(gate: Gate, inputs: unknown, decision: D = true as D): Approval<D> | null {
  return gate.blocking ? null : approve(inputs, decision);
}
