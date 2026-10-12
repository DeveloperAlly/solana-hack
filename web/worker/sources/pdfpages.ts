/**
 * The page count a PDF declares, read from the page tree its catalog points to, so the document adapter can tell the
 * converter's page headings ("### Page 1" ... "### Page N") from the same text inside the document (PR #71 review).
 *
 * The count is followed by reference, as a reader does, never guessed from whatever objects the file contains:
 * trailer (or cross-reference stream) `/Root` -> catalog `/Pages` -> that page tree node's `/Count`, the number of
 * pages in the document (ISO 32000-1 §7.5.5 file trailer, §7.5.8 cross-reference streams, §7.7.2 document catalog,
 * §7.7.3.2 page tree nodes). With incremental updates (§7.5.6) the newest definition of each object wins, and the
 * newest trailer is used, so a stale page tree left in the file is not read. Objects are found by scanning
 * `N G obj` headers outside stream data, so text inside a content stream is never taken for an object.
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

const WS = /[\0\t\n\f\r ]/;

/**
 * The dictionary starting at `at` (after optional whitespace): its text and end offset, or null. Literal strings,
 * hex strings and comments are skipped (ISO 32000-1 §7.3.4, §7.2.3), so a "<<" or ">>" inside them is not counted.
 */
export function dictAt(text: string, at: number): { dict: string; end: number } | null {
  let i = at;
  while (i < text.length && WS.test(text[i])) i++;
  if (text.slice(i, i + 2) !== '<<') return null;
  const start = i;
  let depth = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '(') {
      let nest = 1;
      i++;
      while (i < text.length && nest > 0) {
        if (text[i] === '\\') i += 2;
        else { if (text[i] === '(') nest++; else if (text[i] === ')') nest--; i++; }
      }
      continue;
    }
    if (ch === '%') { while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++; continue; }
    if (ch === '<' && text[i + 1] === '<') { depth++; i += 2; continue; }
    if (ch === '<') { const close = text.indexOf('>', i); if (close < 0) return null; i = close + 1; continue; }
    if (ch === '>' && text[i + 1] === '>') {
      depth--; i += 2;
      if (depth === 0) return { dict: text.slice(start, i), end: i };
      continue;
    }
    i++;
  }
  return null;
}

/**
 * A dictionary's top-level entries only, with nested dictionaries removed and every string and comment blanked, so a
 * key is read only where it really is a key: `/Note (/Pages 9 0 R)` holds no /Pages entry (ISO 32000-1 §7.3.4 strings,
 * §7.2.3 comments; PR #71 review).
 */
function topLevel(dict: string): string {
  let out = '';
  let depth = 0;
  let i = 0;
  while (i < dict.length) {
    const ch = dict[i];
    if (ch === '(') {
      let nest = 1;
      i++;
      while (i < dict.length && nest > 0) {
        if (dict[i] === '\\') i += 2;
        else { if (dict[i] === '(') nest++; else if (dict[i] === ')') nest--; i++; }
      }
      if (depth === 1) out += '()';
      continue;
    }
    if (ch === '%') { while (i < dict.length && dict[i] !== '\n' && dict[i] !== '\r') i++; if (depth === 1) out += ' '; continue; }
    if (ch === '<' && dict[i + 1] === '<') { depth++; i += 2; if (depth === 1) out += '<<'; continue; }
    if (ch === '<') { const close = dict.indexOf('>', i); i = close < 0 ? dict.length : close + 1; if (depth === 1) out += '<>'; continue; }
    if (ch === '>' && dict[i + 1] === '>') { if (depth === 1) out += '>>'; depth--; i += 2; continue; }
    if (depth === 1) out += ch;
    i++;
  }
  return out;
}

const ref = (dict: string, key: string) => {
  const m = new RegExp(`/${key}\\s+(\\d+)\\s+\\d+\\s+R`).exec(topLevel(dict));
  return m ? Number(m[1]) : null;
};
const int = (dict: string, key: string) => {
  const m = new RegExp(`/${key}\\s+(\\d+)(?!\\s+\\d+\\s+R)`).exec(topLevel(dict));
  return m ? Number(m[1]) : null;
};
const typeIs = (dict: string, type: string) => new RegExp(`/Type\\s*/${type}(?![A-Za-z0-9])`).test(topLevel(dict));

interface Indexed { num: number; pos: number; dict: string; data?: { start: number; end: number } }

/**
 * Every top-level object (`N G obj`) in file order, its dictionary and, for a stream, where its data lies. Stream data
 * is skipped, so nothing inside it is read as an object.
 */
function indexObjects(text: string): Indexed[] {
  const out: Indexed[] = [];
  const header = /(\d+)\s+(\d+)\s+obj(?![A-Za-z0-9])/g;
  let m: RegExpExecArray | null;
  while ((m = header.exec(text))) {
    const found = dictAt(text, m.index + m[0].length);
    if (!found) continue;
    const entry: Indexed = { num: Number(m[1]), pos: m.index, dict: found.dict };
    // ISO 32000-1 §7.3.8.1: "stream" is followed by CRLF or LF, "and not by a CARRIAGE RETURN alone". A lone CR is
    // still accepted when the next byte is not LF, where it cannot be misread, as other readers do for files that break
    // the rule (pdf-lib: https://github.com/Hopding/pdf-lib/issues/59) (PR #71 review).
    const kw = /[\0\t\n\f\r ]*stream(\r\n|\n|\r(?!\n))/y;
    kw.lastIndex = found.end;
    if (kw.exec(text)) {
      const start = kw.lastIndex;
      const length = int(found.dict, 'Length');
      const end = length !== null && start + length <= text.length ? start + length : text.indexOf('endstream', start);
      if (end < start) break;
      entry.data = { start, end };
      header.lastIndex = end;
    } else {
      header.lastIndex = found.end;
    }
    out.push(entry);
  }
  return out;
}

/** Inflates the first `limit` bytes of a Flate stream, within the shared budget; null when it cannot. */
async function inflatePrefix(data: Uint8Array, limit: number, budget: { left: number }): Promise<string | null> {
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

const plainFlate = (dict: string) => /\/Filter\s*(?:\/FlateDecode|\[\s*\/FlateDecode\s*\])/.test(topLevel(dict)) && !/\/DecodeParms/.test(topLevel(dict));

export async function pdfPageCount(bytes: Uint8Array): Promise<number | null> {
  const text = bytesToText(bytes);
  const objects = indexObjects(text);
  const budget = { left: MAX_INFLATE };

  // Newest definition of each top-level object.
  const latest = new Map<number, Indexed>();
  for (const o of objects) latest.set(o.num, o);
  const streams = objects.filter((o) => o.data && typeIs(o.dict, 'ObjStm') && plainFlate(o.dict)).sort((a, b) => b.pos - a.pos);

  // An object by number: the newest of its top-level definition and any object stream written after it.
  const resolve = async (num: number): Promise<string | null> => {
    const top = latest.get(num);
    for (const s of streams) {
      if (top && s.pos < top.pos) break;
      const n = int(s.dict, 'N');
      const first = int(s.dict, 'First');
      if (n === null || first === null) continue;
      const raw = bytes.subarray(s.data!.start, s.data!.end);
      const head = await inflatePrefix(raw, first, budget);
      if (head === null) return null;
      const pairs = head.trim().split(/\s+/).map(Number);
      let offset: number | null = null;
      for (let i = 0; i + 1 < Math.min(pairs.length, 2 * n); i += 2) if (pairs[i] === num) offset = pairs[i + 1];
      if (offset === null || !Number.isFinite(offset)) continue;
      const body = await inflatePrefix(raw, first + offset + OBJECT_SPAN, budget);
      if (body === null) return null;
      return dictAt(body, first + offset)?.dict ?? null;
    }
    return top?.dict ?? null;
  };

  // The newest trailer: a classic trailer dictionary or a cross-reference stream, whichever comes last. A "trailer"
  // inside stream data is not one.
  const inStream = (pos: number) => objects.some((o) => o.data && pos >= o.data.start && pos < o.data.end);
  let root: { pos: number; num: number } | null = null;
  for (const m of text.matchAll(/trailer(?![A-Za-z0-9])/g)) {
    if (inStream(m.index)) continue;
    const t = dictAt(text, m.index + 'trailer'.length);
    const num = t ? ref(t.dict, 'Root') : null;
    if (num !== null && (!root || m.index > root.pos)) root = { pos: m.index, num };
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
