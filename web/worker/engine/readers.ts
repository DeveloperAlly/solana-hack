// Source readers a 'fetch' step can name (issue #64 on the #33 adapters). Each reader turns a step's arguments into
// one adapter call; the adapter decides the source kind and trust (sources/registry.ts), and this module only shapes
// the result for a durable step: text capped for the Workflows 1 MiB step-output limit
// (https://developers.cloudflare.com/workflows/reference/limits/), page offsets into that text, and a failure turned
// into an error the runner can classify (4xx stops retries; engine/runner.ts classify).
//
// Not registered: the document adapter (sources/document.ts). It reads uploaded bytes, and there is no upload store a
// run could read them from yet, so a run cannot reach a document until one exists.
import { HttpError, type Env } from '../env';
import { PASTE_MAX_CHARS, readPaste } from '../sources/paste';
import { SOURCE_TYPES, urlKind, type SourceKind } from '../sources/registry';
import { readSite } from '../sources/site';
import type { FailureCode, SourceResult } from '../sources/types';

/**
 * The longest prefix of `s` within `maxUnits` UTF-16 units and `maxBytes` UTF-8 bytes, never splitting a character
 * (TextEncoder.encodeInto stops before a character that does not fit and reports how many units it read).
 */
export function capText(s: string, maxUnits: number, maxBytes: number) {
  let t = s.slice(0, maxUnits);
  if (/[\uD800-\uDBFF]$/.test(t)) t = t.slice(0, -1);
  const { read } = new TextEncoder().encodeInto(t, new Uint8Array(maxBytes));
  return t.slice(0, read ?? t.length);
}

const asText = (v: unknown) => (typeof v === 'string' ? v : '');

export const READERS: Record<string, (env: Env, args: Record<string, unknown>) => Promise<SourceResult>> = {
  /** A web link: the brand's site (home page plus key subpages) or a third-party page, per sources/site.ts. */
  site: (env, a) => readSite(env, asText(a.url), { website: typeof a.website === 'string' && a.website ? a.website : null }),
  /** Text the owner pasted (sources/paste.ts). */
  paste: async (_env, a) => readPaste({ text: asText(a.text), name: typeof a.name === 'string' ? a.name : undefined }),
};

/**
 * What a reader needs from a request, checked before any row is written: the arguments its run passes to the reader
 * (the read step's `args`; the run adds `sourceId`), and the source row the run reads into: either a new one to create
 * (`source`, its kind declared in sources/registry.ts so its facts get a trust class), or an existing row of this brand
 * (`sourceId`, e.g. one an upload route created with its text in sources.source_text).
 */
export interface ReaderInput {
  args: Record<string, string>;
  source?: { url: string; kind: SourceKind; title?: string };
  sourceId?: string;
}
/** The brand a reader's input is checked for. */
export interface ReaderBrand { id: string; website?: string | null }
/** Checks a request body for one reader; throws an HttpError (4xx) for input that reader cannot use. */
export type ReaderInputCheck = (env: Env, brand: ReaderBrand, body: Record<string, unknown>) => Promise<ReaderInput>;

const MAX_LINK = 500;
/** Input checks, one per reader, keyed like READERS (registerReader keeps the two in step). */
export const READER_INPUTS: Record<string, ReaderInputCheck> = {
  /** A link: http(s) only, at most 500 characters (the length sources.url has always been cut to: engine/api.ts). */
  site: async (_env, brand, body) => {
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!url) throw new HttpError(400, 'a link is required');
    if (url.length > MAX_LINK) throw new HttpError(400, `that link is longer than ${MAX_LINK} characters`);
    let u: URL;
    try { u = new URL(url); } catch { throw new HttpError(400, 'that is not a link we can read'); }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new HttpError(400, 'only http and https links can be read');
    const website = brand.website ?? '';
    // 'site' only for a link on the brand's own website (registry.ts urlKind, issue #57); the adapter classifies again
    // on the page actually read, since a redirect can leave the website.
    return { args: { url, website }, source: { url, kind: urlKind(url, website) } };
  },
  /** Pasted text, with an optional name: the paste adapter's own limits (sources/paste.ts). The source row has no link. */
  paste: async (_env, _brand, body) => {
    const text = typeof body.text === 'string' ? body.text : '';
    if (!text.trim()) throw new HttpError(400, 'paste the text you want us to read');
    if (text.length > PASTE_MAX_CHARS) throw new HttpError(413, `that is longer than ${PASTE_MAX_CHARS.toLocaleString('en')} characters`);
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    return { args: { text, name }, source: { url: '', kind: 'paste', title: name || 'Pasted text' } };
  },
};

/** Adds a reader and its input check together, so a reader can never be startable without one. */
export function registerReader(name: string, read: (typeof READERS)[string], input: ReaderInputCheck) {
  READERS[name] = read;
  READER_INPUTS[name] = input;
}

/** The checked input for a named reader. Unknown readers are a bad request. A check must name exactly one of a new
 * source (of a kind sources/registry.ts declares) or an existing source id; anything else is a programming error,
 * refused before anything is written. */
export async function readerInput(env: Env, reader: string, brand: ReaderBrand, body: Record<string, unknown>): Promise<ReaderInput> {
  if (!Object.hasOwn(READERS, reader) || !Object.hasOwn(READER_INPUTS, reader)) throw new HttpError(400, `unknown source reader ${reader}`);
  const input = await READER_INPUTS[reader](env, brand, body);
  if (!!input.source === !!input.sourceId) throw new HttpError(500, `reader ${reader} must name either a new source or an existing one`);
  if (input.source && !Object.hasOwn(SOURCE_TYPES, input.source.kind)) throw new HttpError(500, `reader ${reader} gave an undeclared source kind ${input.source.kind}`);
  return input;
}

/** HTTP status for each adapter failure. 4xx: the same input will fail again, so the run stops; 5xx: worth a retry. */
export const STATUS: Record<FailureCode, number> = {
  invalid_input: 400, robots_disallowed: 403, unsupported_type: 415, too_large: 413, empty: 422, needs_ocr: 422,
  // Every reading path already failed inside the adapter; its reason tells the person to paste the text instead.
  unreadable: 422,
  not_configured: 503,
};

export interface ReadStepOutput {
  kind: string;
  trust: string;
  url?: string;
  name?: string;
  title: string;
  /** The text quotes are checked against and offsets point into; stored whole as sources.source_text. */
  text: string;
  /** True when the adapter's text was longer than the step may carry. */
  truncated: boolean;
  /** For a multi-page source, where each page sits in `text` (pages cut off by the cap are left out). */
  pages: { url: string; title: string; start: number; end: number }[];
  meta: { pages: number; cost: number; ms: number; via?: string; notes: string[] };
}

/** Reads a source with the named reader and shapes the result for a step. */
export async function readSource(env: Env, reader: string, args: Record<string, unknown>, maxChars: number, maxBytes: number): Promise<ReadStepOutput> {
  const read = Object.hasOwn(READERS, reader) ? READERS[reader] : undefined;
  if (!read) throw new HttpError(500, `unknown source reader ${reader}`);
  const r = await read(env, args);
  if (!r.ok) throw new HttpError(STATUS[r.code], r.reason);
  const text = capText(r.text, maxChars, maxBytes);
  const pages: ReadStepOutput['pages'] = [];
  let at = 0;
  for (const p of r.pages ?? []) {
    const start = p.text ? r.text.indexOf(p.text, at) : -1;
    if (start < 0 || start + p.text.length > text.length) continue;
    pages.push({ url: p.url, title: p.title, start, end: start + p.text.length });
    at = start + p.text.length;
  }
  return { kind: r.kind, trust: r.trust, url: r.url, name: r.name, title: r.title, text, truncated: text.length < r.text.length, pages, meta: r.meta };
}
