// The interview fields the coverage map scores (issue #34; backlog B4, B5, B6). One field is one question of the guided
// interview: the question steps of the Build screen (web/src/screens/build/steps.ts, imported here so the Worker and
// the screen cannot disagree on a key), plus the voice step. Each field says which kit sections read it (kit.ts
// SECTIONS.from, the drafter's inputs) and which kit sections' facts can stand in for its answer.
// Architecture §4 (input spec per section) and §5 (minimum viable intake):
// https://github.com/DeveloperAlly/solana-hack/blob/main/.agentic/what/context/brand_builder_architecture.md#4-input-spec-per-brand-kit-section
import { STEPS as SCREEN_STEPS } from '../../src/screens/build/steps';
import { SECTIONS, STEPS, type SectionId } from '../kit';

export type StepId = Exclude<(typeof STEPS)[number], 'basics'>;

export interface FieldSpec {
  /** `${step}.${key}`: the answers row (answers.step) and the key in its data, as the Build screen saves them. */
  id: string;
  step: StepId;
  key: string;
  /** The question as the Build screen asks it. */
  question: string;
  /** Kit sections whose facts stand in for an answer until the owner gives one (empty: only the owner can answer). */
  answeredBy: readonly SectionId[];
  /** The kit section this question asks for (§5: origin; Golden Circle why -> purpose, what and how -> positioning;
   * alternatives and edge -> positioning; audience; voice). An answer to it is a direct owner answer for that section
   * (§12.3 rule 1). Messaging has no question of its own: §5 drafts it from the others. */
  asks: SectionId;
  /** Optional on the screen ("Optional." hint): asked, but never counted as blocking. */
  optional: boolean;
  /** Owner minutes to answer: the step's minutes in architecture §5, shared between its questions. */
  minutes: number;
  /** An interview question with a text answer. The voice step is picked by example instead (§1 principle 5). */
  textAnswer: boolean;
}

/**
 * Which kit sections' facts stand in for each question until the owner answers it, following the "Infer from" and
 * "Ask (only if missing)" columns of §4:
 * - origin questions: origin facts, and purpose facts for "why" (§4 row 2 asks "Why does this exist? What was broken?");
 * - the Golden Circle: positioning and messaging facts for what and how, purpose facts for why (§5 step 3);
 * - "What can only you do?": positioning facts (§4 row 5, inferred from the site hero and comparison pages);
 * - "Whose opinion matters most?": audience facts (§4 row 7, inferred from site copy).
 * Two questions are never inferred: "What do people use instead of you?" (§4 row 5: when it is not answered, competitor
 * research drafts the options, backlog B2 and #35; the brand's own positioning copy is not an answer to it) and "Name 1
 * to 3 real people" (§4 row 7: real customers or fans come from the owner; without them personas are assumptions).
 */
const ANSWERED_BY: Record<string, readonly SectionId[]> = {
  'origin.why': ['origin', 'purpose'],
  'origin.broken': ['origin'],
  'origin.first_win': ['origin'],
  'golden_circle.what': ['positioning', 'messaging'],
  'golden_circle.how': ['positioning'],
  'golden_circle.why': ['purpose'],
  'alternatives.instead': [],
  'alternatives.edge': ['positioning'],
  'audience.who': ['audience'],
  'audience.real_people': [],
};

const ASKS: Record<string, SectionId> = {
  'origin.why': 'origin', 'origin.broken': 'origin', 'origin.first_win': 'origin',
  'golden_circle.what': 'positioning', 'golden_circle.how': 'positioning', 'golden_circle.why': 'purpose',
  'alternatives.instead': 'positioning', 'alternatives.edge': 'positioning',
  'audience.who': 'audience', 'audience.real_people': 'audience',
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
      asks: ASKS[`${s.answerStep}.${q.key}`] ?? 'messaging',
      optional: /^Optional\b/.test(q.hint ?? ''),
      minutes: stepMinutes(s.answerStep!) / s.questions!.length,
      textAnswer: true,
    })),
  ),
  // The voice step has no free-text questions: the owner picks a template and sample (§5 step 6, "Voice by example").
  { id: 'voice.template', step: 'voice', key: 'template', question: 'How should it sound? Pick the sample that sounds like you.', answeredBy: ['voice'], asks: 'voice', optional: false, minutes: stepMinutes('voice'), textAnswer: false },
];

export const TEXT_FIELDS = FIELDS.filter((f) => f.textAnswer);
export const fieldById = (id: string | null | undefined) => FIELDS.find((f) => f.id === id);

/** Kit sections that read a field: the sections whose drafter takes its step as input (kit.ts SECTIONS.from). */
export const readers = (f: Pick<FieldSpec, 'step'>): SectionId[] =>
  (Object.keys(SECTIONS) as SectionId[]).filter((s) => (SECTIONS[s].from as readonly string[]).includes(f.step));

/** The fields a kit section's drafter reads. */
export const sectionFields = (s: SectionId) => FIELDS.filter((f) => (SECTIONS[s].from as readonly string[]).includes(f.step));

/**
 * The questions a kit section's state is aggregated from: those that ask for it (asks). Messaging has none of its own
 * (§5 drafts it from the others), so it is aggregated from the questions its drafter reads (kit.ts SECTIONS.from).
 * Optional questions never hold a section back.
 */
export function sectionQuestions(s: SectionId): FieldSpec[] {
  const asking = FIELDS.filter((f) => f.asks === s);
  return (asking.length ? asking : sectionFields(s)).filter((f) => !f.optional);
}
