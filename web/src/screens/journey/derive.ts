/*
 * What later Journey screens show, derived from the person's own choices earlier in the flow (issue #48). Fixtures are
 * only the defaults: a fact rejected on J3 is not cited on J5 or J6, an edited fact is cited in the person's words, J4's
 * answers, alternatives and voice picks fill the J5 drafts, and J6's chosen channel and text carry to J7. Pure
 * functions of the selections in useJourneyFlow, so each rule is tested on its own (derive.test.ts).
 */
import type { JourneySelections } from './useJourneyFlow';
import type { FirstPostData, GapsVoiceData, HubFirstRunData, JourneyChecklistEntry, JourneyClaim, JourneyClaimSegment, JourneyFact, JourneyGate, JourneyRecordRow, JourneyStatusRow } from './types';

/** Evidence ids that stand for an answer the owner gives on J4, and the answer they read. */
const answerIds: Record<string, string> = { 'answer-origin': 'origin', 'answer-edge': 'edge' };
export const ALTERNATIVES_ID = 'alternatives';

/** A cited fact as the person left it: null when rejected, their wording when edited, their answer when it is one. */
export function evidenceView(fact: JourneyFact, s: JourneySelections): JourneyFact | null {
  const record = s.facts[fact.id];
  if (record?.decision === 'rejected') return null;
  if (record?.decision === 'edited') return { ...fact, statement: record.edit };
  const answer = answerIds[fact.id] ? s.answers[answerIds[fact.id]]?.trim() : undefined;
  if (answer) return { ...fact, statement: answer };
  if (fact.id === ALTERNATIVES_ID) return { ...fact, statement: s.alternatives.join(', ') || 'None picked yet' };
  return fact;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** A claim in the draft on screen, with its evidence as the person left it (null: unsupported). */
export interface JourneyClaimView {
  id: string;
  text: string;
  evidence: JourneyFact | null;
}

/** The claims of one draft, in the order they appear, each with its evidence after J3. */
export function draftClaims(draft: { segments: JourneyClaimSegment[] }, claims: JourneyClaim[], s: JourneySelections): JourneyClaimView[] {
  return draft.segments.flatMap((seg) => {
    const c = claims.find((x) => x.id === seg.claimId);
    return c ? [{ id: c.id, text: c.text, evidence: c.evidence ? evidenceView(c.evidence, s) : null }] : [];
  });
}

/** "Built from" for a gate, counted from the evidence still cited after J3 and the alternatives picked on J4. */
function builtFrom(evidence: JourneyFact[], s: JourneySelections): string {
  const answers = evidence.filter((f) => answerIds[f.id]).length;
  const found = evidence.filter((f) => !answerIds[f.id] && f.id !== ALTERNATIVES_ID).length;
  const parts = [plural(found, 'fact', 'facts'), answers ? plural(answers, 'answer', 'answers') : '', evidence.some((f) => f.id === ALTERNATIVES_ID) ? plural(s.alternatives.length, 'alternative', 'alternatives') : ''];
  return parts.filter(Boolean).join(', ');
}

/** The voice the person chose on J4: one sentence, or the round 1 pick narrowed by the round 2 pick. */
function voiceDraft(gate: JourneyGate, s: JourneySelections, voice: GapsVoiceData['voice']): { draft: string; builtFrom: string } | null {
  if (s.voiceSentence.trim()) return { draft: `[Voice drafted from your sentence: "${s.voiceSentence.trim()}"]`, builtFrom: 'your sentence, 3 pages' };
  const first = voice.rounds[0].find((o) => o.value === s.voicePicks[1]);
  const second = voice.rounds[1].find((o) => o.value === s.voicePicks[2]);
  if (!first || !second) return null;
  return { draft: `${first.tag ?? first.title}, narrowed in round 2 by paragraph ${second.title}: [rules drawn from your picks]`, builtFrom: gate.builtFrom };
}

/** Fills the positioning template from J4: the first alternative picked and the "only you" answer. */
const positioningDraft = (gate: JourneyGate, s: JourneySelections) =>
  gate.draft.replace('{alternative}', s.alternatives[0] ?? '[alternative]').replace('{edge}', s.answers.edge?.trim() || '[edge]');

/** A J5 gate as the person's earlier choices leave it; an edit made on J5 itself wins over everything. */
export function gateView(gate: JourneyGate, s: JourneySelections, voice: GapsVoiceData['voice']): JourneyGate {
  const evidence = gate.evidence.flatMap((f) => evidenceView(f, s) ?? []);
  const counted = builtFrom(evidence, s);
  const derived = {
    purpose: { draft: gate.draft, builtFrom: counted },
    positioning: { draft: positioningDraft(gate, s), builtFrom: counted },
    voice: voiceDraft(gate, s, voice) ?? { draft: gate.draft, builtFrom: gate.builtFrom },
  }[gate.id];
  return { ...gate, evidence, builtFrom: derived.builtFrom, draft: s.gateDrafts[gate.id] ?? derived.draft };
}

/** J8 as this visit left it: when kit v1 registration failed, the kit is approved but not registered and no post exists yet. */
export function hubView(data: HubFirstRunData, s: JourneySelections) {
  const kitPending = s.kitRegistered === false;
  const postPending = kitPending;
  const pending: Record<'kit' | 'post', Partial<JourneyChecklistEntry> | null> = {
    kit: kitPending ? { label: 'Register kit v1', hint: 'approved; registration did not go through', done: false, target: 'approveKit' } : null,
    post: postPending ? { label: 'Write your first post', hint: 'drafted once kit v1 is registered', done: false } : null,
  };
  const checklist = data.checklist.map((item) => ({ ...item, ...(pending[item.id as 'kit' | 'post'] ?? {}) }));
  const unregistered = (row: JourneyRecordRow, isPending: boolean): JourneyRecordRow => (isPending ? { label: row.label, value: 'Not registered yet' } : row);
  const status = [kitPending ? 'Kit v1 approved, not registered' : 'Kit v1 registered', postPending ? 'no post yet' : 'first post official', data.readiness].join(' · ');
  return { status, checklist, publicRecord: [unregistered(data.publicRecord.kit, kitPending), unregistered(data.publicRecord.post, postPending)] };
}

/**
 * J6's checks and its Approve gate from one place: each gate row says Passed or Blocked, and Approve is ready only when
 * no gate is blocked, so a badge can never say Blocked while the action stays enabled. Voice fit is shown, not a gate
 * (self-graded today; note n-j6-first-post 3).
 */
export function postChecks(checks: FirstPostData['checks'], claims: JourneyClaimView[]): { rows: JourneyStatusRow[]; ready: boolean } {
  const backed = claims.filter((c) => c.evidence).length;
  const gates = [
    { label: checks.slop.label, passed: checks.slop.passed },
    { label: `Claims: ${backed} of ${claims.length} backed`, passed: backed === claims.length },
  ];
  const rows = gates.map((g) => ({ label: g.label, value: g.passed ? 'Passed' : 'Blocked', solid: g.passed }));
  return { rows: [...rows, checks.voiceFit], ready: gates.every((g) => g.passed) };
}
