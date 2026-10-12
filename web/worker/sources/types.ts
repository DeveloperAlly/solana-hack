import type { SourceKind, Trust } from './registry';

/**
 * The contract every source adapter returns (issue #33, backlog X6). Adapters are pure modules: they read one source
 * and return its text, or a typed failure with a reason a person can act on. They never throw, never write to the
 * database, and never call a model; the run engine (#32) stores the result and runs extraction on it.
 */
export interface SourcePage { url: string; title: string; text: string }

export interface SourceMeta {
  /** Pages (or documents) read. */
  pages: number;
  /** Estimated external cost in US dollars for this read (0 when only free services were used). */
  cost: number;
  /** Wall-clock time of the read, in milliseconds. */
  ms: number;
  /** Which path produced the text: exa, fetch, rendered, paste or tomarkdown. */
  via?: string;
  /** Plain notes on fallbacks taken, for the run log and the person (for example "Exa is not configured"). */
  notes: string[];
}

export interface SourceOk {
  ok: true;
  kind: SourceKind;
  trust: Trust;
  /** The page address for web sources. */
  url?: string;
  /** The file or paste name for uploads and pasted text. */
  name?: string;
  title: string;
  /** All readable text, the text that quotes are checked against. For a site, every page joined in order. */
  text: string;
  /** For a site, each page on its own, so each can be stored and quote-checked as its own source. */
  pages?: SourcePage[];
  meta: SourceMeta;
}

export type FailureCode =
  | 'invalid_input' // not a web address, empty paste, no file name
  | 'robots_disallowed' // the site's robots.txt asks crawlers not to read the page
  | 'unreadable' // every reading path failed; the person can paste the text instead
  | 'needs_ocr' // a document with no text layer (a scan); OCR is not built yet
  | 'unsupported_type' // a file type the converter does not accept
  | 'too_large' // over the upload limit
  | 'empty' // read, but nothing to use
  | 'not_configured'; // the service this adapter needs is not set up

export interface SourceFail {
  ok: false;
  kind: SourceKind;
  code: FailureCode;
  /** One sentence for the person: what happened and what to do next. */
  reason: string;
  url?: string;
  name?: string;
  meta: SourceMeta;
}

export type SourceResult = SourceOk | SourceFail;

/** A ConversionResult from Workers AI markdown conversion (https://developers.cloudflare.com/workers-ai/features/markdown-conversion/usage/binding/). */
export interface ConversionResult { name: string; format: 'markdown' | 'text' | 'error'; mimetype?: string; tokens?: number; data?: string; error?: string }

/** The bindings and secrets the adapters may use; every one is optional, and each adapter says what it did without one. */
export interface SourceEnv {
  /** Exa API key (secret). Without it the site adapter falls back to a plain fetch. */
  EXA_API_KEY?: string;
  /** Workers AI binding (wrangler.jsonc "ai"), for document conversion. */
  AI?: { toMarkdown(files: { name: string; blob: Blob }[]): Promise<ConversionResult[] | ConversionResult> };
  /** Cloudflare account id and an API token with "Browser Run - Edit", for rendered Markdown of script-only sites. */
  CF_ACCOUNT_ID?: string;
  CF_BROWSER_TOKEN?: string;
}

/** Times an adapter and records its notes, so every result carries the same meta. */
export function clock() {
  const start = Date.now();
  const notes: string[] = [];
  return {
    notes,
    meta: (pages: number, cost: number, via?: string): SourceMeta => ({ pages, cost: Math.round(cost * 10000) / 10000, ms: Date.now() - start, via, notes }),
  };
}

/** Counts letters in any script; markup, digits, punctuation and whitespace do not count. */
export const letterCount = (s: string) => (s.match(/\p{L}/gu) ?? []).length;
/** Letters and digits in any script: what makes text real content, so numbers-only text (an invoice table, a price
 * list, metrics) counts (PR #71 review). Used by the paste and document adapters alike. */
export const contentCount = (s: string) => (s.match(/[\p{L}\p{N}]/gu) ?? []).length;
