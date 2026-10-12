/**
 * The page count a PDF declares, read from the page tree its catalog points to, so the document adapter can tell the
 * converter's page headings ("### Page 1" ... "### Page N") from the same text inside the document (PR #71 review).
 *
 * The count is followed by reference, as a reader does, never guessed from whatever objects the file contains:
 * trailer (or cross-reference stream) `/Root` -> catalog `/Pages` -> that page tree node's `/Count`, the number of
 * pages in the document (ISO 32000-1 §7.5.5 file trailer, §7.5.8 cross-reference streams, §7.7.2 document catalog,
 * §7.7.3.2 page tree nodes). With incremental updates (§7.5.6) the newest definition of each object wins, and the
 * newest trailer is used, so a stale page tree left in the file is not read. Objects and trailers are found by one
 * lexical pass (scanFile) that steps over strings, comments and stream data, so text in them is never taken for either,
 * and every dictionary is parsed into its entries (parseObject, ISO 32000-1 §7.2 and §7.3), so a key is read only where
 * it is a key of that dictionary, never from a string, comment, array or nested dictionary inside it (PR #71 review).
 * A stream's data is located only by its /Length, read through the cross-reference data when it is indirect, and
 * checked against the "endstream" that must follow; when that fails the count is unknown, since reading payload bytes
 * as syntax could find objects that are not there (PR #71 review).
 *
 * Objects stored in object streams (`/Type /ObjStm`, §7.5.7) are read by inflating only as much of the stream as
 * needed (its header, then up to the object), and never more than MAX_INFLATE bytes for the whole document, so a small
 * upload cannot expand past the Worker's memory (PR #71 review). Inflation uses DecompressionStream "deflate",
 * supported in Workers (https://developers.cloudflare.com/workers/runtime-apis/web-standards/#compression-streams).
 *
 * Returns null when the count cannot be followed (encrypted or damaged file, an unusual filter, the budget spent);
 * the caller then keeps its previous behaviour.
 */
export const MAX_INFLATE = 4 * 1024 * 1024;
// How far past an object's offset in an object stream its dictionary may run.
const OBJECT_SPAN = 64 * 1024;

/**
 * One character per byte (Latin-1), so string offsets are byte offsets. Built by hand because the Workers TextDecoder
 * decodes UTF-8 only (https://developers.cloudflare.com/workers/runtime-apis/web-standards/#encoding-api).
 */
function bytesToText(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return out;
}

/**
 * PDF objects as ISO 32000-1 §7.3 defines them, read by one lexer (§7.2): what this module needs of each value is its
 * kind, and for names, numbers, references, arrays and dictionaries their content. Strings are kept only as a kind.
 */
export type PdfValue =
  | { kind: 'name'; name: string }
  | { kind: 'number'; value: number }
  | { kind: 'ref'; num: number; gen: number }
  | { kind: 'array'; items: PdfValue[] }
  | { kind: 'dict'; entries: Map<string, PdfValue> }
  | { kind: 'string' }
  | { kind: 'keyword'; word: string };
export type PdfDict = Map<string, PdfValue>;

// §7.2.2 Table 1 (white-space) and Table 2 (delimiters); every other byte is a regular character.
const WHITE = new Set(['\0', '\t', '\n', '\f', '\r', ' ']);
const DELIMS = new Set(['(', ')', '<', '>', '[', ']', '{', '}', '/', '%']);
const regular = (ch: string | undefined) => ch !== undefined && !WHITE.has(ch) && !DELIMS.has(ch);
// Nesting deeper than this is refused rather than followed, so a hostile file cannot exhaust the call stack.
const MAX_DEPTH = 64;
// §7.3.3: an optional sign, digits with at most one period.
const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)/y;

/** Past white-space and comments (§7.2.3: a comment runs from % to the end of the line). */
function skipSpace(text: string, i: number): number {
  while (i < text.length) {
    if (WHITE.has(text[i])) i++;
    else if (text[i] === '%') { while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++; }
    else break;
  }
  return i;
}

/** Past a literal string starting at "(" (§7.3.4.2: balanced parentheses, backslash escapes); -1 if unterminated. */
function skipLiteral(text: string, i: number): number {
  let nest = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '(') nest++;
    else if (ch === ')' && --nest === 0) return i + 1;
    i++;
  }
  return -1;
}

/** Past a hex string starting at "<" (§7.3.4.3: hex digits and white-space up to ">"); -1 if it is not one. */
function skipHex(text: string, i: number): number {
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === '>') return j + 1;
    if (!WHITE.has(text[j]) && !/[0-9A-Fa-f]/.test(text[j])) return -1;
  }
  return -1;
}

/** A name starting at "/" (§7.3.5): regular characters up to a delimiter, with #xx escapes decoded. */
function readName(text: string, i: number): { name: string; end: number } {
  let j = i + 1;
  while (regular(text[j])) j++;
  const name = text.slice(i + 1, j).replace(/#([0-9A-Fa-f]{2})/g, (_m, h: string) => String.fromCharCode(parseInt(h, 16)));
  return { name, end: j };
}

/** A run of regular characters at `i` (a number or a keyword), or null at a delimiter. */
function readWord(text: string, i: number): { word: string; end: number } | null {
  let j = i;
  while (regular(text[j])) j++;
  return j > i ? { word: text.slice(i, j), end: j } : null;
}

const nonNegativeInt = (w: string) => /^\d+$/.test(w);

/**
 * The object at `at` (after white-space and comments) and where it ends, or null when there is none or it is
 * malformed. `N G R` is an indirect reference (§7.3.10), read by looking ahead past two integers.
 */
export function parseObject(text: string, at: number, depth = 0): { value: PdfValue; end: number } | null {
  if (depth > MAX_DEPTH) return null;
  let i = skipSpace(text, at);
  const ch = text[i];
  if (ch === undefined) return null;
  if (ch === '/') { const n = readName(text, i); return { value: { kind: 'name', name: n.name }, end: n.end }; }
  if (ch === '(') { const end = skipLiteral(text, i); return end < 0 ? null : { value: { kind: 'string' }, end }; }
  if (ch === '<' && text[i + 1] === '<') {
    const entries: PdfDict = new Map();
    i += 2;
    while (true) {
      i = skipSpace(text, i);
      if (text[i] === '>' && text[i + 1] === '>') return { value: { kind: 'dict', entries }, end: i + 2 };
      // §7.3.7: each key is a name, followed by its value.
      if (text[i] !== '/') return null;
      const key = readName(text, i);
      const v = parseObject(text, key.end, depth + 1);
      if (!v) return null;
      entries.set(key.name, v.value);
      i = v.end;
    }
  }
  if (ch === '<') { const end = skipHex(text, i); return end < 0 ? null : { value: { kind: 'string' }, end }; }
  if (ch === '[') {
    const items: PdfValue[] = [];
    i++;
    while (true) {
      i = skipSpace(text, i);
      if (text[i] === ']') return { value: { kind: 'array', items }, end: i + 1 };
      const v = parseObject(text, i, depth + 1);
      if (!v) return null;
      items.push(v.value);
      i = v.end;
    }
  }
  const w = readWord(text, i);
  if (!w) return null;
  NUMBER.lastIndex = 0;
  const num = NUMBER.exec(w.word);
  if (num && num[0] === w.word) {
    if (nonNegativeInt(w.word)) {
      const genAt = skipSpace(text, w.end);
      const gen = readWord(text, genAt);
      if (gen && genAt > w.end && nonNegativeInt(gen.word)) {
        const rAt = skipSpace(text, gen.end);
        const r = readWord(text, rAt);
        if (r && rAt > gen.end && r.word === 'R') return { value: { kind: 'ref', num: Number(w.word), gen: Number(gen.word) }, end: r.end };
      }
    }
    return { value: { kind: 'number', value: Number(w.word) }, end: w.end };
  }
  return { value: { kind: 'keyword', word: w.word }, end: w.end };
}

/** The dictionary starting at `at` (after white-space and comments) and its end offset, or null. */
export function dictAt(text: string, at: number): { dict: PdfDict; end: number } | null {
  const i = skipSpace(text, at);
  if (text[i] !== '<' || text[i + 1] !== '<') return null;
  const o = parseObject(text, i);
  return o && o.value.kind === 'dict' ? { dict: o.value.entries, end: o.end } : null;
}

// Entries are looked up in the parsed dictionary, so only a top-level key of this dictionary is ever read: text in a
// string, a comment, an array or a nested dictionary is never a key here (PR #71 review).
const ref = (dict: PdfDict, key: string) => {
  const v = dict.get(key);
  return v?.kind === 'ref' ? v.num : null;
};
const int = (dict: PdfDict, key: string) => {
  const v = dict.get(key);
  return v?.kind === 'number' && Number.isInteger(v.value) && v.value >= 0 ? v.value : null;
};
const typeIs = (dict: PdfDict, type: string) => {
  const v = dict.get('Type');
  return v?.kind === 'name' && v.name === type;
};

/** "N G obj" at `at` (§7.3.10), three tokens with any white-space or comments between them (§7.2.3). */
function objectHeader(text: string, at: number): { num: number; end: number } | null {
  const n = readWord(text, at);
  if (!n || !nonNegativeInt(n.word)) return null;
  const g = readWord(text, skipSpace(text, n.end));
  if (!g || !nonNegativeInt(g.word)) return null;
  const o = readWord(text, skipSpace(text, g.end));
  return o && o.word === 'obj' ? { num: Number(n.word), end: o.end } : null;
}

/**
 * ISO 32000-1 §7.3.8.1: "stream" is followed by CRLF or LF, "and not by a CARRIAGE RETURN alone". A lone CR is still
 * accepted when the next byte is not LF, where it cannot be misread, as other readers do for files that break the rule
 * (pdf-lib: https://github.com/Hopding/pdf-lib/issues/59) (PR #71 review).
 */
function dataStart(text: string, afterKeyword: number): number | null {
  if (text.startsWith('\r\n', afterKeyword)) return afterKeyword + 2;
  return text[afterKeyword] === '\n' || text[afterKeyword] === '\r' ? afterKeyword + 1 : null;
}

/**
 * Where a stream's data lies, from its /Length (§7.3.8.2), direct or indirect, never by searching the data: payload
 * bytes can hold "endstream" or anything else (PR #71 review). The length is accepted only when "endstream" follows
 * it, after an optional end-of-line, as §7.3.8.1 requires. Returns null when the dictionary is not followed by a
 * stream, undefined when it is but its end cannot be established.
 */
async function streamData(text: string, dict: PdfDict, dictEnd: number, lengthOf: (num: number) => Promise<number | null>): Promise<{ start: number; end: number; after: number } | null | undefined> {
  const kw = readWord(text, skipSpace(text, dictEnd));
  if (!kw || kw.word !== 'stream') return null;
  const start = dataStart(text, kw.end);
  if (start === null) return undefined;
  const v = dict.get('Length');
  const length = v?.kind === 'ref' ? await lengthOf(v.num) : int(dict, 'Length');
  if (length === null || start + length > text.length) return undefined;
  const end = start + length;
  const close = readWord(text, skipSpace(text, end));
  if (!close || close.word !== 'endstream') return undefined;
  return { start, end, after: close.end };
}

/** Bytes inflated in all while reading one file, shared by every stream it reads. */
type Budget = { left: number };

/**
 * Undoes a PNG predictor (§7.4.4.4, Predictor 10 to 15, one byte per sample: Colors 1, BitsPerComponent 8), the form
 * cross-reference streams use. Each row is one filter-type byte, then `columns` bytes. null for anything else.
 */
function unpredict(data: Uint8Array, parms: PdfDict | null): Uint8Array | null {
  if (!parms) return data;
  const num = (k: string, d: number) => { const v = parms.get(k); return v === undefined ? d : v.kind === 'number' ? v.value : NaN; };
  const predictor = num('Predictor', 1);
  if (predictor === 1) return data;
  const columns = num('Columns', 1);
  if (predictor < 10 || predictor > 15 || num('Colors', 1) !== 1 || num('BitsPerComponent', 8) !== 8 || !Number.isInteger(columns) || columns < 1) return null;
  const rowLen = columns + 1;
  if (data.length % rowLen !== 0) return null;
  const out = new Uint8Array((data.length / rowLen) * columns);
  for (let r = 0; r * rowLen < data.length; r++) {
    const type = data[r * rowLen];
    for (let c = 0; c < columns; c++) {
      const x = data[r * rowLen + 1 + c];
      const left = c > 0 ? out[r * columns + c - 1] : 0;
      const up = r > 0 ? out[(r - 1) * columns + c] : 0;
      const upLeft = r > 0 && c > 0 ? out[(r - 1) * columns + c - 1] : 0;
      let pred: number;
      if (type === 0) pred = 0;
      else if (type === 1) pred = left;
      else if (type === 2) pred = up;
      else if (type === 3) pred = Math.floor((left + up) / 2);
      else if (type === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
        pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      } else return null;
      out[r * columns + c] = (x + pred) & 0xff;
    }
  }
  return out;
}

/**
 * The byte offset of each object as the file's cross-reference data gives it (§7.5.4 cross-reference table, §7.5.8
 * cross-reference streams), newest section first, following /Prev through incremental updates (§7.5.6) and /XRefStm
 * in hybrid files (§7.5.8.4). An object whose newest entry is free or in an object stream maps to null. Read from the
 * last startxref (§7.5.5). null when the data cannot be read.
 */
async function xrefOffsets(text: string, bytes: Uint8Array, budget: Budget): Promise<Map<number, number | null> | null> {
  const sx = text.lastIndexOf('startxref');
  const first = sx < 0 ? null : readWord(text, skipSpace(text, sx + 9));
  if (!first || !nonNegativeInt(first.word)) return null;
  const offsets = new Map<number, number | null>();
  const keep = (num: number, at: number | null) => { if (!offsets.has(num)) offsets.set(num, at); };
  const queue = [Number(first.word)];
  const seen = new Set<number>();
  while (queue.length) {
    const at = queue.shift()!;
    if (seen.has(at) || at >= text.length) return seen.has(at) ? offsets : null;
    seen.add(at);
    const start = skipSpace(text, at);
    const kw = readWord(text, start);
    let trailer: PdfDict | null = null;
    if (kw?.word === 'xref') {
      // Subsections: "first count", then count entries of "offset generation n|f" (§7.5.4).
      let i = kw.end;
      while (true) {
        const a = readWord(text, skipSpace(text, i));
        if (!a) return null;
        if (a.word === 'trailer') { trailer = dictAt(text, a.end)?.dict ?? null; break; }
        const c = readWord(text, skipSpace(text, a.end));
        if (!nonNegativeInt(a.word) || !c || !nonNegativeInt(c.word)) return null;
        i = c.end;
        const firstNum = Number(a.word);
        const count = Number(c.word);
        if (count * 18 > text.length - i) return null;
        for (let k = 0; k < count; k++) {
          const off = readWord(text, skipSpace(text, i));
          const gen = off && readWord(text, skipSpace(text, off.end));
          const type = gen && readWord(text, skipSpace(text, gen.end));
          if (!off || !gen || !type || !nonNegativeInt(off.word) || !nonNegativeInt(gen.word) || (type.word !== 'n' && type.word !== 'f')) return null;
          keep(firstNum + k, type.word === 'n' ? Number(off.word) : null);
          i = type.end;
        }
      }
      if (!trailer) return null;
      const stm = int(trailer, 'XRefStm');
      if (stm !== null) queue.push(stm);
    } else {
      const head = objectHeader(text, start);
      const found = head && dictAt(text, head.end);
      if (!found || !typeIs(found.dict, 'XRef')) return null;
      trailer = found.dict;
      // A cross-reference stream's own length is read directly: it cannot depend on the table it holds.
      const data = await streamData(text, found.dict, found.end, async () => null);
      if (!data) return null;
      const filter = found.dict.get('Filter');
      const flate = filter?.kind === 'name' ? filter.name === 'FlateDecode' : filter?.kind === 'array' ? filter.items.length === 1 && filter.items[0].kind === 'name' && filter.items[0].name === 'FlateDecode' : false;
      let raw: Uint8Array | null = bytes.subarray(data.start, data.end);
      if (filter && !flate) return null;
      if (flate) {
        const inflated = await inflateAll(raw, budget);
        const parmsV = found.dict.get('DecodeParms');
        const parms = parmsV?.kind === 'dict' ? parmsV.entries : parmsV?.kind === 'array' && parmsV.items[0]?.kind === 'dict' ? parmsV.items[0].entries : null;
        if (parmsV && !parms) return null;
        raw = inflated && unpredict(inflated, parms);
      }
      if (!raw) return null;
      const wv = found.dict.get('W');
      const widths = wv?.kind === 'array' && wv.items.length === 3 && wv.items.every((x) => x.kind === 'number' && Number.isInteger(x.value) && x.value >= 0 && x.value <= 8) ? wv.items.map((x) => (x as { value: number }).value) : null;
      const size = int(found.dict, 'Size');
      if (!widths || size === null) return null;
      const iv = found.dict.get('Index');
      const index = iv === undefined ? [0, size] : iv.kind === 'array' && iv.items.every((x) => x.kind === 'number') ? iv.items.map((x) => (x as { value: number }).value) : null;
      if (!index || index.length % 2) return null;
      const rowLen = widths[0] + widths[1] + widths[2];
      const field = (row: number, from: number, width: number, dflt: number) => {
        if (width === 0) return dflt;
        let v = 0;
        for (let b = 0; b < width; b++) v = v * 256 + raw![row * rowLen + from + b];
        return v;
      };
      let row = 0;
      for (let s2 = 0; s2 < index.length; s2 += 2) {
        for (let k = 0; k < index[s2 + 1]; k++, row++) {
          if ((row + 1) * rowLen > raw.length) return null;
          // §7.5.8.3 Table 18: type 1 is an object at a byte offset; type 0 free; type 2 in an object stream.
          const type = field(row, 0, widths[0], 1);
          keep(index[s2] + k, type === 1 ? field(row, widths[0], widths[1], 0) : null);
        }
      }
    }
    const prev = int(trailer, 'Prev');
    if (prev !== null) queue.push(prev);
  }
  return offsets;
}

/** Inflates a whole Flate stream within the shared budget; null when it is longer than the budget or damaged. */
async function inflateAll(data: Uint8Array, budget: Budget): Promise<Uint8Array | null> {
  try {
    const source = new ReadableStream<BufferSource>({ start(c) { c.enqueue(new Uint8Array(data)); c.close(); } });
    const reader = source.pipeThrough(new DecompressionStream('deflate')).getReader();
    const parts: Uint8Array[] = [];
    let got = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      got += value.length;
      if (got > budget.left) { await reader.cancel().catch(() => undefined); return null; }
      parts.push(value);
    }
    budget.left -= got;
    const out = new Uint8Array(got);
    let at = 0;
    for (const p of parts) { out.set(p, at); at += p.length; }
    return out;
  } catch {
    return null;
  }
}

interface Indexed { num: number; pos: number; dict: PdfDict; data?: { start: number; end: number } }

/**
 * One pass over the file's top level, as a lexer reads it (ISO 32000-1 §7.2): comments, literal strings, hex strings,
 * dictionaries and stream data are stepped over whole, so an object header or a "trailer" keyword is found only where
 * it really is one, never inside a string, a comment or stream bytes (PR #71 review). Returns every object (`N G obj`)
 * in file order with its dictionary and, for a stream, where its data lies, and every trailer dictionary.
 */
async function scanFile(text: string, lengthOf: (num: number) => Promise<number | null>): Promise<{ objects: Indexed[]; trailers: { pos: number; dict: PdfDict }[] } | null> {
  const objects: Indexed[] = [];
  const trailers: { pos: number; dict: PdfDict }[] = [];
  let i = 0;
  while (i < text.length) {
    i = skipSpace(text, i);
    const ch = text[i];
    if (ch === undefined) break;
    if (ch === '(') { const end = skipLiteral(text, i); i = end < 0 ? text.length : end; continue; }
    if (ch === '<') {
      // A dictionary or hex string is stepped over whole; a malformed one is passed one byte at a time.
      const o = parseObject(text, i);
      i = o ? o.end : i + 1;
      continue;
    }
    if (ch === '/') { i = readName(text, i).end; continue; }
    const w = readWord(text, i);
    if (!w) { i++; continue; }
    if (w.word === 'trailer') {
      const d = dictAt(text, w.end);
      if (d) { trailers.push({ pos: i, dict: d.dict }); i = d.end; } else i = w.end;
      continue;
    }
    const head = objectHeader(text, i);
    if (!head) { i = w.end; continue; }
    const found = dictAt(text, head.end);
    if (!found) { i = head.end; continue; }
    const entry: Indexed = { num: head.num, pos: i, dict: found.dict };
    i = found.end;
    const data = await streamData(text, found.dict, found.end, lengthOf);
    // A stream whose end cannot be established: the scan stops rather than read its bytes as syntax (PR #71 review).
    if (data === undefined) return null;
    if (data) { entry.data = data; i = data.after; }
    objects.push(entry);
  }
  return { objects, trailers };
}

/** Inflates the first `limit` bytes of a Flate stream, within the shared budget; null when it cannot. */
async function inflatePrefix(data: Uint8Array, limit: number, budget: Budget): Promise<string | null> {
  const want = Math.min(limit, budget.left);
  if (want <= 0) return null;
  try {
    const source = new ReadableStream<BufferSource>({ start(c) { c.enqueue(new Uint8Array(data)); c.close(); } });
    const reader = source.pipeThrough(new DecompressionStream('deflate')).getReader();
    const parts: Uint8Array[] = [];
    let got = 0;
    while (got < want) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      got += value.length;
    }
    await reader.cancel().catch(() => undefined);
    const take = Math.min(got, want);
    budget.left -= take;
    const all = new Uint8Array(take);
    let at = 0;
    for (const p of parts) {
      const slice = p.subarray(0, Math.min(p.length, take - at));
      all.set(slice, at);
      at += slice.length;
      if (at >= take) break;
    }
    return bytesToText(all);
  } catch {
    return null;
  }
}

/** A stream with exactly one filter, FlateDecode, and no decode parameters (§7.3.8.2 Table 5, §7.4.4). */
const plainFlate = (dict: PdfDict) => {
  const f = dict.get('Filter');
  const flate = (v: PdfValue | undefined) => v?.kind === 'name' && v.name === 'FlateDecode';
  return (flate(f) || (f?.kind === 'array' && f.items.length === 1 && flate(f.items[0]))) && !dict.has('DecodeParms');
};

export async function pdfPageCount(bytes: Uint8Array): Promise<number | null> {
  const text = bytesToText(bytes);
  const budget: Budget = { left: MAX_INFLATE };
  // An indirect /Length is read where the cross-reference data says its object is (§7.3.8.2, §7.5.4, §7.5.8): the
  // object at that offset must be "N G obj" for that number, holding a non-negative integer. Read once, on first need.
  let xref: Promise<Map<number, number | null> | null> | null = null;
  const lengthOf = async (num: number): Promise<number | null> => {
    xref ??= xrefOffsets(text, bytes, budget);
    const at = (await xref)?.get(num);
    if (at === undefined || at === null) return null;
    const head = objectHeader(text, skipSpace(text, at));
    if (!head || head.num !== num) return null;
    const v = parseObject(text, head.end);
    return v && v.value.kind === 'number' && Number.isInteger(v.value.value) && v.value.value >= 0 ? v.value.value : null;
  };
  const scanned = await scanFile(text, lengthOf);
  if (!scanned) return null;
  const { objects, trailers } = scanned;

  // Newest definition of each top-level object.
  const latest = new Map<number, Indexed>();
  for (const o of objects) latest.set(o.num, o);
  const streams = objects.filter((o) => o.data && typeIs(o.dict, 'ObjStm') && plainFlate(o.dict)).sort((a, b) => b.pos - a.pos);

  // An object by number: the newest of its top-level definition and any object stream written after it.
  const resolve = async (num: number): Promise<PdfDict | null> => {
    const top = latest.get(num);
    for (const s of streams) {
      if (top && s.pos < top.pos) break;
      const n = int(s.dict, 'N');
      const first = int(s.dict, 'First');
      if (n === null || first === null) continue;
      const raw = bytes.subarray(s.data!.start, s.data!.end);
      const head = await inflatePrefix(raw, first, budget);
      if (head === null) return null;
      // §7.5.7: the header is N pairs of integers, the object number and its offset from /First.
      let offset: number | null = null;
      let at = 0;
      for (let k = 0; k < n; k++) {
        const objNum = parseObject(head, at);
        const objOff = objNum && parseObject(head, objNum.end);
        if (!objNum || !objOff || objNum.value.kind !== 'number' || objOff.value.kind !== 'number') break;
        if (objNum.value.value === num) offset = objOff.value.value;
        at = objOff.end;
      }
      if (offset === null || !Number.isInteger(offset) || offset < 0) continue;
      const body = await inflatePrefix(raw, first + offset + OBJECT_SPAN, budget);
      if (body === null) return null;
      return dictAt(body, first + offset)?.dict ?? null;
    }
    return top?.dict ?? null;
  };

  // The newest trailer: a classic trailer dictionary or a cross-reference stream, whichever comes last.
  let root: { pos: number; num: number } | null = null;
  for (const t of trailers) {
    const num = ref(t.dict, 'Root');
    if (num !== null && (!root || t.pos > root.pos)) root = { pos: t.pos, num };
  }
  for (const o of objects) {
    const num = typeIs(o.dict, 'XRef') ? ref(o.dict, 'Root') : null;
    if (num !== null && (!root || o.pos > root.pos)) root = { pos: o.pos, num };
  }
  if (!root) return null;

  const catalog = await resolve(root.num);
  const pagesNum = catalog && typeIs(catalog, 'Catalog') ? ref(catalog, 'Pages') : null;
  if (pagesNum === null) return null;
  const pages = await resolve(pagesNum);
  if (!pages || !typeIs(pages, 'Pages')) return null;
  const count = int(pages, 'Count');
  return count !== null && count > 0 ? count : null;
}
