// The owner's decisions on facts (issue #34; J3-Confirm's FactRecord) and on conflicts (backlog B3a). Both go through
// the one evidence review path (api.ts reviewEvidence, ADR-011), which they extend with who decided, when and how
// (spec/db/012 evidence.decision, decided_by, decided_at). Nothing here approves a fact on its own.
import { reviewEvidence, saveAnswer } from '../api';
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { normText } from '../extract/facts';
import type { FactRecord } from './contract';
import { fieldById } from './fields';

interface BrandRow { id: string; owner_id: string; name: string; type: string; description: string | null; website: string | null; goal: string | null; channel: string | null }
interface FactRow { id: string; trust: string | null; review_status: string | null; field: string | null; slot_value: string | null }
interface ConflictRow { id: string; slot: string; evidence_ids: string[]; question: string; status: string }

/** The longest edit kept, the same cap an interview answer has (api.ts PUT /answers). */
export const MAX_EDIT = 2000;

/** A FactRecord from a request body, or a 400. */
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

const stamp = (user: { id: string }, decision: string) => ({ decision, decided_by: user.id, decided_at: new Date().toISOString() });

async function openConflictsOf(env: Env, brand: BrandRow, id: string) {
  // PostgREST array containment (cs): conflicts whose evidence_ids include this fact.
  return db.select<ConflictRow>(env, 'fact_conflicts', `${db.eq('brand_id', brand.id)}&status=eq.open&evidence_ids=cs.${encodeURIComponent(`{${id}}`)}&select=id,slot,evidence_ids,question,status`);
}

/**
 * Accept, edit or reject one fact.
 * - accepted: approved, and recorded as the owner's confirmation (the coverage map counts it as their answer).
 * - edited: the new wording is saved as the owner's answer to the question the fact was routed to (api.ts saveAnswer,
 *   so it becomes owner evidence like any answer), and the fact is rejected so its old wording backs nothing.
 * - rejected: rejected.
 * A fact in an open conflict is decided through the conflict: accepting it keeps its side and rejects the others,
 * editing it rejects every side and saves the owner's own answer, rejecting it closes the conflict once fewer than two
 * sides remain.
 */
export async function decideFact(env: Env, user: { id: string }, brand: BrandRow, id: string, record: FactRecord) {
  const [row] = await db.select<FactRow>(env, 'evidence', `${db.eq('brand_id', brand.id)}&${db.eq('id', id)}&select=id,trust,review_status,field,slot_value`);
  if (!row) throw new HttpError(404, 'fact not found');
  const [conflict] = await openConflictsOf(env, brand, id);
  let answer: unknown;
  if (record.decision === 'edited') {
    const field = fieldById(row.field);
    if (!field?.routable) throw new HttpError(409, 'this fact does not answer an interview question, so it cannot be edited into an answer; accept or reject it');
    const [prev] = await db.select<{ data: Record<string, string>; skipped: boolean }>(env, 'answers', `${db.eq('brand_id', brand.id)}&${db.eq('step', field.step)}&select=data,skipped`);
    const data = { ...(prev && !prev.skipped ? prev.data : {}), [field.key]: record.edit };
    answer = (await saveAnswer(env, brand, field.step, data, false)).answer;
  }
  if (conflict) {
    const keep = record.decision === 'accepted' ? id : null;
    if (record.decision === 'rejected') {
      const out = await reviewEvidence(env, brand, id, 'rejected', stamp(user, 'rejected'));
      await closeIfSettled(env, user, brand, conflict);
      return { ...out, ...(answer ? { answer } : {}) };
    }
    const out = await resolveConflict(env, user, brand, conflict.id, keep, record.decision);
    return { evidence: out.evidence.find((e) => e.id === id) ?? null, stale: out.stale, ...(answer ? { answer } : {}) };
  }
  const out = await reviewEvidence(env, brand, id, record.decision === 'accepted' ? 'approved' : 'rejected', stamp(user, record.decision));
  return { ...out, ...(answer ? { answer } : {}) };
}

/** Closes an open conflict once its live facts no longer give two different values. */
async function closeIfSettled(env: Env, user: { id: string }, brand: BrandRow, c: ConflictRow) {
  const facts = await db.select<FactRow>(env, 'evidence', `${db.eq('brand_id', brand.id)}&id=in.(${c.evidence_ids.map(encodeURIComponent).join(',')})&select=id,trust,review_status,field,slot_value`);
  const values = new Set(facts.filter((f) => f.review_status !== 'rejected').map((f) => normText(f.slot_value ?? '')));
  if (values.size < 2) await close(env, user, brand, c.id);
}

async function close(env: Env, user: { id: string }, brand: BrandRow, id: string) {
  const now = new Date().toISOString();
  return db.update<ConflictRow>(env, 'fact_conflicts', `${db.eq('id', id)}&${db.eq('brand_id', brand.id)}&status=eq.open`, { status: 'resolved', resolved_by: user.id, resolved_at: now, updated_at: now });
}

/**
 * Resolves a conflict (backlog B3a: "the system never picks"; the owner does). `keep` is any fact on the side the
 * owner chose: every fact giving that value is approved and every other fact rejected. `keep` null rejects every side
 * (none is right; the owner answers in their own words instead). The conflict is closed first, so a source saved at the
 * same moment cannot reopen it over the same facts (spec/db/011 record_fact_conflict skips a resolved disagreement)
 * and hold the chosen fact again.
 */
export async function resolveConflict(env: Env, user: { id: string }, brand: BrandRow, conflictId: string, keep: string | null, how: 'accepted' | 'edited' | 'rejected' = 'accepted') {
  const [c] = await db.select<ConflictRow>(env, 'fact_conflicts', `${db.eq('id', conflictId)}&${db.eq('brand_id', brand.id)}&select=id,slot,evidence_ids,question,status`);
  if (!c) throw new HttpError(404, 'conflict not found');
  if (c.status !== 'open') throw new HttpError(409, 'this disagreement is already resolved');
  if (keep !== null && !c.evidence_ids.includes(keep)) throw new HttpError(400, 'keep must be one of the facts in this disagreement');
  const facts = await db.select<FactRow>(env, 'evidence', `${db.eq('brand_id', brand.id)}&id=in.(${c.evidence_ids.map(encodeURIComponent).join(',')})&select=id,trust,review_status,field,slot_value`);
  const chosen = keep === null ? null : normText(facts.find((f) => f.id === keep)?.slot_value ?? '');
  const [closed] = await close(env, user, brand, c.id);
  if (!closed) throw new HttpError(409, 'this disagreement changed while you were deciding; reload and try again');
  const evidence: { id: string; review_status: string | null }[] = [];
  const stale = new Set<string>();
  for (const f of facts) {
    // Only facts read from a source are reviewable (api.ts REVIEWABLE); an owner answer never fills a slot.
    if (f.trust !== 'owned' && f.trust !== 'third_party') continue;
    const win = chosen !== null && normText(f.slot_value ?? '') === chosen;
    const out = await reviewEvidence(env, brand, f.id, win ? 'approved' : 'rejected', stamp(user, win ? 'accepted' : how === 'edited' ? 'edited' : 'rejected'));
    evidence.push(out.evidence as { id: string; review_status: string | null });
    out.stale.forEach((s) => stale.add(s));
  }
  return { conflict: closed, evidence, stale: [...stale] };
}
