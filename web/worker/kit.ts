// Kit sections built in the hackathon spine (architecture §4, §5). Gates per §5: purpose, positioning, voice.
export const SECTIONS = {
  origin: { title: 'Origin story', gate: null, from: ['basics', 'origin'] },
  purpose: { title: 'Purpose', gate: 'purpose', from: ['basics', 'origin', 'golden_circle'] },
  positioning: { title: 'Positioning', gate: 'positioning', from: ['basics', 'golden_circle', 'alternatives'] },
  audience: { title: 'Audience', gate: null, from: ['basics', 'audience'] },
  voice: { title: 'Voice', gate: 'voice', from: ['basics', 'voice'] },
  messaging: { title: 'Messaging', gate: null, from: ['basics', 'golden_circle', 'alternatives', 'audience', 'voice'] },
} as const;
export type SectionId = keyof typeof SECTIONS;
export const isSection = (s: string): s is SectionId => s in SECTIONS;
export const GATES = ['purpose', 'positioning', 'voice'] as const;
export const STEPS = ['basics', 'origin', 'golden_circle', 'alternatives', 'audience', 'voice'] as const;

export const SECTION_GUIDE: Record<SectionId, string> = {
  origin: 'Why the brand exists: what was broken, what happened, the first win. 80-120 words, first person plural or founder voice as the answers suggest.',
  purpose: 'One purpose statement (one sentence, why the brand exists beyond money), then 2-3 sentences explaining it. Golden Circle "why".',
  positioning: 'A positioning statement: for [audience] who [need], [brand] is the [category] that [difference], unlike [alternative]. Then 2-3 bullet points of proof or edge.',
  audience: 'Primary audience in 2-3 sentences, then 1-2 proto personas (name a role, not a fake person), each labelled "Assumption" unless an answer names a real person.',
  voice: 'Voice summary in 2 sentences, then the dial settings as given (formality, energy, humour 1-5), then 3 "we say / we avoid" pairs.',
  messaging: 'A one-line tagline, a 25-word description, and 3 key messages, each one sentence.',
};

/** Stable JSON (sorted keys) so the same kit always hashes the same. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}
