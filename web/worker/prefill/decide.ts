// The owner's decisions on facts (J3-Confirm's FactRecord, PR #75 types.ts) and on conflicts (backlog B3a), as
// operations the routes call (issue #34). There is one review path: accept and reject go through api.ts
// reviewEvidence (ADR-011), an edit through PR #96's editFact (the source fact is rejected and the owner's wording
// becomes an approved owner statement, linked by edited_from), and a conflict is closed by spec/db/011's
// resolve_fact_conflict, which sets every side and closes the question in one transaction. The two review functions
// are passed in, so this module does not depend on which of #96 and this PR merges first.
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { normText } from '../extract/facts';
import type { FactRecord } from './contract';

/** The review operations a decision runs through: api.ts reviewEvidence, and PR #96's journey.ts editFact. */
export interface DecisionOps {
  review(env: Env, brand: { id: string }, id: string, status: 'approved' | 'rejected'): Promise<{ evidence: unknown; stale: string[] }>;
  edit(env: Env, brandId: string, id: string, text: string): Promise<{ evidence: unknown; stale: string[]; replaced?: string }>;
}

interface FactRow { id: string; review_status: string | null; trust: string | null; slot_value: string | null }
interface ConflictRow { id: string; evidence_ids: string[]; status: string }

/** The longest edit kept: PR #96's editFact keeps 500 characters, and a longer edit is refused rather than cut. */
export const MAX_EDIT = 500;

/** A FactRecord from a request body ({decision: 'accepted' | 'edited' | 'rejected', edit?}), or a 400. */
export function parseRecord(b: Record<string, unknown>): FactRecord {
  if (b.decision === 'accepted' || b.decision === 'rejected') return { decision: b.decision };
  if (b.decision === 'edited') {
    const edit = typeof b.edit === 'string' ? b.edit.trim() : '';
    if (!edit) throw new HttpError(400, 'an edited fact needs its new wording');
    if (edit.length > MAX_EDIT) throw new HttpError(400, `keep the edit under ${MAX_EDIT} characters`);
    return { decision: 'edited', edit };
  }
  throw new HttpError(400, 'decision must be accepted, edited or rejected');
}

const ids = (list: string[]) => list.map(encodeURIComponent).join(',');

/** The open conflict this fact is a side of, if any (PostgREST array containment, cs). */
async function openConflictOf(env: Env, brandId: string, id: string) {
  const [c] = await db.select<ConflictRow>(env, 'fact_conflicts', `${db.eq('brand_id', brandId)}&status=eq.open&evidence_ids=cs.${encodeURIComponent(`{${id}}`)}&select=id,evidence_ids,status&limit=1`);
  return c;
}

/** Sections whose draft cites any of these facts: they need redrafting before the next kit (api.ts staleSections). */
async function citing(env: Env, brandId: string, factIds: string[]) {
  if (!factIds.length) return [];
  const sections = await db.select<{ section: string; citations: string[] | null }>(env, 'kit_sections', `${db.eq('brand_id', brandId)}&select=section,citations`);
  const gone = new Set(factIds);
  return sections.filter((s) => (s.citations ?? []).some((c) => gone.has(c))).map((s) => s.section);
}

/**
 * Resolves a conflict (B3a: "the system never picks"; the owner does). `keep` is any fact on the side the owner chose:
 * every fact giving that value is approved and every other fact on the conflict rejected. `keep` null rejects every
 * side (none is right; the owner gives their own answer instead). Checked here first so the owner gets 404, 409 or 400
 * with a reason; spec/db/011 resolve_fact_conflict re-checks inside its transaction (a resolve racing this one fails
 * there and is refused).
 */
export async function resolveConflict(env: Env, user: { id: string }, brand: { id: string }, conflictId: string, keep: string | null) {
  const [c] = await db.select<ConflictRow>(env, 'fact_conflicts', `${db.eq('id', conflictId)}&${db.eq('brand_id', brand.id)}&select=id,evidence_ids,status`);
  if (!c) throw new HttpError(404, 'conflict not found');
  if (c.status !== 'open') throw new HttpError(409, 'this disagreement is already resolved');
  if (keep !== null && !c.evidence_ids.includes(keep)) throw new HttpError(400, 'keep must be one of the facts in this disagreement');
  const facts = await db.select<FactRow>(env, 'evidence', `${db.eq('brand_id', brand.id)}&id=in.(${ids(c.evidence_ids)})&select=id,review_status,trust,slot_value`);
  const chosen = keep === null ? null : normText(facts.find((f) => f.id === keep)?.slot_value ?? '');
  const kept = chosen === null ? [] : facts.filter((f) => normText(f.slot_value ?? '') === chosen).map((f) => f.id).sort();
  await db.rpc<number>(env, 'resolve_fact_conflict', { p_brand: brand.id, p_conflict: c.id, p_keep: kept, p_by: user.id });
  const rejected = facts.filter((f) => !kept.includes(f.id) && f.trust !== 'owner_answer').map((f) => f.id).sort();
  return { conflict: c.id, kept, rejected, stale: await citing(env, brand.id, rejected) };
}

/**
 * Accept, edit or reject one fact (FactRecord).
 * - accepted: approved (reviewEvidence). A fact that is a side of an open conflict is accepted by resolving the conflict
 *   for its side, so the other side is rejected in the same transaction.
 * - edited: PR #96's rule (editFact): the source fact is rejected and the owner's wording becomes an approved owner
 *   statement. For a disputed fact every side is rejected first (the owner's wording settles the question).
 * - rejected: rejected (reviewEvidence). When that leaves a conflict with no side standing, the conflict is closed.
 */
export async function decideFact(env: Env, user: { id: string }, brand: { id: string }, id: string, record: FactRecord, ops: DecisionOps) {
  const conflict = await openConflictOf(env, brand.id, id);
  if (record.decision === 'accepted') {
    if (!conflict) return ops.review(env, brand, id, 'approved');
    const out = await resolveConflict(env, user, brand, conflict.id, id);
    return { evidence: { id, review_status: 'approved' }, stale: out.stale, resolved: out };
  }
  if (record.decision === 'edited') {
    const resolved = conflict ? await resolveConflict(env, user, brand, conflict.id, null) : undefined;
    const out = await ops.edit(env, brand.id, id, record.edit);
    return { ...out, ...(resolved ? { resolved, stale: [...new Set([...out.stale, ...resolved.stale])] } : {}) };
  }
  const out = await ops.review(env, brand, id, 'rejected');
  if (conflict) {
    const facts = await db.select<FactRow>(env, 'evidence', `${db.eq('brand_id', brand.id)}&id=in.(${ids(conflict.evidence_ids)})&select=id,review_status,trust,slot_value`);
    if (!facts.some((f) => f.review_status !== 'rejected' && f.trust !== 'owner_answer')) {
      return { ...out, resolved: await resolveConflict(env, user, brand, conflict.id, null) };
    }
  }
  return out;
}
