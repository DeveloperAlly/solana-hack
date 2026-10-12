// Voice templates: the one definition, read by the Worker (voice by example, journey J4) and re-exported to the web app
// (screens/build/steps.ts). Research 06 starter set, values 1-5 in this order: Fo formality, En energy, Hu humour,
// Wa warmth, SL sentence length, Ja jargon, Em emoji and punctuation, CTA call-to-action strength, Cl claims strictness
// (a gate, not a slider). ADR-010 decision 5: 9 dimensions.
export interface VoiceTemplate { value: string; label: string; v: number[] }

export const VOICE_TEMPLATES: VoiceTemplate[] = [
  { value: 'academic', label: 'Academic', v: [5, 1, 1, 2, 5, 4, 1, 1, 5] },
  { value: 'enterprise', label: 'Enterprise', v: [4, 2, 1, 3, 3, 3, 1, 2, 5] },
  { value: 'professional', label: 'Professional', v: [4, 2, 1, 3, 3, 2, 1, 2, 4] },
  { value: 'friendly', label: 'Friendly', v: [2, 3, 2, 5, 2, 1, 3, 2, 4] },
  { value: 'plainspoken', label: 'Plainspoken', v: [2, 2, 2, 3, 2, 1, 1, 2, 4] },
  { value: 'efficient', label: 'Efficient', v: [3, 3, 1, 2, 1, 2, 1, 2, 4] },
  { value: 'candid_founder', label: 'Candid founder', v: [2, 3, 2, 3, 2, 2, 1, 3, 4] },
  { value: 'playful', label: 'Playful', v: [1, 4, 5, 4, 2, 1, 4, 2, 3] },
  { value: 'flirty', label: 'Flirty (suggestive, never explicit)', v: [1, 4, 4, 5, 1, 1, 4, 2, 4] },
  { value: 'sales', label: 'Sales', v: [3, 4, 2, 3, 2, 2, 2, 5, 5] },
  { value: 'hype_launch', label: 'Hype or launch', v: [2, 5, 3, 3, 1, 2, 4, 4, 4] },
  { value: 'empathetic_support', label: 'Empathetic or support', v: [3, 2, 1, 5, 2, 1, 1, 1, 4] },
];

export type VoiceTemplateId = string;
export const DIAL_KEYS = ['formality', 'energy', 'humour', 'warmth', 'sentence_length', 'jargon', 'emoji', 'cta'] as const;

export const templateById = (id: string) => VOICE_TEMPLATES.find((t) => t.value === id);

/** Squared distance over the 8 dials (the claims gate is a gate, not a style, so it is left out). */
export function dialDistance(a: readonly number[], b: readonly number[]) {
  let d = 0;
  for (let i = 0; i < DIAL_KEYS.length; i++) d += (a[i] - b[i]) ** 2;
  return d;
}

/** The template itself and its two nearest neighbours: round 2 of voice by example refines around the round 1 pick. */
export function nearestTemplates(id: string, n = 3): VoiceTemplateId[] {
  const t = templateById(id);
  if (!t) throw new Error(`unknown voice template ${id}`);
  return [...VOICE_TEMPLATES].sort((x, y) => dialDistance(t.v, x.v) - dialDistance(t.v, y.v)).slice(0, n).map((x) => x.value);
}

/**
 * Three templates as far apart on the dials as possible (greedy farthest-point from a neutral start): round 1 of voice
 * by example. Chosen here, not by the model, so the offer is always three valid, clearly different templates.
 */
export function contrastingTemplates(n = 3, start = 'plainspoken'): VoiceTemplateId[] {
  const first = templateById(start) ?? VOICE_TEMPLATES[0];
  const picked = [first];
  while (picked.length < n) {
    let best = VOICE_TEMPLATES[0], bestD = -1;
    for (const t of VOICE_TEMPLATES) {
      if (picked.includes(t)) continue;
      const d = Math.min(...picked.map((p) => dialDistance(p.v, t.v)));
      if (d > bestD) { bestD = d; best = t; }
    }
    picked.push(best);
  }
  return picked.map((t) => t.value);
}

/** The answer the Voice step saves for a template: template, its 8 dials and its claims gate (kitPolicy reads these). */
export function voiceAnswerFor(id: string): Record<string, string> {
  const t = templateById(id);
  if (!t) throw new Error(`unknown voice template ${id}`);
  const data: Record<string, string> = { template: t.value, claims: String(t.v[8]) };
  DIAL_KEYS.forEach((k, i) => { data[k] = String(t.v[i]); });
  return data;
}
