// Source readers a 'fetch' step can name (issue #64 on the #33 adapters). Each reader turns a step's arguments into
// one adapter call; the adapter decides the source kind and trust (sources/registry.ts), and this module only shapes
// the result for a durable step: text capped for the Workflows 1 MiB step-output limit
// (https://developers.cloudflare.com/workflows/reference/limits/), page offsets into that text, and a failure turned
// into an error the runner can classify (4xx stops retries; engine/runner.ts classify).
//
// Not registered: the document adapter (sources/document.ts). It reads uploaded bytes, and there is no upload store a
// run could read them from yet, so a run cannot reach a document until one exists.
import { HttpError, type Env } from '../env';
import { readPaste } from '../sources/paste';
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
  site: (env, a) => readSite(env, asText(a.url), { website: typeof a.website === 'string' ? a.website : null }),
  /** Text the owner pasted (sources/paste.ts). */
  paste: async (_env, a) => readPaste({ text: asText(a.text), name: typeof a.name === 'string' ? a.name : undefined }),
};

/** HTTP status for each adapter failure. 4xx: the same input will fail again, so the run stops; 5xx: worth a retry. */
const STATUS: Record<FailureCode, number> = {
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
  const read = READERS[reader];
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
