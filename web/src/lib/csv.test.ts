import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('lib/csv', () => {
  it('quotes every cell and doubles inner quotes', () => {
    expect(csvCell('plain')).toBe('"plain"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell(32)).toBe('"32"');
  });

  it('neutralises cells a spreadsheet would run as formulas (OWASP CSV injection)', () => {
    for (const bad of ['=HYPERLINK("x")', '+1+1', '-2+3', '@SUM(A1)', '\tcmd', '\rcmd']) {
      expect(csvCell(bad).startsWith(`"'`)).toBe(true);
    }
    expect(csvCell('a=b')).toBe('"a=b"');
  });

  it('builds a header and rows', () => {
    expect(toCsv(['Lead', 'Fit'], [['=evil', 'High']])).toBe('"Lead","Fit"\n"\'=evil","High"');
  });
});
