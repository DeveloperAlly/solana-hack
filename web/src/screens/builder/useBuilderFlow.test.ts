import { describe, expect, it } from 'vitest';
import { applyBrandEntry, openGates } from './useBuilderFlow';

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
