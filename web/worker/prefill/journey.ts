// The Journey screens' data from the rows GET /api/brands/:id already reads (issue #34). Pure: the caller passes the
// brand's rows (brand, answers, sources, evidence; plus open fact_conflicts and the runs still reading its sources) and
// gets PR #75's shapes back (prefill/contract.ts): ReadData for J1-Read, ConfirmData for J3-Confirm, and J4's gap
// questions. Facts are shown through fact extraction's one mapping (extract/journey.ts factView, conflictView), and
// coverage through the one coverage map (prefill/coverage.ts), so there is no second rule for either.
import { VOICE_TEMPLATES } from '../../src/screens/build/steps';
import { SECTIONS } from '../kit';
import { conflictView, factView, openConflictIds, sectionLabel, sourceLabel, type ConflictRow, type EvidenceRow, type SourceRow } from '../extract/journey';
import type { ConfirmData, GapsVoiceData, JourneyFact, JourneySource, ReadData, SourceStatus } from './contract';
import { compareFacts, coverageMap, journeyCoverage, type CoverageAnswer, type CoverageFact, type CoverageMap, type GapQuestion } from './coverage';
import { fieldById } from './fields';

export interface JourneySourceRow { id: string; url: string | null; title: string | null; status: string; error?: string | null }
/** A run working on a source: runs.input.sourceId names it (engine/api.ts KINDS). */
export interface JourneyRun { status: string; progress?: { message?: string | null } | null; input?: { sourceId?: unknown } | null }
export interface JourneyState {
  brand: { name: string; website: string | null };
  answers: CoverageAnswer[];
  sources: JourneySourceRow[];
  evidence: (CoverageFact & EvidenceRow)[];
  conflicts: ConflictRow[];
  runs: JourneyRun[];
}

/** An open conflict on J3: the question, and each side with its own quote and page (extract/journey.ts ConflictView). */
export interface JourneyConflict { question: JourneyFact; sides: JourneyFact[] }
/** ConfirmData plus the conflicts: the one addition to PR #75's types this needs (proposed on #75), because
 * JourneyFact carries one quote and a conflict needs every side's. */
export type ConfirmDataWithConflicts = ConfirmData & { conflicts: JourneyConflict[] };

const host = (u: string | null | undefined) => {
  try { return u ? new URL(u.includes('://') ? u : `https://${u}`).hostname.replace(/^www\./, '') : ''; } catch { return ''; }
};

/**
 * A source row's state as J1 shows it (SourceStatus, PR #75 types.ts):
 * - sources.status 'read' -> 'read';
 * - 'failed' -> 'blocked', with the reason the reader gave (sources.error: robots.txt, unreadable, too large);
 * - 'pending' with its run 'running' -> 'reading'; with its run 'paused' (the model's daily limit, engine/runner.ts) ->
 *   'queued', with the run's message saying until when; with no run (yet) -> 'queued'.
 * 'skipped' is never produced: a source is read or blocked, and the pages a site read passes over are not stored.
 */
export function sourceStatus(s: JourneySourceRow, run?: JourneyRun): { status: SourceStatus; reason?: string } {
  if (s.status === 'read') return { status: 'read' };
  if (s.status === 'failed') return { status: 'blocked', reason: s.error || 'it could not be read' };
  if (run?.status === 'running') return { status: 'reading' };
  const why = run?.status === 'paused' ? run.progress?.message : null;
  return { status: 'queued', ...(why ? { reason: why } : {}) };
}

const isOwnerRow = (e: CoverageFact) => e.trust === 'owner_answer' || e.origin === 'owner_answer';

/** J1's list: each source with its state and, once read, how many facts were found on it. */
export function journeySources(state: Pick<JourneyState, 'sources' | 'runs' | 'evidence'>): JourneySource[] {
  return state.sources.map((s) => {
    const run = state.runs.find((r) => r.input?.sourceId === s.id);
    const { status, reason } = sourceStatus(s, run);
    const label = sourceLabel(s.url, null)?.label.replace(/ · home page$/, '') ?? (s.title || 'Text you added');
    const facts = status === 'read' ? state.evidence.filter((e) => e.source_id === s.id && e.review_status !== 'rejected' && !isOwnerRow(e)).length : undefined;
    return { id: s.id, label, status, ...(facts !== undefined ? { facts } : {}), ...(reason ? { reason } : {}) };
  });
}

interface Built { map: CoverageMap; sources: Map<string, SourceRow>; open: Set<string>; conflicts: JourneyConflict[]; read: (CoverageFact & EvidenceRow)[] }

function build(state: JourneyState): Built {
  const map = coverageMap(state);
  const sources = new Map<string, SourceRow>(state.sources.map((s) => [s.id, { id: s.id, url: s.url, title: s.title }]));
  const open = openConflictIds(state.conflicts);
  const conflicts = state.conflicts.map((c) => conflictView(c, state.evidence, sources)).filter((v): v is JourneyConflict => v !== null);
  // Facts read from a source and not rejected, best first (coverage.ts compareFacts).
  const read = state.evidence.filter((e) => !isOwnerRow(e) && e.review_status !== 'rejected').sort(compareFacts(open));
  return { map, sources, open, conflicts, read };
}

const view = (b: Built, e: EvidenceRow) => factView(e, b.sources, b.open)!;

/** J1-Read: sources with their state, every fact read (disputed ones as needs-you), and coverage. */
export function readData(state: JourneyState): ReadData {
  const b = build(state);
  return {
    site: host(state.brand.website) || host(state.sources.find((s) => s.url)?.url) || '',
    sources: journeySources(state),
    facts: b.read.map((e) => view(b, e)),
    coverage: journeyCoverage(b.map),
  };
}

export const timeLeft = (minutes: number) => (minutes <= 0 ? 'no questions left' : `about ${Math.ceil(minutes)} ${Math.ceil(minutes) === 1 ? 'minute' : 'minutes'}`);

/**
 * Shown under the cards. The kit drafts 6 sections (kit.ts); the other 11 of the 17 in architecture §4 come later and
 * do not block kit v1 (audit 2026-10-12, owner decision D2, proposed: show the 6, with the other 11 as "later").
 */
export const DEFERRED_NOTE = 'The other 11 kit sections (values, visual kit, examples and others) come later in Brand › Kit. They do not block kit v1.';

/**
 * J3-Confirm. The cards are what the owner decides: every fact waiting for review (third-party, or located fuzzily),
 * and the best fact of each kit section to confirm. Disputed facts are not cards but conflicts, each with every side.
 * Five minutes of owner time to kit v1 (#34) rules out a card per fact; a section's other facts stay usable without one.
 */
export function confirmData(state: JourneyState): ConfirmDataWithConflicts {
  const b = build(state);
  // Voice facts (any live status, quoted, not disputed). The best one is the voice item; any other that waits for the
  // owner's review is a card, so every proposed voice fact has an accept / reject path (PR #101 review).
  const voiceField = b.map.fields.find((f) => f.id === 'voice.template')!;
  const voiceFacts = b.read.filter((e) => e.section === 'voice' && !!e.quote && !b.open.has(e.id));
  const voiceItem = voiceField.answer ? undefined : voiceFacts[0];
  const cards: JourneyFact[] = [];
  const seen = new Set<string>();
  // In kit section order (kit.ts SECTIONS, the order the kit is read in), best fact first within a section.
  const order = Object.keys(SECTIONS);
  const bySection = [...b.read].sort((x, y) => order.indexOf(x.section) - order.indexOf(y.section));
  for (const e of bySection) {
    if (b.open.has(e.id) || !e.quote || e.id === voiceItem?.id) continue;
    const waiting = e.review_status === 'proposed';
    if (e.section === 'voice' && !waiting) continue;
    if (!waiting && seen.has(e.section)) continue;
    if (!waiting) seen.add(e.section);
    cards.push(view(b, e));
  }
  let voice: JourneyFact;
  if (voiceField.answer) {
    const t = VOICE_TEMPLATES.find((x) => x.value === voiceField.answer);
    voice = { id: 'voice', section: sectionLabel('voice'), status: 'found', statement: `Your voice: ${t?.label ?? voiceField.answer}.`, note: 'Picked by you.' };
  } else if (voiceItem) {
    // The fact itself (its id, quote and page), so the owner accepts or rejects it with the same decision route as any
    // card; partly found, because the voice is still picked by example next. A note on why it waits is kept.
    const v = view(b, voiceItem);
    const next = "You'll pick the paragraph that sounds right next.";
    voice = { ...v, status: 'partly', note: v.note ? `${v.note} ${next}` : `Read from your pages. ${next}` };
  } else {
    voice = { id: 'voice', section: sectionLabel('voice'), status: 'needs-you', statement: 'Nothing in your sources says how you sound yet.', note: "You'll pick from sample paragraphs next." };
  }
  const asked = b.map.questions.filter((q) => q.kind === 'missing' && !q.optional);
  const labels = [...new Set(asked.flatMap((q) => q.sections).map((s) => SECTIONS[s].title))];
  const missing: JourneyFact = asked.length
    ? { id: 'missing', section: labels.join(' · '), status: 'needs-you', statement: `Nothing in your sources answers ${asked.length === 1 ? 'this' : 'these'} yet: ${asked.map((q) => q.question).join(' ')}`, note: `${asked.length} short ${asked.length === 1 ? 'question' : 'questions'} next.` }
    : { id: 'missing', section: 'Kit', status: 'found', statement: 'Your sources answer every question kit v1 needs.', note: b.conflicts.length ? 'Only the disagreements are left.' : 'No questions left.' };
  return { facts: cards, voice, missing, readinessBase: b.map.percent, questionsLeft: b.map.questionsLeft, timeLeft: timeLeft(b.map.minutesLeft), deferredNote: DEFERRED_NOTE, conflicts: b.conflicts };
}

/** J4's gap questions: GapsVoiceData without the voice rounds (the voice samples route writes those), plus the ranked list. */
export type GapsData = Omit<GapsVoiceData, 'voice'> & { questions: GapQuestion[] };

export function gapsData(state: JourneyState, today: string): GapsData {
  const b = build(state);
  const q = (id: string) => fieldById(id)!.question;
  return {
    brandName: state.brand.name,
    alternatives: {
      question: `What do people use instead of ${state.brand.name} today?`,
      // Options come from competitor research (§4 row 5 zero-data fallback; backlog B2, #35), not built yet: none are invented.
      hint: 'Name what people use instead today, or add your own.',
      options: [],
      source: 'Source: your own answer.',
    },
    edgeQuestion: q('alternatives.edge'),
    originQuestion: q('origin.why'),
    originNote: `Saved as evidence: "owner answer, ${today}".`,
    questions: b.map.questions,
  };
}
