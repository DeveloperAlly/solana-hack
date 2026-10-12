import { describe, expect, it } from 'vitest';
import { lintFile, stripComments } from '../../scripts/lint-tokens-lib.mjs';

// lint:tokens reads code only (PR #99 review: the raw-hex rule failed on the comment "issue #114").
describe('lint:tokens rules', () => {
  it('ignores an issue reference in a line or block comment', () => {
    expect(lintFile('flows/journey-live/LiveJourney.tsx', '// shows its real result (issue #114, T1.09)\nconst a = 1;')).toEqual([]);
    expect(lintFile('flows/x.ts', '/* see #101 and #abc\n   and 12' + 'px in prose */\nexport const b = 2;')).toEqual([]);
    expect(lintFile('ui/x.css', '/* #fff is not used here */\n.a { color: var(--fg); }')).toEqual([]);
  });
  it('still fails a raw colour, rgb(), px value or style prop in code', () => {
    expect(lintFile('flows/x.tsx', "const c = { color: '#114' };")).toEqual([`flows/x.tsx:1: raw hex colour: const c = { color: '#114' };`]);
    expect(lintFile('flows/x.tsx', "const c = 'rgb(1, 2, 3)'; // note")).toHaveLength(1);
    // Fixtures are split so this file's own source does not trip the px and dimension rules it tests.
    const px = '.a { width' + ': 12' + 'px; }';
    expect(lintFile('ui/x.css', px)).toEqual([`ui/x.css:1: px value: ${px}`]);
    expect(lintFile('screens/x.tsx', '<div style={{ gap' + ': 4 }} />')).toHaveLength(2);
  });
  it('keeps line numbers and treats // inside a string as code', () => {
    expect(lintFile('flows/x.tsx', "// one\n// two\nconst c = '#00ff00';")[0]).toMatch(/^flows\/x\.tsx:3: raw hex colour/);
    expect(stripComments("const u = 'https://x.test/#abc';", true)).toBe("const u = 'https://x.test/#abc';");
    expect(lintFile('flows/x.tsx', "const u = 'https://x.test/#abc';")).toHaveLength(1);
    expect(stripComments('a // b\nc', true)).toBe('a     \nc');
  });
  it('treats // in CSS as code, since it is not a CSS comment', () => {
    expect(stripComments('.a { background: url(//x.test/a.png); }', false)).toBe('.a { background: url(//x.test/a.png); }');
  });
});
