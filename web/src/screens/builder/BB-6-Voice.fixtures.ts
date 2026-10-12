// Sample data for BB-6-Voice. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-6-Voice (note n-bb6);
// issue #50; backend map §4, row "BB-2 to BB-6". Round 2 after B is the canvas text; round 2 after A or C is not drawn, so it
// follows the same bracketed pattern. Templates: Professional, Candid/Founder, Playful (canvas round 1 labels).
import type { ChoiceCardOption, DialSpec, VoiceData } from './types';
import { jamjamBrand } from './shared.fixtures';

const sample = (value: string, text: string): ChoiceCardOption => ({ value, title: value, body: `[${text}]` });
const narrowed = (template: string) => [
  sample('A', `Sample paragraph, ${template}, less formal`),
  sample('B', `Sample paragraph, ${template}, more energy`),
  sample('C', `Sample paragraph, ${template}, drier humour`),
];

export const voiceDials: DialSpec[] = [
  { key: 'formality', legend: 'Formality', low: 'Casual', high: 'Formal' },
  { key: 'energy', legend: 'Energy', low: 'Calm', high: 'Excited' },
  { key: 'humour', legend: 'Humour', low: 'Serious', high: 'Funny' },
];

export const voiceTemplates: Record<string, string> = { A: 'Professional', B: 'Candid/Founder', C: 'Playful' };

export const voiceData: VoiceData = {
  brand: jamjamBrand,
  round1: [
    sample('A', 'Sample paragraph written at Professional settings'),
    sample('B', 'Sample paragraph written at Candid/Founder settings'),
    sample('C', 'Sample paragraph written at Playful settings'),
  ],
  round2: { A: narrowed('Professional'), B: narrowed('Candid/Founder'), C: narrowed('Playful') },
  templates: voiceTemplates,
  dials: voiceDials,
};
