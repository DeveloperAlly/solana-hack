import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHex } from './contrast';

describe('contrast', () => {
  it('parses opaque three-, six- and eight-digit hex', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('#1a1a1a')).toEqual([26, 26, 26]);
    expect(parseHex('#000000ff')).toEqual([0, 0, 0]);
  });
  it('rejects translucent colours so they are never reported as passing', () => {
    expect(parseHex('#00000080')).toBeNull();
    expect(parseHex('#00000000')).toBeNull();
    expect(contrastRatio('#00000080', '#ffffff')).toBeNull();
  });
  it('computes black on white as 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });
});
