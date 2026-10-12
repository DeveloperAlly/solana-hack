// The owner's decisions on facts (J3-Confirm's FactRecord, PR #75 types.ts) and on conflicts (backlog B3a), as
// operations the routes call (issue #34). There is one review path: accept and reject go through api.ts
// reviewEvidence (ADR-011), which also records the owner's own decision (owner_decision), an edit through PR #96's editFact (the source fact is rejected and the owner's wording
// becomes an approved owner statement, linked by edited_from), and every conflict decision through #91's one call,
// extract/conflicts.ts resolveFactConflict (spec/db/011 resolve_fact_conflict), which checks and changes everything in
// one transaction: a refused call changes nothing, and its 404, 409 and 400 reach the caller through db.ts dbError.
// A conflict left with fewer than two values closes itself in the database (spec/db/011 rederive_conflicts), so nothing
// here closes one. The two review functions are passed in, so this module does not depend on which of #96 and this PR
// merges first.
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { resolveFactConflict } from '../extract/conflicts';
import { normText } from '../extract/facts';
import type { FactRecord } from './contract';

/** The review operations a decision runs through: api.ts reviewEvidence, and PR #96's journey.ts editFact. */
export interface DecisionOps {
  review(env: Env, brand: { id: string }, id: string, status: 'approved' | 'rejected', by: string | null): Promise<{ evidence: unknown; stale: string[] }>;
  edit(env: Env, brandId: string, id: string, text: string): Promise<{ evidence: unknown; stale: string[]; replaced?: string }>;
}

interface FactRow { id: string; section: string; review_status: string | null; trust: string | null; slot_value: string | null; slot_key?: string | null }
interface ConflictRow { id: string; evidence_ids: string[] }

/** The longest edit kept: PR #96's editFact and resolve_fact_conflict both keep 500 characters; longer is refused. */
export const MAX_EDIT = 500;
/** The longest value of a disputed slot (extract/facts.ts MAX_VALUE; resolve_fact_conflict refuses longer). */
export const MAX_VALUE = 120;

/** A FactRecord, plus, for an edit of a disputed fact, the slot's value in the owner's words (the year, the city). */
export type Decision = FactRecord & { value?: string };

/** A decision from a request body ({decision: 'accepted' | 'edited' | 'rejected', edit?, value?}), or a 400. */
export function parseRecord(b: Record<string, unknown>): Decision {
  if (b.decision === 'accepted' || b.decision === 'rejected') return { decision: b.decision };
  if (b.decision === 'edited') {
    const edit = typeof b.edit === 'string' ? b.edit.trim() : '';
    if (!edit) throw new HttpError(400, 'an edited fact needs its new wording');
    if (edit.length > MAX_EDIT) throw new HttpError(400, `keep the edit under ${MAX_EDIT} characters`);
    const value = typeof b.value === 'string' ? b.value.trim() : '';
    if (value.length > MAX_VALUE) throw new HttpError(400, `keep the value under ${MAX_VALUE} characters`);
    return { decision: 'edited', edit, ...(value ? { value } : {}) };
  }
  throw new HttpError(400, 'decision must be accepted, edited or rejected');
}

const ids = (list: string[]) => list.map(encodeURIComponent).join(',');
/** The comparable form of a slot value: the database's slot_key when stored, else the same normaliser (facts.ts). */
const keyOf = (f: FactRow) => f.slot_key || normText(f.slot_value ?? '');

/** The open conflict this fact is a side of, if any (PostgREST array containment, cs). */
async function openConflictOf(env: Env, brandId: string, id: string) {
  const [c] = await db.select<ConflictRow>(env, 'fact_conflicts', `${db.eq('brand_id', brandId)}&status=eq.open&evidence_ids=cs.${encodeURIComponent(`{${id}}`)}&select=id,evidence_ids&limit=1`);
  return c;
}

/** Sections whose draft cites any of these facts: they need redrafting before the next kit (api.ts staleSections). */
async function citing(env: Env, brandId: string, factIds: string[]) {
  if (!factIds.length) return [];
  const sections = await db.select<{ section: string; citations: string[] | null }>(env, 'kit_sections', `${db.eq('brand_id', brandId)}&select=section,citations`);
  const gone = new Set(factIds);
  return sections.filter((s) => (s.citations ?? []).some((c) => gone.has(c))).map((s) => s.section);
}

/** How the owner settles a conflict: keep the side of one fact, reject every side, or give their own answer. */
export type Resolution = { keep: string | null } | { answer: { claim: string; value: string; editedFrom?: string } };

/**
 * Resolves a conflict (B3a: "the system never picks"; the owner does). `keep` is any fact on the side the owner chose:
 * every live fact giving that value is kept and the rest rejected. `keep` null rejects every side. `answer` rejects
 * every side and saves the owner's own value as an approved owner answer, in the same transaction.
 * Every check that can race (the conflict already resolved in another tab, a kept fact deleted or rejected since it
 * was shown) is the database function's, so the answer to a race is its 409, not a check made a moment earlier here.
 */
export async function resolveConflict(env: Env, user: { id: string }, brand: { id: string }, conflictId: string, how: Resolution) {
  const [c] = await db.select<ConflictRow>(env, 'fact_conflicts', `${db.eq('id', conflictId)}&${db.eq('brand_id', brand.id)}&select=id,evidence_ids`);
  if (!c) throw new HttpError(404, 'conflict not found');
  const facts = await db.select<FactRow>(env, 'evidence', `${db.eq('brand_id', brand.id)}&id=in.(${ids(c.evidence_ids)})&select=id,section,review_status,trust,slot_value,slot_key`);
  const live = facts.filter((f) => f.review_status !== 'rejected' && f.trust !== 'owner_answer');
  let keep: string[] = [];
  let answer: Parameters<typeof resolveFactConflict>[1]['answer'];
  if ('answer' in how) {
    const section = (facts.find((f) => f.id === how.answer.editedFrom) ?? live[0] ?? facts[0])?.section ?? '';
    answer = { section, claim: how.answer.claim, value: how.answer.value, ...(how.answer.editedFrom ? { editedFrom: how.answer.editedFrom } : {}) };
  } else if (how.keep !== null) {
    const kept = live.find((f) => f.id === how.keep);
    // A kept fact that is gone or rejected is passed as asked, so the database refuses it (409: reload) instead of
    // this code quietly keeping nothing, which would reject the side the owner chose.
    keep = kept ? live.filter((f) => keyOf(f) === keyOf(kept)).map((f) => f.id).sort() : [how.keep];
  }
  const out = await resolveFactConflict(env, { brandId: brand.id, conflictId: c.id, by: user.id, keep, ...(answer ? { answer } : {}) });
  const rejected = live.filter((f) => !keep.includes(f.id)).map((f) => f.id).sort();
  return { conflict: c.id, kept: keep, rejected, answer: out.answer, stale: await citing(env, brand.id, rejected) };
}

/**
 * Accept, edit or reject one fact.
 * - accepted: approved (reviewEvidence). A fact that is a side of an open conflict is accepted by resolving the
 *   conflict for its side, so the other sides are rejected in the same transaction.
 * - edited: PR #96's rule (editFact). For a disputed fact the owner's wording settles the question: one call rejects
 *   every side and saves the wording, with the slot's value, as an approved owner answer linked to the fact it
 *   rewords; nothing changes if it is refused.
 * - rejected: rejected (reviewEvidence); a conflict left with one value closes itself (rederive_conflicts).
 */
export async function decideFact(env: Env, user: { id: string }, brand: { id: string }, id: string, record: Decision, ops: DecisionOps) {
  const conflict = record.decision === 'rejected' ? undefined : await openConflictOf(env, brand.id, id);
  if (record.decision === 'accepted') {
    if (!conflict) return ops.review(env, brand, id, 'approved', user.id);
    const resolved = await resolveConflict(env, user, brand, conflict.id, { keep: id });
    return { evidence: { id, review_status: 'approved' }, stale: resolved.stale, resolved };
  }
  if (record.decision === 'edited') {
    if (!conflict) {
      const out = await ops.edit(env, brand.id, id, record.edit);
      // The owner's decision on the fact they reworded (spec/db/011 owner_decision), beside #96's rejection of it.
      await db.update(env, 'evidence', `${db.eq('brand_id', brand.id)}&${db.eq('id', id)}`, { owner_decision: 'edited', owner_decided_by: user.id, owner_decided_at: new Date().toISOString() });
      return out;
    }
    if (!record.value) throw new HttpError(400, 'this fact is part of a disagreement: give the value in your own words (for example the year) with your wording');
    const resolved = await resolveConflict(env, user, brand, conflict.id, { answer: { claim: record.edit, value: record.value, editedFrom: id } });
    return { evidence: { id: resolved.answer }, replaced: id, stale: resolved.stale, resolved };
  }
  return ops.review(env, brand, id, 'rejected', user.id);
}
