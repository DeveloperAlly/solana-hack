// Sample data for Voice-Templates and Voice-Editor (issue #52). Source: wireframe canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Voice-Templates and Voice-Editor, notes n-vt and n-ve
// (text and preset values as drawn; research 06 starter set, values still to calibrate). Backend map rows
// "Voice-Templates" and "Voice-Editor" (.agentic/what/context/backend_map.md §4 Create).
import type { VoiceEditorData, VoiceTemplatesData } from './types';

const t = (id: string, name: string, description: string, values: number[], contentPolicy = false) => ({
  id, name, description, values, claimsGate: values[8], contentPolicy,
});

export const voiceTemplates: VoiceTemplatesData = {
  brand: 'aDNA',
  kitVersion: 'v[n]',
  voices: [
    { id: 'core', name: 'Core', detail: 'Candid/Founder · overrides (roadmap): X, LinkedIn', status: 'Approved at Gate 3' },
    { id: 'replies', name: 'Replies', detail: 'Friendly · overrides (roadmap): X', status: 'Draft' },
    { id: 'docs', name: 'Docs', detail: 'Professional · no overrides', status: 'Draft' },
  ],
  selectedTemplate: 'candid',
  dimensions: ['Formality', 'Energy', 'Humour', 'Warmth', 'Sentence length', 'Jargon', 'Emoji, punctuation', 'Call to action', 'Claims gate'],
  templates: [
    t('academic', 'Academic', 'Formal, calm, serious, long sentences', [5, 1, 1, 2, 5, 4, 1, 1, 5]),
    t('enterprise', 'Enterprise', 'Serious, no emoji, fairly formal', [4, 2, 1, 3, 3, 3, 1, 2, 5]),
    t('professional', 'Professional', 'Serious, no emoji, fairly formal', [4, 2, 1, 3, 3, 2, 1, 2, 4]),
    t('friendly', 'Friendly', 'Warm, plain words', [2, 3, 2, 5, 2, 1, 3, 2, 4]),
    t('plainspoken', 'Plainspoken', 'Plain words, no emoji', [2, 2, 2, 3, 2, 1, 1, 2, 4]),
    t('efficient', 'Efficient', 'Calm, serious, short sentences, no emoji', [3, 1, 1, 2, 1, 2, 1, 2, 4]),
    t('candid', 'Candid/Founder', 'No emoji', [2, 3, 2, 3, 2, 2, 1, 3, 4]),
    t('playful', 'Playful', 'Casual, funny, plain words, fairly excited', [1, 4, 5, 4, 2, 1, 4, 2, 3]),
    t('flirty', 'Flirty', 'Casual, warm, short sentences, plain words', [1, 4, 4, 5, 1, 1, 4, 2, 4], true),
    t('sales', 'Sales', 'Hard sell, fairly excited', [3, 4, 2, 3, 2, 2, 2, 5, 5]),
    t('hype', 'Hype/Launch', 'Excited, short sentences, fairly lots of emoji, fairly hard sell', [2, 5, 3, 3, 1, 2, 4, 4, 4]),
    t('support', 'Empathetic/Support', 'Serious, warm, plain words, no emoji', [3, 2, 1, 5, 2, 1, 1, 1, 4]),
  ],
  matrixCaption: 'Preset values, 1 = left end, 5 = right end. Source: research 06 starter set; values still to calibrate.',
  flirtyNote: '* Flirty: suggestive, never explicit. It sits behind a content-policy gate (no sexual content, no minors, no explicit language) and its samples are safe for work.',
};

/** Empty state (n-vt STATES): only the core voice from Gate 3. */
export const voiceTemplatesEmpty: VoiceTemplatesData = { ...voiceTemplates, voices: voiceTemplates.voices.slice(0, 1) };

const candid = { formality: 2, energy: 3, humour: 2, warmth: 3, sentence: 2, jargon: 2, emoji: 1, cta: 3 };

export const voiceEditor: VoiceEditorData = {
  name: 'Core voice',
  basedOn: 'Candid/Founder',
  intro: 'Based on Candid/Founder. Approved at Gate 3 of kit v[n]; changes here create a new kit version.',
  dimensions: [
    { id: 'formality', legend: 'Formality', start: 'Casual', end: 'Formal' },
    { id: 'energy', legend: 'Energy', start: 'Calm', end: 'Excited' },
    { id: 'humour', legend: 'Humour', start: 'Serious', end: 'Funny' },
    { id: 'warmth', legend: 'Warmth', start: 'Distant', end: 'Warm' },
    { id: 'sentence', legend: 'Sentence length', start: 'Short', end: 'Long' },
    { id: 'jargon', legend: 'Jargon', start: 'Plain', end: 'Technical' },
    { id: 'emoji', legend: 'Emoji, punctuation', start: 'None', end: 'Lots' },
    { id: 'cta', legend: 'Call to action', start: 'Soft', end: 'Hard' },
  ],
  preset: candid,
  values: candid,
  claimsLevel: 'strictness 4 of 5',
  claimsRules: [
    { id: 'approved', label: 'Numbers and comparisons only from approved claims', offRule: 'Numbers may come from outside the approved claims.' },
    { id: 'promises', label: 'No promises of outcomes', offRule: 'Outcome promises allowed.' },
    { id: 'competitors', label: 'May name competitors', offRule: 'No competitor names.' },
    { id: 'evidence', label: 'Every number links to its evidence', offRule: 'Numbers need no evidence link.' },
  ],
  claimsChecked: ['approved', 'promises', 'evidence'],
  overrides: [
    { channel: 'X', overrides: 'Sentence length 1 · Emoji, punctuation 2', action: 'Edit' },
    { channel: 'LinkedIn', overrides: 'Formality 3 · Call to action 2', action: 'Edit' },
    { channel: 'Blog', overrides: 'None (uses the voice as set)', action: 'Add' },
  ],
  previewNote: 'Same brief, this voice, on X',
  samples: ['[Sample post written at these settings]', '[Sample post for another brief, written at these settings]'],
};
