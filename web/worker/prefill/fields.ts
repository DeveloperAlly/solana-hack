// The interview fields the coverage map scores (issue #34; backlog B4, B5, B6). One field is one question of the guided
// interview: the question steps of the Build screen (web/src/screens/build/steps.ts, imported here so the Worker and
// the screen cannot disagree on a key), plus the voice step. Each field says which kit sections read it (kit.ts
// SECTIONS.from, the drafter's inputs) and which kit sections' facts may answer it (the routing allow-list).
// Architecture §4 (input spec per section) and §5 (minimum viable intake):
// https://github.com/DeveloperAlly/solana-hack/blob/main/.agentic/what/context/brand_builder_architecture.md#4-input-spec-per-brand-kit-section
import { STEPS as SCREEN_STEPS } from '../../src/screens/build/steps';
import { GATES, SECTIONS, STEPS, type SectionId } from '../kit';

export type StepId = Exclude<(typeof STEPS)[number], 'basics'>;

export interface FieldSpec {
  /** `${step}.${key}`: the answers row (answers.step) and the key in its data, as the Build screen saves them. */
  id: string;
  step: StepId;
  key: string;
  /** The question as the Build screen asks it. */
  question: string;
  /** Kit sections whose extracted facts may answer this question. A route to any other section's fact is refused. */
  answeredBy: readonly SectionId[];
  /** Optional on the screen ("Optional." hint): asked, but never counted as blocking. */
  optional: boolean;
  /** Owner minutes to answer: the step's minutes in architecture §5, shared between its questions. */
  minutes: number;
  /** Facts can prefill it. The voice step is picked by example (§1 principle 5), never prefilled from a fact. */
  routable: boolean;
}

/**
 * Which kit sections' facts may answer each question. Extraction tags facts with a kit section (extract/schemas.ts),
 * and §4 says where each section is inferred from; a question is answerable by the sections whose content it asks for:
 * origin questions by origin and purpose facts (§4 row 2, "Why does this exist? What was broken?"); the Golden Circle
 * by purpose, positioning and messaging facts (§5 step 3); alternatives and edge by positioning facts (§4 row 5,
 * "What would people use if you didn't exist?" "What can you do that they can't?"); audience by audience facts (§4 row 7).
 */
const ANSWERED_BY: Record<string, readonly SectionId[]> = {
  'origin.why': ['origin', 'purpose'],
  'origin.broken': ['origin', 'purpose'],
  'origin.first_win': ['origin', 'positioning', 'messaging'],
  'golden_circle.what': ['positioning', 'messaging', 'purpose'],
  'golden_circle.how': ['positioning', 'messaging'],
  'golden_circle.why': ['purpose', 'origin', 'messaging'],
  'alternatives.instead': ['positioning'],
  'alternatives.edge': ['positioning', 'messaging'],
  'audience.who': ['audience'],
  'audience.real_people': ['audience'],
};

const stepMinutes = (answerStep: string) => SCREEN_STEPS.find((s) => s.answerStep === answerStep)?.minutes ?? 0;

/** The question fields, in interview order (§12.3 rule 2 order, as the Build screen asks them). */
export const FIELDS: readonly FieldSpec[] = [
  ...SCREEN_STEPS.filter((s) => s.kind === 'questions' && s.questions?.length).flatMap((s) =>
    s.questions!.map((q): FieldSpec => ({
      id: `${s.answerStep}.${q.key}`,
      step: s.answerStep as StepId,
      key: q.key,
      question: q.label,
      answeredBy: ANSWERED_BY[`${s.answerStep}.${q.key}`] ?? [],
      optional: /^Optional\b/.test(q.hint ?? ''),
      minutes: stepMinutes(s.answerStep!) / s.questions!.length,
      routable: true,
    })),
  ),
  // The voice step has no free-text questions: the owner picks a template and sample (§5 step 6, "Voice by example").
  { id: 'voice.template', step: 'voice', key: 'template', question: 'How should it sound? Pick the sample that sounds like you.', answeredBy: ['voice'], optional: false, minutes: stepMinutes('voice'), routable: false },
];

export const FIELD_IDS = FIELDS.map((f) => f.id);
export const ROUTABLE_FIELDS = FIELDS.filter((f) => f.routable);
export const fieldById = (id: string | null | undefined) => FIELDS.find((f) => f.id === id);

/** Kit sections that read a field: the sections whose drafter takes its step as input (kit.ts SECTIONS.from). */
export const readers = (f: Pick<FieldSpec, 'step'>): SectionId[] =>
  (Object.keys(SECTIONS) as SectionId[]).filter((s) => (SECTIONS[s].from as readonly string[]).includes(f.step));

/** The fields a kit section's drafter reads. */
export const sectionFields = (s: SectionId) => FIELDS.filter((f) => (SECTIONS[s].from as readonly string[]).includes(f.step));

/** "Positioning · Gate 2": the kit section label the Journey cards show (web/src/ui/domain/JourneyFactCard.tsx). */
export function sectionLabel(s: string): string {
  if (!(s in SECTIONS)) return s;
  const id = s as SectionId;
  const gate = SECTIONS[id].gate;
  return gate ? `${SECTIONS[id].title} · Gate ${GATES.indexOf(gate) + 1}` : SECTIONS[id].title;
}

/**
 * Words of the brand's own text needed before its voice can be profiled from it: Writer needs at least 300 words
 * (research 02, "Sample sizes for voice extraction"; architecture §4 row 9, "Corpus profiling (needs 300–500+ words)").
 */
export const VOICE_MIN_WORDS = 300;
