import { describe, expect, it } from 'vitest';
import { uniqueId } from './id';

describe('uniqueId', () => {
  it('never repeats and keeps the prefix', () => {
    const ids = Array.from({ length: 500 }, () => uniqueId('src'));
    expect(new Set(ids).size).toBe(500);
    ids.forEach((id) => expect(id).toMatch(/^src-\d+$/));
  });

  it('does not collide after a removal, unlike length + 1', () => {
    const rows = [uniqueId('row'), uniqueId('row'), uniqueId('row')];
    rows.splice(1, 1);
    expect(rows).not.toContain(uniqueId('row'));
  });
});
