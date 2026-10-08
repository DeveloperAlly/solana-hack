import { describe, expect, it } from 'vitest';
import { DIALS, normaliseVoice, templateDials } from './steps';

describe('voice answers from the older form', () => {
  it('maps a removed template and fills the new dials and claims gate', () => {
    const v = normaliseVoice({ template: 'friendly_expert', formality: '2', energy: '4', humour: '1', sample: 'We ship weekly.' });
    expect(v.template).toBe('friendly');
    expect(v).toMatchObject({ formality: '2', energy: '4', humour: '1', sample: 'We ship weekly.' });
    for (const d of DIALS) expect(v[d.key]).toMatch(/^[1-5]$/);
    expect(v.claims).toBe(templateDials('friendly').claims);
  });
  it('defaults an empty or unknown answer to the candid founder template', () => {
    expect(normaliseVoice(undefined)).toEqual(templateDials('candid_founder'));
    expect(normaliseVoice({ template: 'nope', formality: '9' }).formality).toBe(templateDials('candid_founder').formality);
  });
  it('keeps a current answer as saved', () => {
    const saved = { ...templateDials('sales'), warmth: '1', claims: '3' };
    expect(normaliseVoice(saved)).toEqual(saved);
  });
});
