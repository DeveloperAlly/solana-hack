import { afterEach, describe, expect, it, vi } from 'vitest';
import { newId } from './id';

afterEach(() => vi.unstubAllGlobals());

describe('newId', () => {
  it('never repeats, with or without crypto.randomUUID', () => {
    const withUuid = new Set(Array.from({ length: 500 }, () => newId()));
    expect(withUuid.size).toBe(500);
    vi.stubGlobal('crypto', {});
    const withoutUuid = new Set(Array.from({ length: 500 }, () => newId()));
    expect(withoutUuid.size).toBe(500);
  });

  it('adds the prefix', () => {
    expect(newId('link')).toMatch(/^link-.+/);
  });

  it('does not collide after removals, unlike length + 1', () => {
    const items = [newId('row'), newId('row'), newId('row')];
    items.splice(1, 1);
    const next = newId('row');
    expect(items).not.toContain(next);
  });
});
