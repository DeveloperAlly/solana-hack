import { describe, expect, it } from 'vitest';
import { approve, approveThrough, isCurrent, isStale } from './approval';

describe('approval: one model, stale when its inputs change', () => {
  it('is current on the inputs it approved and stale on any other', () => {
    const a = approve({ cap: '500' });
    expect(isCurrent(a, { cap: '500' })).toBe(true);
    expect(isStale(a, { cap: '500' })).toBe(false);
    expect(isCurrent(a, { cap: '400' })).toBe(false);
    expect(isStale(a, { cap: '400' })).toBe(true);
  });

  it('no approval is neither current nor stale', () => {
    expect(isCurrent(null, 'x')).toBe(false);
    expect(isStale(undefined, 'x')).toBe(false);
  });

  it('carries the decision it records', () => {
    expect(approve(['text'], { by: '[approver]' }).decision).toEqual({ by: '[approver]' });
  });

  it('approveThrough refuses while the gate blocks or is pending, and approves the inputs once it passes', () => {
    expect(approveThrough({ blocking: true, label: 're-checking claims' }, ['text'])).toBeNull();
    const a = approveThrough({ blocking: false, label: 'Checks passed' }, ['text'], { by: '[approver]', at: '[date]' });
    expect(a && isCurrent(a, ['text'])).toBe(true);
  });
});
