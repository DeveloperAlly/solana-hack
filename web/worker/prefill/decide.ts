// The owner's decisions on facts (J3-Confirm's FactRecord, PR #75 types.ts) and on conflicts (backlog B3a), as
// operations the routes call (issue #34). There is one review path: accept and reject go through api.ts
// reviewEvidence (ADR-011), which also records the owner's own decision (owner_decision), an edit through PR #96's editFact (the source fact is rejected and the owner's wording
// becomes an approved owner statement, linked by edited_from), and every conflict decision through #91's one call,
// extract/conflicts.ts resolveFactConflict (spec/db/012 resolve_fact_conflict), which checks and changes everything in
// one transaction: a refused call changes nothing, and its 404, 409 and 400 reach the caller through db.ts dbError.
// A conflict left with fewer than two values closes itself in the database (spec/db/012 rederive_conflicts), so nothing
// here closes one. The two review functions are passed in, so this module does not depend on which of #96 and this PR
// merges first.
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { resolveFactConflict } from '../extract/conflicts';
import { normText } from '../extract/facts';
import { SECTIONS } from '../kit';
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

/**
 * How the owner settles a conflict, exactly one mode (PR #101 review): keep a side (the facts the owner picked, all on
 * one side), reject every side, or give their own answer (its wording and the value alone, for example the year).
 */
export type Resolution =
  | { mode: 'keep'; keep: string[] }
  | { mode: 'reject_all' }
  | { mode: 'answer'; answer: { text: string; value: string; editedFrom?: string } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const only = (o: Record<string, unknown>, keys: string[], what: string) => {
  const extra = Object.keys(o).filter((k) => !keys.includes(k));
  if (extra.length) throw new HttpError(400, `${what} takes only ${keys.join(', ')}; remove ${extra.join(', ')}`);
};

/**
 * The resolve body, checked whole at the boundary before anything is written: exactly one mode, its own fields and no
 * others, each of the right type and length. An ambiguous body ({answer, keep: null}, a mode with another mode's
 * fields, unknown fields) is a 400, never read as one of the choices it names.
 */
export function parseResolution(b: Record<string, unknown>): Resolution {
  switch (b.mode) {
    case 'keep': {
      only(b, ['mode', 'keep'], 'mode keep');
      const keep = b.keep;
      if (!Array.isArray(keep) || !keep.length || keep.length > 50 || !keep.every((k) => typeof k === 'string' && UUID.test(k))) throw new HttpError(400, 'keep must list the ids of the facts on the side you choose');
      return { mode: 'keep', keep: [...new Set(keep as string[])].sort() };
    }
    case 'reject_all':
      only(b, ['mode'], 'mode reject_all');
      return { mode: 'reject_all' };
    case 'answer': {
      only(b, ['mode', 'answer'], 'mode answer');
      const a = b.answer;
      if (!a || typeof a !== 'object' || Array.isArray(a)) throw new HttpError(400, 'answer must be {text, value}');
      only(a as Record<string, unknown>, ['text', 'value'], 'answer');
      const { text, value } = a as Record<string, unknown>;
      const t = typeof text === 'string' ? text.trim() : '';
      const v = typeof value === 'string' ? value.trim() : '';
      if (!t || t.length > MAX_EDIT) throw new HttpError(400, `your answer's wording must be 1 to ${MAX_EDIT} characters`);
      if (!v || v.length > MAX_VALUE) throw new HttpError(400, `your answer's value must be 1 to ${MAX_VALUE} characters`);
      return { mode: 'answer', answer: { text: t, value: v } };
    }
    default:
      throw new HttpError(400, "mode must be 'keep', 'reject_all' or 'answer'");
  }
}

/**
 * The kit section an owner's answer to a conflict is filed under. The section of the fact it rewords, when it rewords
 * one (as PR #96's editFact keeps it). Otherwise the section most of the conflict's facts are filed under, ties broken
 * by kit section order (kit.ts SECTIONS): a rule over the facts themselves, so the same conflict always gives the same
 * section whatever order the database returns rows in (PR #101 review). There is no slot-to-section table to read it
 * from: extract/facts.ts SLOTS holds each slot's label only, and extraction files every fact under its own section.
 */
export function answerSection(facts: Pick<FactRow, 'id' | 'section'>[], editedFrom?: string): string {
  const from = editedFrom ? facts.find((f) => f.id === editedFrom) : undefined;
  if (from) return from.section;
  const order = Object.keys(SECTIONS);
  const count = new Map<string, number>();
  for (const f of facts) if (f.section in SECTIONS) count.set(f.section, (count.get(f.section) ?? 0) + 1);
  return [...count].sort(([a, x], [b, y]) => y - x || order.indexOf(a) - order.indexOf(b))[0]?.[0] ?? '';
}

/**
 * Resolves a conflict (B3a: "the system never picks"; the owner does). keep: the facts the owner picked must all give
 * one value; every live fact giving that value is kept and the rest rejected. reject_all: every side rejected. answer:
 * every side rejected and the owner's own value saved as an approved owner answer, in the same transaction.
 * Every check that can race (the conflict already resolved in another tab, a kept fact deleted or rejected since it
 * was shown) is the database function's, so the answer to a race is its 409, not a check made a moment earlier here.
 */
export async function resolveConflict(env: Env, user: { id: string }, brand: { id: string }, conflictId: string, how: Resolution) {
  const [c] = await db.select<ConflictRow>(env, 'fact_conflicts', `${db.eq('id', conflictId)}&${db.eq('brand_id', brand.id)}&select=id,evidence_ids`);
  if (!c) throw new HttpError(404, 'conflict not found');
  const facts = await db.select<FactRow>(env, 'evidence', `${db.eq('brand_id', brand.id)}&id=in.(${ids(c.evidence_ids)})&select=id,section,review_status,trust,slot_value,slot_key&order=id.asc`);
  const live = facts.filter((f) => f.review_status !== 'rejected' && f.trust !== 'owner_answer');
  let keep: string[] = [];
  let answer: Parameters<typeof resolveFactConflict>[1]['answer'];
  if (how.mode === 'answer') {
    answer = { section: answerSection(facts, how.answer.editedFrom), claim: how.answer.text, value: how.answer.value, ...(how.answer.editedFrom ? { editedFrom: how.answer.editedFrom } : {}) };
  } else if (how.mode === 'keep') {
    const picked = how.keep.map((id) => live.find((f) => f.id === id));
    if (picked.every((f): f is FactRow => !!f)) {
      const keys = new Set(picked.map(keyOf));
      if (keys.size > 1) throw new HttpError(400, 'keep names facts on different sides; choose one side');
      keep = live.filter((f) => keys.has(keyOf(f))).map((f) => f.id).sort();
    } else {
      // A picked fact that is gone or rejected is passed as asked, so the database refuses it (409: reload) instead
      // of this code quietly keeping less than the owner chose.
      keep = how.keep;
    }
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
    const resolved = await resolveConflict(env, user, brand, conflict.id, { mode: 'keep', keep: [id] });
    return { evidence: { id, review_status: 'approved' }, stale: resolved.stale, resolved };
  }
  if (record.decision === 'edited') {
    if (!conflict) {
      const out = await ops.edit(env, brand.id, id, record.edit);
      // The owner's decision on the fact they reworded (spec/db/012 owner_decision), beside #96's rejection of it.
      await db.update(env, 'evidence', `${db.eq('brand_id', brand.id)}&${db.eq('id', id)}`, { owner_decision: 'edited', owner_decided_by: user.id, owner_decided_at: new Date().toISOString() });
      return out;
    }
    if (!record.value) throw new HttpError(400, 'this fact is part of a disagreement: give the value in your own words (for example the year) with your wording');
    const resolved = await resolveConflict(env, user, brand, conflict.id, { mode: 'answer', answer: { text: record.edit, value: record.value, editedFrom: id } });
    return { evidence: { id: resolved.answer }, replaced: id, stale: resolved.stale, resolved };
  }
  return ops.review(env, brand, id, 'rejected', user.id);
}
