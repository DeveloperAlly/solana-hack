import { factTrust } from './registry';
import { clock, letterCount, type ConversionResult, type SourceEnv, type SourceResult } from './types';

/**
 * Document adapter (issue #33; architecture §6.1 "Source ingestion", accepted 2026-10-12): PDF, DOCX and XLSX bytes
 * converted to Markdown by Workers AI `env.AI.toMarkdown`, which is free for these formats
 * (https://developers.cloudflare.com/workers-ai/features/markdown-conversion/). A PDF with no text layer (a scan)
 * comes back with no text of its own; that is returned as `needs_ocr` (OCR itself is not built yet; architecture §6.1
 * names an OCR engine for scanned PDFs). A PDF with little text (a flyer, a certificate, a sparse slide export) keeps
 * what it has, with a note (PR #71 review). PPTX is not a supported format
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
// Fewer letters than this per page (or in total) gets a note that parts of the PDF may be scanned images; the text that
// did come through is still used. A starting value, to calibrate on the fixtures in architecture §13 (F1 holds each
// brand's documents).
export const MIN_LETTERS_PER_PAGE = 40;
export const MIN_LETTERS = 200;

/** Letters and digits in any script: the characters that make a line real extracted text. */
const contentCount = (s: string) => (s.match(/[\p{L}\p{N}]/gu) ?? []).length;
/** A bare page number such as "3", "- 3 -" or "3/10", which a scanner can stamp on a page with no text layer. */
const bareNumber = (line: string) => /^[\s\p{P}]*\d{1,4}(?:\s*[/|]\s*\d{1,4})?[\s\p{P}]*$/u.test(line);

/**
 * Letters and digits in the lines that are the document's own text, so a text PDF of only numbers and symbols (an
 * invoice table, a price sheet) counts as text (PR #71 review). Not counted: a bare page number, and, in a PDF of two
 * or more pages, a line that appears on every page (digits ignored, so "Page 3 of 10" matches "Page 4 of 10"), which
 * is a running header or footer a scanner can stamp on pages with no text layer.
 */
export function contentChars(body: string, pages: number): number {
  const key = (line: string) => line.trim().replace(/\d+/g, '#').toLowerCase();
  const lines = body.split('\n').filter((l) => l.trim() && !bareNumber(l));
  if (pages < 2) return contentCount(lines.join('\n'));
  const seen = new Map<string, number>();
  for (const l of lines) seen.set(key(l), (seen.get(key(l)) ?? 0) + 1);
  return contentCount(lines.filter((l) => (seen.get(key(l)) ?? 0) < pages).join('\n'));
}

export interface DocumentInput { name: string; bytes: ArrayBuffer | Uint8Array; maxBytes?: number }

const ext = (name: string) => name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';

/**
 * The readable part of a conversion and its page count. For a PDF the converter wraps the text in a fixed layout,
 * shown in Cloudflare's own example output (https://developers.cloudflare.com/changelog/post/2025-03-20-markdown-conversion/):
 *   "# <file name>\n## Metadata\n- Key=Value ...\n\n## Contents\n### Page 1\n..."
 * Only that exact wrapper is removed: the first line must be "# " plus the file name, the next "## Metadata", every
 * line up to the first "## Contents" must be a "- " metadata entry, and page headings are removed only as
 * "### Page 1", "### Page 2", ... in order. A document's own "Contents" or "Page" heading anywhere else is kept
 * (PR #67 review), and output without the wrapper (DOCX, XLSX, or a changed layout) is kept whole as one page.
 * Metadata letters (title, producer) must not make a scan look like it has text, which is why the wrapper is removed.
 */
export function readableText(markdown: string, name: string): { body: string; pages: number; wrapped: boolean } {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const whole = { body: markdown.trim(), pages: 1, wrapped: false };
  if (lines[0]?.trim() !== `# ${name}` || lines[1]?.trim() !== '## Metadata') return whole;
  let i = 2;
  for (; i < lines.length && lines[i].trim() !== '## Contents'; i++) if (lines[i].trim() && !lines[i].startsWith('- ')) return whole;
  if (i >= lines.length) return whole;
  let pages = 0;
  const body: string[] = [];
  for (const line of lines.slice(i + 1)) {
    if (line.trim() === `### Page ${pages + 1}`) { pages++; continue; }
    body.push(line);
  }
  return { body: body.join('\n').trim(), pages: pages || 1, wrapped: true };
}

export async function readDocument(env: SourceEnv, input: DocumentInput): Promise<SourceResult> {
  const c = clock();
  const { trust } = factTrust('document');
  // The type comes from the full name; only the name kept for display is shortened (PR #67 review).
  const fullName = (input.name ?? '').trim();
  const extension = ext(fullName);
  // At most 200 characters, keeping the extension at the end so the shortened name still says what the file is.
  const name = fullName.length <= 200 ? fullName : extension ? `${fullName.slice(0, 199 - extension.length - 1)}….${extension}` : fullName.slice(0, 200);
  const fail = (code: 'invalid_input' | 'unsupported_type' | 'too_large' | 'not_configured' | 'unreadable' | 'needs_ocr' | 'empty', reason: string, pages = 0) =>
    ({ ok: false as const, kind: 'document' as const, code, reason, name: name || undefined, meta: c.meta(pages, 0, 'tomarkdown') });
  if (!name) return fail('invalid_input', 'The file has no name; upload it again.');
  const type = DOC_TYPES[extension];
  if (!type) {
    return extension === 'pptx' || extension === 'ppt'
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
  // The converter echoes the input name (ConversionResult.name, binding docs above).
  const { body, pages } = readableText(out.data, out.name || name);
  const letters = letterCount(body);
  if (extension === 'pdf') {
    // needs_ocr only when no text of the document's own came through; sparse text is kept (PR #71 review).
    if (contentChars(body, pages) === 0) {
      return fail('needs_ocr', 'This file has no readable text (it looks like a scan). Export it with text, or paste the key points.', pages);
    }
    if (letters < MIN_LETTERS || letters / pages < MIN_LETTERS_PER_PAGE) {
      c.notes.push(`only ${letters} letters came through across ${pages} page(s); if parts of the file are scanned images, paste their key points`);
    }
  } else if (letters === 0 && contentCount(body) === 0) {
    return fail('empty', `This ${type.label} has no text we can use; paste the key points instead.`, pages);
  }
  const title = (body.match(/^#\s+(.+)$/m)?.[1] ?? name).trim().slice(0, 200);
  return { ok: true, kind: 'document', trust, name, title, text: body, meta: c.meta(pages, 0, 'tomarkdown') };
}
