import { factTrust } from './registry';
import { clock, letterCount, type ConversionResult, type SourceEnv, type SourceResult } from './types';

/**
 * Document adapter (issue #33; architecture §6.1 "Source ingestion", accepted 2026-10-12): PDF, DOCX and XLSX bytes
 * converted to Markdown by Workers AI `env.AI.toMarkdown`, which is free for these formats
 * (https://developers.cloudflare.com/workers-ai/features/markdown-conversion/). A PDF with no text layer (a scan)
 * comes back nearly empty; that is returned as `needs_ocr` (OCR itself is not built yet; architecture §6.1 names an OCR
 * engine for scanned PDFs). PPTX is not a supported format
 * (https://developers.cloudflare.com/workers-ai/features/markdown-conversion/supported-formats/), so it is refused
 * with a way forward.
 */
export const DOC_TYPES: Record<string, { mime: string; label: string }> = {
  pdf: { mime: 'application/pdf', label: 'PDF' },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word document' },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel spreadsheet' },
};
// Plan v2 §5: "Max upload 15 MB (config)". The engine passes the config value; this is the default.
export const DOC_MAX_BYTES = 15 * 1024 * 1024;
// Fewer letters than this per page (and in total) reads as a scan with no text layer. A starting value, to calibrate
// on the fixtures in architecture §13 (F1 holds each brand's documents).
export const MIN_LETTERS_PER_PAGE = 40;
export const MIN_LETTERS = 200;

export interface DocumentInput { name: string; bytes: ArrayBuffer | Uint8Array; maxBytes?: number }

const ext = (name: string) => name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';

/**
 * The readable part of a conversion and its page count. The output layout is UNVERIFIED: Cloudflare's docs define
 * `data` only as "the content of the converted document" and show no PDF output
 * (https://developers.cloudflare.com/workers-ai/features/markdown-conversion/usage/binding/). The converter is
 * expected to add a metadata block and per-page headings, so both are handled when present and optional when not:
 * metadata letters (title, producer, dates) must not make a scan look like it has text. To confirm on a live call.
 */
export function readableText(markdown: string): { body: string; pages: number } {
  const contents = markdown.split(/^#{1,6}\s*Contents\s*$/m);
  const body = contents.length > 1 ? contents.slice(1).join('\n') : markdown.replace(/^#{1,6}\s*Metadata\s*$[\s\S]*?(?=^#{1,6}\s)/m, '');
  const pageHeads = body.match(/^#{1,6}\s*Page\s+\d+\s*$/gim) ?? [];
  return { body: body.replace(/^#{1,6}\s*Page\s+\d+\s*$/gim, '').trim(), pages: pageHeads.length || 1 };
}

export async function readDocument(env: SourceEnv, input: DocumentInput): Promise<SourceResult> {
  const c = clock();
  const { trust } = factTrust('document');
  const name = (input.name ?? '').trim().slice(0, 200);
  const fail = (code: 'invalid_input' | 'unsupported_type' | 'too_large' | 'not_configured' | 'unreadable' | 'needs_ocr' | 'empty', reason: string, pages = 0) =>
    ({ ok: false as const, kind: 'document' as const, code, reason, name: name || undefined, meta: c.meta(pages, 0, 'tomarkdown') });
  if (!name) return fail('invalid_input', 'The file has no name; upload it again.');
  const type = DOC_TYPES[ext(name)];
  if (!type) {
    return ext(name) === 'pptx' || ext(name) === 'ppt'
      ? fail('unsupported_type', 'Slides cannot be read yet; export the deck as a PDF and upload that.')
      : fail('unsupported_type', 'We read PDF, Word (DOCX) and Excel (XLSX) files; export the file as one of those, or paste its text.');
  }
  // A copy on a plain ArrayBuffer, the type Blob accepts (a view could sit on a SharedArrayBuffer).
  const bytes = new Uint8Array(input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes));
  const max = input.maxBytes ?? DOC_MAX_BYTES;
  if (bytes.byteLength > max) return fail('too_large', `That file is over ${Math.round(max / 1024 / 1024)} MB; upload a smaller copy, or paste the key points.`);
  if (bytes.byteLength === 0) return fail('empty', 'That file is empty; upload it again.');
  if (!env.AI?.toMarkdown) return fail('not_configured', 'Document reading is not set up yet; paste the key points instead.');
  let out: ConversionResult | undefined;
  try {
    const r = await env.AI.toMarkdown([{ name, blob: new Blob([bytes], { type: type.mime }) }]);
    out = Array.isArray(r) ? r[0] : r;
  } catch {
    return fail('unreadable', `We could not read this ${type.label} just now; try again, or paste the key points.`);
  }
  if (!out || out.format === 'error' || typeof out.data !== 'string') return fail('unreadable', `We could not read this ${type.label}; export it again, or paste the key points.`);
  const { body, pages } = readableText(out.data);
  const letters = letterCount(body);
  if (ext(name) === 'pdf' && (letters < MIN_LETTERS || letters / pages < MIN_LETTERS_PER_PAGE)) {
    return fail('needs_ocr', 'This file has no readable text (it looks like a scan). Export it with text, or paste the key points.', pages);
  }
  if (letters === 0) return fail('empty', `This ${type.label} has no text we can use; paste the key points instead.`, pages);
  const title = (body.match(/^#\s+(.+)$/m)?.[1] ?? name).trim().slice(0, 200);
  return { ok: true, kind: 'document', trust, name, title, text: body, meta: c.meta(pages, 0, 'tomarkdown') };
}
