// Sample data for BB-Gate3-Voice. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-Gate3-Voice
// (note n-g3; dimension values Warmth 3, Sentence length 2, Jargon 2, Emoji and punctuation 1, CTA intensity 3); issue #50;
// backend map §4, row "Gate 1, Gate 2, Gate 3".
import type { GateVoiceData } from './types';
import { jamjamBrand } from './shared.fixtures';
import { voiceTemplates } from './BB-6-Voice.fixtures';

export const gateVoiceData: GateVoiceData = {
  brand: jamjamBrand,
  templates: voiceTemplates,
  otherDimensions: [
    { name: 'Warmth', value: 3 },
    { name: 'Sentence length', value: 2 },
    { name: 'Jargon', value: 2 },
    { name: 'Emoji, punctuation', value: 1 },
    { name: 'CTA intensity', value: 3 },
  ],
  sample: '[Sample paragraph generated at these settings]',
  strictness: 'strictness 4 of 5',
  claims: [
    { id: 'evidence', label: 'Numbers and comparisons only with linked evidence', checked: true },
    { id: 'outcomes', label: 'No promises of outcomes', checked: true },
    { id: 'competitors', label: 'May name competitors', checked: false },
  ],
};
