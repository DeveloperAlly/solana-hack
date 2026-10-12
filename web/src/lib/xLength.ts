// A pure copy of the Worker's X length rules (web/worker/posts.ts `xWeightedLength` and `platformLimit`), so the browser
// shows and gates the same count the Worker enforces. src/lib/xLength.test.ts checks parity against the Worker export.
// X's counting rules, from twitter-text 3.1.0 configs.version3: weight 2 by default, 1 for these code point ranges,
// 23 for any URL, 2 for any emoji sequence; the limit is 280 of these.
const X_LIGHT = [[0, 4351], [8192, 8205], [8208, 8223], [8242, 8247]];

/** A post's length as X counts it (weighted). */
export function xWeightedLength(text: string): number {
  let n = 0;
  // A URL ends before trailing punctuation (as twitter-text extracts it); that punctuation is counted as text.
  const withoutUrls = text.replace(/https?:\/\/\S+/gi, (u) => { const tail = u.match(/[.,:;!?)\]'"]+$/)?.[0] ?? ''; n += 23; return tail; });
  for (const { segment } of new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(withoutUrls)) {
    // Emoji graphemes: pictographs, flags (regional-indicator pairs) and keycaps (base + U+20E3) each count 2.
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(segment)) { n += 2; continue; }
    for (const ch of segment) {
      const cp = ch.codePointAt(0)!;
      n += X_LIGHT.some(([a, b]) => cp >= a && cp <= b) ? 1 : 2;
    }
  }
  return n;
}

/** Hard character limit for a channel, where the platform has one (X: 280). */
export function platformLimit(channel: string | null): number | null {
  return /^\s*(x|twitter)\s*$/i.test(channel ?? '') ? 280 : null;
}
