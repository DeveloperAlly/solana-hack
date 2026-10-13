// The comment renderer's input may come from fork code: these pin what gets through.
import { describe, it, expect } from 'vitest';
import { validateResults, safeText, knownJourneyIds } from './validate.mjs';

const step = (o) => ({ n: 2, did: 'Click "Read my site".', expected: 'Facts appear.', pass: false, checks: [{ label: 'Facts quote the site', pass: false, actual: 'quote "x"' }], ...o });
const journey = (o) => ({ id: 'poc-1-first-run', section: 'poc', status: 'FAIL', steps: [step({})], ...o });

describe('results validation', () => {
  it('knows the journey ids from the sources', () => {
    const ids = knownJourneyIds();
    for (const id of ['live-first-run', 'poc-1-first-run', 'poc-7a-mobile-first-run', 'poc-8-loop']) expect(ids.has(id)).toBe(true);
  });
  it('rejects unknown journey ids, statuses and sections', () => {
    expect(() => validateResults({ journeys: [journey({ id: 'evil' })] })).toThrow(/unknown journey id/);
    expect(() => validateResults({ journeys: [journey({ status: 'GREEN' })] })).toThrow(/unknown status/);
    expect(() => validateResults({ journeys: [journey({ section: 'x' })] })).toThrow(/unknown section/);
  });
  it('rejects oversized strings and wrong types', () => {
    expect(() => validateResults({ journeys: [journey({ steps: [step({ did: 'x'.repeat(2001) })] })] })).toThrow(/longer than/);
    expect(() => validateResults({ journeys: [journey({ steps: [step({ n: 'one' })] })] })).toThrow(/step number/);
  });
  it('defuses links, mentions, markdown and table pipes', () => {
    const t = safeText('see https://evil.example and www.evil.example @someone [x](y) | <img> `code`');
    expect(t).not.toMatch(/:\/\/|www\.|@|\[|\||<|`/);
    expect(t).toContain('[:]//'.replace(/[[\]]/g, (c) => `&#${c.codePointAt(0)};`));
  });
  it('keeps only the shown fields', () => {
    const [j] = validateResults({ journeys: [journey({ notes: 'http://x', extra: 'y' })] });
    expect(Object.keys(j).sort()).toEqual(['firstFail', 'id', 'missing', 'section', 'status']);
    expect(j.firstFail.n).toBe(2);
  });
});
