import { describe, expect, it } from 'vitest';
import { applyBrandEntry, effectiveGates, openGates, pendingGates, recordDecision, type FlowState } from './useBuilderFlow';

describe('brand entry reducer', () => {
  it('resets verification when the domain changes', () => {
    const verified = applyBrandEntry({ domain: 'jamjam.tech' }, { verified: true });
    expect(verified.verified).toBe(true);
    expect(applyBrandEntry(verified, { domain: 'other.example' }).verified).toBe(false);
  });
  it('keeps verification for the same domain, a name edit, or an edit that sets verified itself', () => {
    const verified = { domain: 'jamjam.tech', verified: true };
    expect(applyBrandEntry(verified, { domain: 'jamjam.tech' }).verified).toBe(true);
    expect(applyBrandEntry(verified, { brandName: 'Acme' }).verified).toBe(true);
    expect(applyBrandEntry(verified, { domain: 'new.example', verified: true }).verified).toBe(true);
  });
});

describe('open gates', () => {
  it('lists every gate not approved, and none once all three are', () => {
    expect(openGates({ purpose: { status: 'approved' }, positioning: { status: 'changes', note: 'x' }, voice: { status: 'deferred' } })).toEqual(['positioning', 'voice']);
    expect(openGates({ purpose: { status: 'approved' }, positioning: { status: 'approved' }, voice: { status: 'approved' } })).toEqual([]);
  });
});

describe('gate approvals are bound to their inputs', () => {
  const base: FlowState = {
    brand: {},
    gates: pendingGates,
    positioningOption: 'A',
    voice: { round1: 'B', round2: 'C' },
    dials: { formality: 2, energy: 3, humour: 2 },
  };
  const approved = { status: 'approved' as const, by: 'me', at: 'T' };

  it('stays approved while its inputs are unchanged', () => {
    const s = { ...base, gates: recordDecision(base, 'positioning', approved) };
    expect(effectiveGates(s).positioning.status).toBe('approved');
  });
  it('goes stale when the BB-4 option, the brand name, or the voice picks or dials change; stale counts as open', () => {
    let s: FlowState = { ...base, gates: recordDecision(base, 'positioning', approved) };
    s = { ...s, gates: recordDecision(s, 'voice', approved) };
    expect(effectiveGates({ ...s, positioningOption: 'B' }).positioning.status).toBe('stale');
    expect(effectiveGates({ ...s, brand: { brandName: 'Acme' } }).positioning.status).toBe('stale');
    expect(effectiveGates({ ...s, dials: { ...s.dials, humour: 5 } }).voice.status).toBe('stale');
    expect(effectiveGates({ ...s, voice: { round1: 'A', round2: 'A' } }).voice.status).toBe('stale');
    expect(openGates(effectiveGates({ ...s, dials: { ...s.dials, humour: 5 } }))).toEqual(['purpose', 'voice']);
  });
});
