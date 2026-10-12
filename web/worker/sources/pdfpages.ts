/**
 * The page count a PDF declares, read from its own page tree, so the document adapter can tell the converter's page
 * headings ("### Page 1" ... "### Page N") from the same text inside the document (PR #71 review).
 *
 * A page tree node is a dictionary with `/Type /Pages`, and its `/Count` is the number of pages below it; the root
 * node's count is the document's page count, and it is the largest count of any node (ISO 32000-1 §7.7.3.2, "Page
 * tree nodes"). Since PDF 1.5 objects may be stored compressed inside an object stream (`/Type /ObjStm`, §7.5.7), so
 * Flate-compressed object streams are inflated (DecompressionStream "deflate", supported in Workers:
 * https://developers.cloudflare.com/workers/runtime-apis/web-standards/#compression-streams) and searched as well.
 *
 * Returns null when no page tree count can be found (an encrypted object stream, an unusual filter, a damaged file);
 * the caller then keeps its previous behaviour. An incremental update that removed pages can leave the older, larger
 * root count in the file, so the result is an upper bound in that case.
 */
const PAGES_TYPE = /\/Type\s*\/Pages(?![A-Za-z0-9])/g;
const COUNT = /\/Count\s+(\d+)/;

/** The dictionary `<< ... >>` that encloses position `at`, nested dictionaries included: its text and end offset. */
function enclosingDict(text: string, at: number): { dict: string; end: number } | null {
  let depth = 0;
  let start = -1;
  for (let i = at - 1; i >= 1; i--) {
    const two = text[i - 1] + text[i];
    if (two === '>>') { depth++; i--; continue; }
    if (two === '<<') {
      if (depth === 0) { start = i - 1; break; }
      depth--; i--;
    }
  }
  if (start < 0) return null;
  depth = 0;
  for (let i = start; i < text.length - 1; i++) {
    const two = text[i] + text[i + 1];
    if (two === '<<') { depth++; i++; continue; }
    if (two === '>>') {
      depth--; i++;
      if (depth === 0) return { dict: text.slice(start, i + 1), end: i + 1 };
    }
  }
  return null;
}

/** The top-level entries of a dictionary: nested dictionaries are removed, so a nested `/Count` is not read. */
function topLevel(dict: string): string {
  let out = '';
  let depth = 0;
  for (let i = 0; i < dict.length; i++) {
    const two = dict.slice(i, i + 2);
    if (two === '<<') { depth++; i++; if (depth === 1) out += '<<'; continue; }
    if (two === '>>') { if (depth === 1) out += '>>'; depth--; i++; continue; }
    if (depth === 1) out += dict[i];
  }
  return out;
}

function largestCount(text: string): number | null {
  let best: number | null = null;
  for (const m of text.matchAll(PAGES_TYPE)) {
    const found = enclosingDict(text, m.index);
    if (!found) continue;
    const count = COUNT.exec(topLevel(found.dict));
    if (count) best = Math.max(best ?? 0, Number(count[1]));
  }
  return best;
}

async function inflate(data: Uint8Array): Promise<string | null> {
  try {
    const source = new ReadableStream<BufferSource>({ start(c) { c.enqueue(new Uint8Array(data)); c.close(); } });
    const stream = source.pipeThrough(new DecompressionStream('deflate'));
    return bytesToText(new Uint8Array(await new Response(stream).arrayBuffer()));
  } catch {
    return null;
  }
}

/** Each Flate-compressed object stream in the file, inflated. */
async function objectStreams(bytes: Uint8Array, text: string): Promise<string[]> {
  const out: string[] = [];
  for (const m of text.matchAll(/\/Type\s*\/ObjStm(?![A-Za-z0-9])/g)) {
    const found = enclosingDict(text, m.index);
    if (!found) continue;
    const head = topLevel(found.dict);
    // Only a plain Flate stream: another filter, a filter chain or a predictor is not decoded here.
    if (!/\/Filter\s*(?:\/FlateDecode|\[\s*\/FlateDecode\s*\])/.test(head) || /\/DecodeParms/.test(head)) continue;
    const kw = /\s*stream(\r\n|\n)/y;
    kw.lastIndex = found.end;
    const s = kw.exec(text);
    if (!s) continue;
    const start = kw.lastIndex;
    const length = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(head);
    const end = length ? start + Number(length[1]) : text.indexOf('endstream', start);
    if (end <= start || end > bytes.length) continue;
    const inflated = await inflate(bytes.subarray(start, end));
    if (inflated) out.push(inflated);
  }
  return out;
}

/**
 * One character per byte (Latin-1), so string offsets are byte offsets. Built by hand because the Workers TextDecoder
 * decodes UTF-8 only (https://developers.cloudflare.com/workers/runtime-apis/web-standards/#encoding-api).
 */
function bytesToText(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return out;
}

export async function pdfPageCount(bytes: Uint8Array): Promise<number | null> {
  const text = bytesToText(bytes);
  let best = largestCount(text);
  for (const inner of await objectStreams(bytes, text)) {
    const n = largestCount(inner);
    if (n !== null) best = Math.max(best ?? 0, n);
  }
  return best !== null && best > 0 ? best : null;
}
