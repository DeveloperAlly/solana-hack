// Closing a conflict (backlog B3a: the owner decides; the system never picks). The one call #34's routes make
// (issue #34, PR #101): spec/db/012 resolve_fact_conflict checks and changes everything in one transaction, so a
// refused call changes nothing, and its PTxyz errors reach the caller as HTTP statuses through db.ts dbError.
import { db } from '../db';
import type { Env } from '../env';
import { normText } from './facts';

/** The owner's own value for the disputed slot, saved as an approved owner answer in the same transaction. */
export interface OwnerConflictAnswer {
  /** Kit section of the answer (the section the disputed facts are in). */
  section: string;
  /** The owner's sentence, 1 to 500 characters (PR #96 editFact's limit). */
  claim: string;
  /** The slot's value, 1 to 120 characters (extract/facts.ts MAX_VALUE). */
  value: string;
  /** When the answer rewords one of the disputed source facts: that fact's id (needs PR #96's evidence.edited_from). */
  editedFrom?: string;
}

/**
 * Resolves an open conflict: either `keep` (fact ids on it; every other source fact on it is rejected) or `answer`
 * (every source fact on it is rejected and the owner's value is saved). Errors: 404 no such conflict for this brand;
 * 409 already resolved, or a kept fact no longer exists or was rejected (the conflict changed: reload); 400 a kept fact
 * not on it, both keep and answer, or an answer that is not valid. Returns how many facts' reviews were set and the
 * new owner answer's id.
 */
export async function resolveFactConflict(env: Env, a: { brandId: string; conflictId: string; by: string | null; keep?: string[]; answer?: OwnerConflictAnswer }) {
  const [c] = await db.select<{ slot: string }>(env, 'fact_conflicts', `${db.eq('id', a.conflictId)}&${db.eq('brand_id', a.brandId)}&select=slot`);
  const answer = a.answer
    ? {
        section: a.answer.section, claim: a.answer.claim, slot: c?.slot ?? null, value: a.answer.value,
        // The comparable form the database tells values apart by (evidence.slot_key), from the same normaliser as save.
        slot_key: normText(a.answer.value),
        ...(a.answer.editedFrom ? { edited_from: a.answer.editedFrom } : {}),
      }
    : null;
  return db.rpc<{ changed: number; answer: string | null }>(env, 'resolve_fact_conflict', {
    p_brand: a.brandId, p_conflict: a.conflictId, p_keep: a.keep ?? [], p_by: a.by, p_answer: answer,
  });
}
