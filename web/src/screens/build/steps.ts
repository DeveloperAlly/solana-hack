// Intake order follows architecture §5 (minimum viable intake), with each AI draft placed right after the
// answers it needs, and the three gates (purpose, positioning, voice) where §5 puts them.
export type StepKind = 'basics' | 'sources' | 'questions' | 'section' | 'kit';
export interface Question { key: string; label: string; hint?: string; multiline?: boolean }
export interface Step {
  slug: string;
  title: string;
  kind: StepKind;
  minutes?: number;
  answerStep?: string; // answers.step for kind 'questions'
  questions?: Question[];
  section?: string; // kit section for kind 'section'
  gate?: 'purpose' | 'positioning' | 'voice';
  intro?: string;
}

export const STEPS: Step[] = [
  { slug: 'basics', title: 'Basics', kind: 'basics', minutes: 2, intro: 'Name, what it is, and where you want it in a year.' },
  { slug: 'sources', title: 'Your links', kind: 'sources', minutes: 1, intro: 'Add your site or any page about you. We read it first, so we only ask what is missing.' },
  {
    slug: 'origin', title: 'Origin', kind: 'questions', answerStep: 'origin', minutes: 3,
    questions: [
      { key: 'why', label: 'Why does it exist?', multiline: true },
      { key: 'broken', label: 'What was broken before?', multiline: true },
      { key: 'first_win', label: 'What was the first win or proof point?', multiline: true },
    ],
  },
  {
    slug: 'golden-circle', title: 'Why, how, what', kind: 'questions', answerStep: 'golden_circle', minutes: 2,
    questions: [
      { key: 'what', label: 'What do you do?', multiline: true },
      { key: 'how', label: 'How do you do it differently?', multiline: true },
      { key: 'why', label: 'Why does it matter?', multiline: true },
    ],
  },
  { slug: 'purpose', title: 'Gate 1: purpose', kind: 'section', section: 'purpose', gate: 'purpose' },
  {
    slug: 'alternatives', title: 'Alternatives', kind: 'questions', answerStep: 'alternatives', minutes: 3,
    questions: [
      { key: 'instead', label: 'What do people use instead of you today?', multiline: true },
      { key: 'edge', label: 'What can only you do?', multiline: true },
    ],
  },
  { slug: 'positioning', title: 'Gate 2: positioning', kind: 'section', section: 'positioning', gate: 'positioning' },
  {
    slug: 'audience', title: 'Audience', kind: 'questions', answerStep: 'audience', minutes: 2,
    questions: [
      { key: 'who', label: 'Whose opinion matters most?', multiline: true },
      { key: 'real_people', label: 'Name 1 to 3 real people or roles, if any', hint: 'Optional. Without them, personas are labelled as assumptions.', multiline: true },
    ],
  },
  { slug: 'audience-draft', title: 'Audience draft', kind: 'section', section: 'audience' },
  { slug: 'voice', title: 'Voice', kind: 'questions', answerStep: 'voice', minutes: 3 },
  { slug: 'voice-gate', title: 'Gate 3: voice', kind: 'section', section: 'voice', gate: 'voice' },
  { slug: 'origin-draft', title: 'Origin story', kind: 'section', section: 'origin' },
  { slug: 'messaging', title: 'Messaging', kind: 'section', section: 'messaging' },
  { slug: 'kit', title: 'Kit v1', kind: 'kit' },
];

export const VOICE_TEMPLATES = [
  { value: 'professional', label: 'Professional' },
  { value: 'candid_founder', label: 'Candid founder' },
  { value: 'friendly_expert', label: 'Friendly expert' },
  { value: 'playful', label: 'Playful' },
];
export const DIALS = [
  { key: 'formality', label: 'Formality', low: 'Casual', high: 'Formal' },
  { key: 'energy', label: 'Energy', low: 'Calm', high: 'Excited' },
  { key: 'humour', label: 'Humour', low: 'Serious', high: 'Funny' },
];
