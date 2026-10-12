import { pdfPageCount } from './pdfpages';
import { factTrust } from './registry';
import { clock, contentCount, letterCount, type ConversionResult, type SourceEnv, type SourceResult } from './types';

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

/**
 * A line that is only a page number, with an optional total: "3", "- 3 -", "(3)", "[3]", "3/10", "Page 3", "Page 3 of
 * 10". Only the decorations page numbering uses are allowed around it (spaces, dashes, brackets, a middle dot, a
 * closing full stop), so "1%" or "$2" is a value, never a page number (PR #71 review).
 */
const PAGE_LABEL = /^[\s\-\u2013\u2014(\[\u00b7]*(?:page|pg\.?|p\.)?\s*(\d{1,4})(?:\s*(?:of|\/|\|)\s*(\d{1,4}))?[\s\-\u2013\u2014)\]\u00b7.]*$/iu;

/**
 * Letters and digits in the document's text, page numbers aside. A line counts as a page number only when it names
 * the page it is on (and, if it gives a total, the document's page count), using the converter's own page breaks, so
 * a figure such as "2026" or "42%" is never mistaken for one (PR #71 review). A PDF counts as having no text layer only
 * when this is zero; repeated or sparse text is kept, with a note when sparse.
 */
export function contentChars(pageTexts: string[]): number {
  const total = pageTexts.length;
  const isLabel = (line: string, page: number) => {
    const m = PAGE_LABEL.exec(line);
    return !!m && Number(m[1]) === page && (m[2] === undefined || Number(m[2]) === total);
  };
  return pageTexts.reduce((sum, text, i) => sum + contentCount(text.split('\n').map((l) => l.trim()).filter((l) => l && !isLabel(l, i + 1)).join('\n')), 0);
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
 * `declaredPages` is the page count the PDF itself declares (pdfpages.ts): no heading past it is removed, so a
 * document whose own text reads "### Page 2" keeps it when the PDF has one page (PR #71 review). Without it (the count
 * could not be read), every heading in the sequence is removed.
 * Metadata letters (title, producer) must not make a scan look like it has text, which is why the wrapper is removed.
 */
export function readableText(markdown: string, name: string, declaredPages: number | null = null): { body: string; pages: number; wrapped: boolean; pageTexts: string[] } {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const whole = { body: markdown.trim(), pages: 1, wrapped: false, pageTexts: [markdown.trim()] };
  if (lines[0]?.trim() !== `# ${name}` || lines[1]?.trim() !== '## Metadata') return whole;
  let i = 2;
  for (; i < lines.length && lines[i].trim() !== '## Contents'; i++) if (lines[i].trim() && !lines[i].startsWith('- ')) return whole;
  if (i >= lines.length) return whole;
  const content = lines.slice(i + 1);
  const headingOf = (line: string) => {
    const m = /^### Page (\d{1,5})$/.exec(line.trim());
    return m ? Number(m[1]) : null;
  };
  const seen = new Map<number, number>();
  for (const line of content) {
    const n = headingOf(line);
    if (n !== null) seen.set(n, (seen.get(n) ?? 0) + 1);
  }
  const limit = declaredPages ?? Number.POSITIVE_INFINITY;
  // A "### Page N" line is taken as the converter's page break only when nothing else could be: it is the next number
  // in sequence, within the page count the PDF declares, and it appears exactly once. A number that appears more than
  // once may be the document's own text, and the output carries nothing that says which copy is the break, so every
  // copy is kept as text and that boundary is left unknown (its page's text joins the page before) rather than guessed
  // (PR #71 review). Later breaks still count: a skipped number is passed over only when it is one of these ambiguous ones.
  const isBreak = (n: number, last: number) => {
    if (n <= last || n > limit || seen.get(n) !== 1) return false;
    for (let k = last + 1; k < n; k++) if ((seen.get(k) ?? 0) < 2) return false;
    return true;
  };
  let last = 0;
  const body: string[] = [];
  // Text per page, so a page number can be checked against the page it is on; text before "### Page 1" joins page 1.
  const perPage: string[][] = [[]];
  for (const line of content) {
    const n = headingOf(line);
    if (n !== null && isBreak(n, last)) {
      if (last > 0) perPage.push([]);
      last = n;
      continue;
    }
    body.push(line);
    perPage[perPage.length - 1].push(line);
  }
  return { body: body.join('\n').trim(), pages: declaredPages ?? (last || 1), wrapped: true, pageTexts: perPage.map((x) => x.join('\n').trim()) };
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
  // Size first, on the input as given, so an oversized upload is refused before any copy is made (PR #71 review).
  const max = input.maxBytes ?? DOC_MAX_BYTES;
  const size = input.bytes.byteLength;
  if (size > max) return fail('too_large', `That file is over ${Math.round(max / 1024 / 1024)} MB; upload a smaller copy, or paste the key points.`);
  if (size === 0) return fail('empty', 'That file is empty; upload it again.');
  // Then a copy on a plain ArrayBuffer, the type Blob accepts (a view could sit on a SharedArrayBuffer).
  const bytes = new Uint8Array(input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes));
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
  // The PDF's own page count bounds which "### Page N" headings are the converter's (PR #71 review).
  const declared = extension === 'pdf' ? await pdfPageCount(bytes) : null;
  const { body, pages, pageTexts } = readableText(out.data, out.name || name, declared);
  const letters = letterCount(body);
  if (extension === 'pdf') {
    // needs_ocr only when no text came through apart from page labels; sparse text is kept (PR #71 review).
    if (contentChars(pageTexts) === 0) {
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
