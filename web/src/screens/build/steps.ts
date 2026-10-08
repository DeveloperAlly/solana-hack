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

// Research 06 starter set (1-5). Fo formality, En energy, Hu humour, Wa warmth, SL sentence length, Ja jargon,
// Em emoji and punctuation, CTA call-to-action strength, Cl claims strictness (a gate, not a slider).
export const VOICE_TEMPLATES = [
  { value: 'academic', label: 'Academic', v: [5, 1, 1, 2, 5, 4, 1, 1, 5] },
  { value: 'enterprise', label: 'Enterprise', v: [4, 2, 1, 3, 3, 3, 1, 2, 5] },
  { value: 'professional', label: 'Professional', v: [4, 2, 1, 3, 3, 2, 1, 2, 4] },
  { value: 'friendly', label: 'Friendly', v: [2, 3, 2, 5, 2, 1, 3, 2, 4] },
  { value: 'plainspoken', label: 'Plainspoken', v: [2, 2, 2, 3, 2, 1, 1, 2, 4] },
  { value: 'efficient', label: 'Efficient', v: [3, 1, 1, 2, 1, 2, 1, 2, 4] },
  { value: 'candid_founder', label: 'Candid founder', v: [2, 3, 2, 3, 2, 2, 1, 3, 4] },
  { value: 'playful', label: 'Playful', v: [1, 4, 5, 4, 2, 1, 4, 2, 3] },
  { value: 'flirty', label: 'Flirty (suggestive, never explicit)', v: [1, 4, 4, 5, 1, 1, 4, 2, 4] },
  { value: 'sales', label: 'Sales', v: [3, 4, 2, 3, 2, 2, 2, 5, 5] },
  { value: 'hype_launch', label: 'Hype or launch', v: [2, 5, 3, 3, 1, 2, 4, 4, 4] },
  { value: 'empathetic_support', label: 'Empathetic or support', v: [3, 2, 1, 5, 2, 1, 1, 1, 4] },
];
export const DIALS = [
  { key: 'formality', label: 'Formality', low: 'Casual', high: 'Formal' },
  { key: 'energy', label: 'Energy', low: 'Calm', high: 'Excited' },
  { key: 'humour', label: 'Humour', low: 'Serious', high: 'Funny' },
  { key: 'warmth', label: 'Warmth', low: 'Reserved', high: 'Warm' },
  { key: 'sentence_length', label: 'Sentence length', low: 'Short', high: 'Long' },
  { key: 'jargon', label: 'Jargon', low: 'Plain words', high: 'Technical' },
  { key: 'emoji', label: 'Emoji and punctuation', low: 'None', high: 'Lots' },
  { key: 'cta', label: 'Call to action', low: 'Soft', high: 'Direct' },
];
export const CLAIMS_GATE = [
  { value: '5', label: 'Strict: every claim needs evidence' },
  { value: '4', label: 'Standard: factual claims need evidence' },
  { value: '3', label: 'Light: opinions fine, numbers need evidence' },
];
/** Dial values for a template, as the strings the answer form stores. */
export function templateDials(value: string): Record<string, string> {
  const t = VOICE_TEMPLATES.find((x) => x.value === value) ?? VOICE_TEMPLATES[6];
  const out: Record<string, string> = { template: t.value, claims: String(t.v[8]) };
  DIALS.forEach((d, i) => (out[d.key] = String(t.v[i])));
  return out;
}

// Templates from the first voice form that no longer exist, mapped to their closest research 06 template.
const LEGACY_TEMPLATES: Record<string, string> = { friendly_expert: 'friendly' };

/**
 * A saved voice answer, completed against today's form: a known template (legacy ones mapped), every dial and
 * the claims gate filled from that template unless the owner set them, and the sample kept. Nothing shown is unsaved.
 */
export function normaliseVoice(saved?: Record<string, string> | null): Record<string, string> {
  const raw = saved ?? {};
  const mapped = LEGACY_TEMPLATES[raw.template] ?? raw.template;
  const template = VOICE_TEMPLATES.some((t) => t.value === mapped) ? mapped : 'candid_founder';
  const out = templateDials(template);
  const valid = (v: unknown) => typeof v === 'string' && /^[1-5]$/.test(v);
  for (const d of DIALS) if (valid(raw[d.key])) out[d.key] = raw[d.key];
  if (CLAIMS_GATE.some((c) => c.value === raw.claims)) out.claims = raw.claims;
  if (raw.sample) out.sample = raw.sample;
  return out;
}
