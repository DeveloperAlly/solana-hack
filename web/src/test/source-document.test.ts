import { describe, expect, it, vi } from 'vitest';
import { DOC_MAX_BYTES, readableText, readDocument } from '../../worker/sources/document';
import type { ConversionResult, SourceEnv } from '../../worker/sources/types';

// Document adapter (issue #33). Workers AI toMarkdown is mocked.
const bytes = new Uint8Array([37, 80, 68, 70]);
const ai = (out: ConversionResult | Error) => ({ toMarkdown: vi.fn(async () => { if (out instanceof Error) throw out; return [out]; }) });
const prose = 'JamJam helps brands prove what they say. Every fact is tied to a quote from its source, and nothing is published without approval.';

describe('document adapter', () => {
  it('converts a PDF with Workers AI and keeps only the readable part', async () => {
    const env: SourceEnv = { AI: ai({ name: 'deck.pdf', format: 'markdown', data: `# deck.pdf\n## Metadata\n- Producer: Keynote\n## Contents\n### Page 1\n# JamJam deck\n${prose}\n### Page 2\n${prose}` }) };
    const r = await readDocument(env, { name: 'deck.pdf', bytes });
    expect(r).toMatchObject({ ok: true, kind: 'document', trust: 'owned', name: 'deck.pdf', title: 'JamJam deck', meta: { pages: 2, cost: 0, via: 'tomarkdown' } });
    expect(r.ok && r.text).not.toContain('Producer');
    const call = (env.AI!.toMarkdown as ReturnType<typeof vi.fn>).mock.calls[0][0] as { name: string; blob: Blob }[];
    expect(call[0].name).toBe('deck.pdf');
    expect(call[0].blob.type).toBe('application/pdf');
  });
  it('returns needs_ocr for a scanned PDF (metadata only, no text layer)', async () => {
    const env: SourceEnv = { AI: ai({ name: 'scan.pdf', format: 'markdown', data: '# scan.pdf\n## Metadata\n- Title: Company overview presentation for investors\n- Producer: Scanner Pro\n## Contents\n### Page 1\n\n### Page 2\n\n### Page 3\n' }) };
    const r = await readDocument(env, { name: 'scan.pdf', bytes });
    expect(r).toMatchObject({ ok: false, code: 'needs_ocr', reason: expect.stringContaining('no readable text'), meta: { pages: 3 } });
  });
  it('keeps the text of a short text PDF, with a note, instead of calling it a scan (PR #71 review)', async () => {
    const flyer = '# flyer.pdf\n## Metadata\n- Producer=Canva\n\n## Contents\n### Page 1\n# Launch night\nJamJam, Friday 7pm, Footscray.\n';
    const one = await readDocument({ AI: ai({ name: 'flyer.pdf', format: 'markdown', data: flyer }) }, { name: 'flyer.pdf', bytes });
    expect(one).toMatchObject({ ok: true, title: 'Launch night', meta: { pages: 1 } });
    expect(one.ok && one.text).toContain('Friday 7pm');
    expect(one.meta.notes.join(' ')).toMatch(/only \d+ letters came through/);
    const slides = Array.from({ length: 5 }, (_, i) => `### Page ${i + 1}\n${['Why us', 'Proof', 'Pricing', 'Team', 'Contact'][i]}`).join('\n');
    const deck = await readDocument({ AI: ai({ name: 'd.pdf', format: 'markdown', data: `# d.pdf\n## Metadata\n- Producer=Keynote\n\n## Contents\n${slides}` }) }, { name: 'd.pdf', bytes });
    expect(deck).toMatchObject({ ok: true, meta: { pages: 5 } });
    expect(deck.ok && deck.text).toContain('Pricing');
  });
  it('keeps a text PDF of only numbers and symbols, such as an invoice table (PR #71 review)', async () => {
    const table = '# inv.pdf\n## Metadata\n- Producer=Xero\n\n## Contents\n### Page 1\n| 2026-10-01 | $1,000 | 42% |\n| 2026-10-08 | $2,500 | 7% |\n';
    const r = await readDocument({ AI: ai({ name: 'inv.pdf', format: 'markdown', data: table }) }, { name: 'inv.pdf', bytes });
    expect(r).toMatchObject({ ok: true });
    expect(r.ok && r.text).toContain('$2,500');
    // A bare page number alone is not text: a one-page scan stamped "1" still needs OCR.
    const stamped = await readDocument({ AI: ai({ name: 's1.pdf', format: 'markdown', data: '# s1.pdf\n## Metadata\n- Producer=Scanner\n\n## Contents\n### Page 1\n- 1 -\n' }) }, { name: 's1.pdf', bytes });
    expect(stamped).toMatchObject({ ok: false, code: 'needs_ocr' });
  });
  it('returns needs_ocr when only page labels come through', async () => {
    const pages = Array.from({ length: 10 }, (_, i) => `### Page ${i + 1}\nPage ${i + 1} of 10`).join('\n');
    const data = `# s.pdf\n## Metadata\n- Producer=Scanner\n\n## Contents\n${pages}`;
    const r = await readDocument({ AI: ai({ name: 's.pdf', format: 'markdown', data }) }, { name: 's.pdf', bytes });
    expect(r).toMatchObject({ ok: false, code: 'needs_ocr' });
  });
  it('keeps values such as 1% even on the page with the same number (PR #71 review)', async () => {
    const data = '# v.pdf\n## Metadata\n- Producer=Keynote\n\n## Contents\n### Page 1\n1%\n### Page 2\n2%\n';
    const r = await readDocument({ AI: ai({ name: 'v.pdf', format: 'markdown', data }) }, { name: 'v.pdf', bytes });
    expect(r).toMatchObject({ ok: true, meta: { pages: 2 } });
    // Real page numbering with its usual decorations is still recognised.
    const scan = '# s3.pdf\n## Metadata\n- Producer=Scanner\n\n## Contents\n### Page 1\n- 1 -\n### Page 2\n(2)\n### Page 3\nPage 3 of 3.\n';
    expect(await readDocument({ AI: ai({ name: 's3.pdf', format: 'markdown', data: scan }) }, { name: 's3.pdf', bytes })).toMatchObject({ ok: false, code: 'needs_ocr' });
    expect(r.ok && r.text).toContain('1%');
  });
  it('refuses an oversized upload before copying it (PR #71 review)', async () => {
    const big = new Uint8Array(32);
    const env: SourceEnv = { AI: ai({ name: 'x', format: 'markdown', data: prose }) };
    // Count every Uint8Array the adapter constructs: none may be made for a file it refuses for size.
    const OrigU8 = globalThis.Uint8Array;
    let copies = 0;
    globalThis.Uint8Array = new Proxy(OrigU8, { construct(t, a) { copies++; return Reflect.construct(t, a); } }) as typeof Uint8Array;
    try {
      expect(await readDocument(env, { name: 'big.pdf', bytes: big, maxBytes: 16 })).toMatchObject({ ok: false, code: 'too_large' });
    } finally {
      globalThis.Uint8Array = OrigU8;
    }
    expect(copies).toBe(0);
  });
  it('keeps figures such as 2026 or 42% that are not the page they sit on (PR #71 review)', async () => {
    const data = '# k.pdf\n## Metadata\n- Producer=Keynote\n\n## Contents\n### Page 1\n2026\n### Page 2\n42%\n### Page 3\n3\n';
    const r = await readDocument({ AI: ai({ name: 'k.pdf', format: 'markdown', data }) }, { name: 'k.pdf', bytes });
    expect(r).toMatchObject({ ok: true, meta: { pages: 3 } });
    expect(r.ok && r.text).toContain('42%');
  });
  it('keeps text repeated word for word on every page, such as a repeated form or terms (PR #71 review)', async () => {
    const pages = Array.from({ length: 3 }, (_, i) => `### Page ${i + 1}\nPayment terms: 30 days from invoice.\nPage ${i + 1} of 3`).join('\n');
    const data = `# t.pdf\n## Metadata\n- Producer=Word\n\n## Contents\n${pages}`;
    const r = await readDocument({ AI: ai({ name: 't.pdf', format: 'markdown', data }) }, { name: 't.pdf', bytes });
    expect(r).toMatchObject({ ok: true, meta: { pages: 3 } });
    expect(r.ok && r.text).toContain('Payment terms');
    expect(r.meta.notes.join(' ')).toMatch(/only \d+ letters came through/);
  });
  it('keeps one numeric row per page, which differ only in their figures (PR #71 review)', async () => {
    const data = '# r.pdf\n## Metadata\n- Producer=Xero\n\n## Contents\n### Page 1\n2026-10-01 | $1,000\n### Page 2\n2026-10-08 | $2,500\n';
    const r = await readDocument({ AI: ai({ name: 'r.pdf', format: 'markdown', data }) }, { name: 'r.pdf', bytes });
    expect(r).toMatchObject({ ok: true, meta: { pages: 2 } });
    expect(r.ok && r.text).toContain('$2,500');
  });
  it('reads DOCX and XLSX with their MIME types', async () => {
    for (const [name, mime] of [['brief.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], ['plan.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']]) {
      const env: SourceEnv = { AI: ai({ name, format: 'markdown', data: prose }) };
      expect(await readDocument(env, { name, bytes })).toMatchObject({ ok: true, title: name });
      expect(((env.AI!.toMarkdown as ReturnType<typeof vi.fn>).mock.calls[0][0] as { blob: Blob }[])[0].blob.type).toBe(mime);
    }
  });
  it('reads a supported file whose name is over 200 characters, keeping its extension (PR #67 review)', async () => {
    const long = `${'Quarterly brand narrative and positioning '.repeat(8)}final.docx`;
    const env: SourceEnv = { AI: ai({ name: 'x', format: 'markdown', data: prose }) };
    const r = await readDocument(env, { name: long, bytes });
    expect(r).toMatchObject({ ok: true });
    expect(r.ok && r.name?.length).toBe(200);
    expect(r.ok && r.name?.endsWith('….docx')).toBe(true);
  });
  it('refuses unsupported, empty and oversized files before calling the converter', async () => {
    const env: SourceEnv = { AI: ai({ name: 'x', format: 'markdown', data: prose }) };
    expect(await readDocument(env, { name: 'deck.pptx', bytes })).toMatchObject({ ok: false, code: 'unsupported_type', reason: expect.stringContaining('export the deck as a PDF') });
    expect(await readDocument(env, { name: 'photo.heic', bytes })).toMatchObject({ ok: false, code: 'unsupported_type' });
    expect(await readDocument(env, { name: 'a.pdf', bytes: new Uint8Array() })).toMatchObject({ ok: false, code: 'empty' });
    expect(await readDocument(env, { name: 'a.pdf', bytes: new Uint8Array(DOC_MAX_BYTES + 1) })).toMatchObject({ ok: false, code: 'too_large' });
    expect(await readDocument(env, { name: '', bytes })).toMatchObject({ ok: false, code: 'invalid_input' });
    expect(env.AI!.toMarkdown).not.toHaveBeenCalled();
  });
  it('turns a converter error or a missing binding into a typed failure, never a throw', async () => {
    expect(await readDocument({}, { name: 'a.pdf', bytes })).toMatchObject({ ok: false, code: 'not_configured' });
    expect(await readDocument({ AI: ai(new Error('boom')) }, { name: 'a.pdf', bytes })).toMatchObject({ ok: false, code: 'unreadable' });
    expect(await readDocument({ AI: ai({ name: 'a.pdf', format: 'error', error: 'bad file' }) }, { name: 'a.pdf', bytes })).toMatchObject({ ok: false, code: 'unreadable' });
  });
  it('reads output with no metadata or page headings as one page', () => {
    expect(readableText(prose, 'a.docx')).toMatchObject({ body: prose, pages: 1, wrapped: false });
  });
  it('strips Cloudflare\'s documented PDF wrapper (changelog 2025-03-20 example) and counts its pages', () => {
    const data = '# somatosensory.pdf\n## Metadata\n- PDFFormatVersion=1.4\n- Producer=Prince 20150210 (www.princexml.com)\n- Title=Anatomy of the Somatosensory System\n\n## Contents\n### Page 1\nThis is a sample document.\n### Page 2\nMore.';
    expect(readableText(data, 'somatosensory.pdf')).toMatchObject({ body: 'This is a sample document.\nMore.', pages: 2, wrapped: true });
  });
  it('keeps a document\'s own Contents and Page headings (PR #67 review)', () => {
    const docx = `# Brand brief\nIntro: ${prose}\n## Contents\n- Purpose\n## Page 2 notes`;
    expect(readableText(docx, 'brief.docx')).toMatchObject({ body: docx, pages: 1, wrapped: false });
    // Inside the wrapper, only the converter's own in-order page headings are removed.
    const pdf = `# a.pdf\n## Metadata\n- Title=x\n\n## Contents\n### Page 1\nIntro\n## Contents\n### Page 7\nkept\n### Page 2\nend`;
    expect(readableText(pdf, 'a.pdf')).toMatchObject({ body: 'Intro\n## Contents\n### Page 7\nkept\nend', pages: 2, wrapped: true });
  });
  it('a DOCX whose text has a Contents heading keeps everything before it', async () => {
    const data = `# Brand brief\n${prose}\n## Contents\n- Purpose`;
    const r = await readDocument({ AI: ai({ name: 'brief.docx', format: 'markdown', data }) }, { name: 'brief.docx', bytes });
    expect(r.ok && r.text).toContain(prose);
  });
});

// The PDF's own page tree bounds which "### Page N" headings are the converter's (PR #71 review).
describe('declared PDF page count', () => {
  const enc = (s: string) => new Uint8Array(Buffer.from(s, 'latin1'));
  const join = (...parts: Uint8Array[]) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) { out.set(p, at); at += p.length; }
    return out;
  };
  const catalog = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const plainPdf = (count: number, extra = '') => enc(`%PDF-1.4\n${catalog}2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count ${count}${extra} >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> >>\nendobj\ntrailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF\n`);
  const deflate = async (s: string | Buffer) => new Uint8Array((await import('node:zlib')).deflateSync(typeof s === 'string' ? Buffer.from(s, 'latin1') : s));
  // Catalog and page tree inside a Flate object stream, found through a cross-reference stream's /Root (PDF 1.5).
  const compressedPdf = async (count: number) => {
    const objs = `<< /Type /Catalog /Pages 2 0 R >> << /Type /Pages /Kids [3 0 R] /Count ${count} >>`;
    const second = objs.indexOf('<< /Type /Pages');
    const head = `1 0 2 ${second} `;
    const data = await deflate(head + objs);
    return join(
      enc('%PDF-1.5\n'),
      enc(`5 0 obj\n<< /Type /ObjStm /N 2 /First ${head.length} /Filter /FlateDecode /Length ${data.length} >>\nstream\n`),
      data,
      enc('\nendstream\nendobj\n6 0 obj\n<< /Type /XRef /Root 1 0 R /Size 7 /W [1 2 1] /Length 0 >>\nstream\n\nendstream\nendobj\n%%EOF\n'),
    );
  };
  const out = (name: string, contents: string) => ({ AI: ai({ name, format: 'markdown', data: `# ${name}\n## Metadata\n- Producer=Writer\n\n## Contents\n${contents}` }) });

  it('follows the catalog to the page tree, in plain objects and in compressed object streams', async () => {
    const { pdfPageCount } = await import('../../worker/sources/pdfpages');
    expect(await pdfPageCount(plainPdf(1))).toBe(1);
    expect(await pdfPageCount(plainPdf(12))).toBe(12);
    expect(await pdfPageCount(await compressedPdf(3))).toBe(3);
    // A count inside a nested dictionary is not the node's own.
    expect(await pdfPageCount(plainPdf(1, ' /X << /Count 7 >>'))).toBe(1);
    // Keys inside strings and comments are not keys: the catalog's real /Pages is 2 0 R, not the 9 0 R in its note.
    const noted = enc(`%PDF-1.4\n1 0 obj\n<< /Note (/Pages 9 0 R) /Hex <2F50> % /Pages 9 0 R\n /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 1 >>\nendobj\n9 0 obj\n<< /Type /Pages /Kids [] /Count 5 >>\nendobj\ntrailer\n<< /Size 10 /Root 1 0 R >>\n%%EOF\n`);
    expect(await pdfPageCount(noted)).toBe(1);
    expect(await pdfPageCount(new Uint8Array([37, 80, 68, 70]))).toBeNull();
  });
  it('reads the newest page tree after an incremental update, not a stale or unreferenced larger one', async () => {
    const { pdfPageCount } = await import('../../worker/sources/pdfpages');
    // Pages deleted in an update: the old tree said 3, the newest says 1.
    const updated = join(plainPdf(3), enc('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\ntrailer\n<< /Size 5 /Root 1 0 R /Prev 9 >>\n%%EOF\n'));
    expect(await pdfPageCount(updated)).toBe(1);
    // A larger page tree the catalog does not point to.
    const stray = join(plainPdf(1), enc('9 0 obj\n<< /Type /Pages /Kids [] /Count 5 >>\nendobj\n'));
    expect(await pdfPageCount(stray)).toBe(1);
    // Object and trailer tokens inside a content stream are not objects.
    const body = '9 0 obj << /Type /Pages /Count 9 >> endobj trailer << /Root 9 0 R >>';
    const inStream = join(plainPdf(1).subarray(0, plainPdf(1).length - 6), enc(`7 0 obj\n<< /Length ${body.length} >>\nstream\n${body}\nendstream\nendobj\n%%EOF\n`));
    expect(await pdfPageCount(inStream)).toBe(1);
  });
  it('reads an object stream whose "stream" keyword ends with a lone CR (PR #71 review)', async () => {
    const { pdfPageCount } = await import('../../worker/sources/pdfpages');
    const objs = '<< /Type /Catalog /Pages 2 0 R >> << /Type /Pages /Kids [] /Count 1 >>';
    const head = `1 0 2 ${objs.indexOf('<< /Type /Pages')} `;
    const data = await deflate(head + objs);
    expect(data[0]).not.toBe(0x0a);
    const pdf = join(
      enc(`%PDF-1.5\r5 0 obj\r<< /Type /ObjStm /N 2 /First ${head.length} /Filter /FlateDecode /Length ${data.length} >>\rstream\r`),
      data,
      enc('\rendstream\rendobj\r6 0 obj\r<< /Type /XRef /Root 1 0 R /Size 7 /W [1 2 1] /Length 0 >>\rstream\r\nendstream\rendobj\r%%EOF\r'),
    );
    expect(await pdfPageCount(pdf)).toBe(1);
  });
  it('finds trailers and objects only where they really are, not in strings or comments (PR #71 review)', async () => {
    const { pdfPageCount } = await import('../../worker/sources/pdfpages');
    const decoy = join(
      plainPdf(1),
      enc('9 0 obj\n<< /Type /Pages /Kids [] /Count 5 >>\nendobj\n8 0 obj\n<< /Type /Catalog /Pages 9 0 R >>\nendobj\n'),
      enc('10 0 obj\n(trailer << /Root 8 0 R >> 2 0 obj << /Type /Pages /Count 7 >>)\nendobj\n% trailer << /Root 8 0 R >>\n'),
    );
    expect(await pdfPageCount(decoy)).toBe(1);
  });
  it('reads only a dictionary\'s own keys: never from arrays, nested dictionaries, strings or comments (PR #71 review)', async () => {
    const { pdfPageCount } = await import('../../worker/sources/pdfpages');
    const pdf = (cat: string, pages: string) => enc(`%PDF-1.4\n1 0 obj\n${cat}\nendobj\n2 0 obj\n${pages}\nendobj\n9 0 obj\n<< /Type /Pages /Kids [] /Count 5 >>\nendobj\ntrailer\n<< /Size 10 /Root 1 0 R >>\n%%EOF\n`);
    const tree = '<< /Type /Pages /Kids [] /Count 1 >>';
    // A key-like name inside an array, before the real key.
    expect(await pdfPageCount(pdf('<< /Type /Catalog /Note [/Pages 9 0 R] /Pages 2 0 R >>', tree))).toBe(1);
    // Inside a dictionary inside an array, and inside a nested dictionary.
    expect(await pdfPageCount(pdf('<< /Type /Catalog /K [<< /Pages 9 0 R >>] /X << /Y << /Pages 9 0 R >> >> /Pages 2 0 R >>', tree))).toBe(1);
    // In a string with escaped parentheses and a ">>", and in a comment.
    expect(await pdfPageCount(pdf('<< /Type /Catalog /T (a \\) >> /Pages 9 0 R) % /Pages 9 0 R >>\n /Pages 2 0 R >>', tree))).toBe(1);
    // /Type and /Count in arrays are not the node's own.
    expect(await pdfPageCount(pdf('<< /Alt [/Type /Pages] /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Limits [/Count 7] /Kids [] /Count 1 >>'))).toBe(1);
    // Names written with #xx escapes are the same names (ISO 32000-1 §7.3.5).
    expect(await pdfPageCount(pdf('<< /Ty#70e /Catalog /Pa#67es 2 0 R >>', '<< /Type /Pag#65s /Count 3 >>'))).toBe(3);
    // A catalog whose only /Pages is inside an array has no page tree to follow.
    expect(await pdfPageCount(pdf('<< /Type /Catalog /Note [/Pages 2 0 R] >>', tree))).toBeNull();
  });
  it('parses PDF objects as ISO 32000-1 §7.3 defines them', async () => {
    const { parseObject } = await import('../../worker/sources/pdfpages');
    const v = parseObject('<< /A 1 0 R /B [1 2 3 0 R -4.5 .5 7 1 R] /C <414243> /D (x (y) \\)) /E true % c\n /F << /G /H#20I >> >>', 0);
    expect(v?.value.kind).toBe('dict');
    if (v?.value.kind !== 'dict') throw new Error('expected a dictionary');
    const e = v.value.entries;
    expect(e.get('A')).toEqual({ kind: 'ref', num: 1, gen: 0 });
    expect(e.get('B')).toEqual({ kind: 'array', items: [{ kind: 'number', value: 1 }, { kind: 'number', value: 2 }, { kind: 'ref', num: 3, gen: 0 }, { kind: 'number', value: -4.5 }, { kind: 'number', value: 0.5 }, { kind: 'ref', num: 7, gen: 1 }] });
    expect(e.get('C')).toEqual({ kind: 'string' });
    expect(e.get('D')).toEqual({ kind: 'string' });
    expect(e.get('E')).toEqual({ kind: 'keyword', word: 'true' });
    expect(e.get('F')).toEqual({ kind: 'dict', entries: new Map([['G', { kind: 'name', name: 'H I' }]]) });
    // Malformed or too deep: no object, rather than a guess.
    expect(parseObject('<< /A >>', 0)).toBeNull();
    expect(parseObject('<< 1 2 >>', 0)).toBeNull();
    expect(parseObject('['.repeat(200) + ']'.repeat(200), 0)).toBeNull();
  });
  it('treats a comment as white-space between every token: object headers and the stream keyword (PR #71 review)', async () => {
    const { pdfPageCount } = await import('../../worker/sources/pdfpages');
    const objs = '<< /Type /Catalog /Pages 2 0 R >> << /Type /Pages /Kids [] /Count 4 >>';
    const head = `1 0 2 ${objs.indexOf('<< /Type /Pages')} `;
    const data = await deflate(head + objs);
    const pdf = join(
      enc(`%PDF-1.5\n5 % object number, then generation\n0 obj\n<< /Type /ObjStm /N 2 /First ${head.length} /Filter /FlateDecode /Length ${data.length} >>\n% a comment before the keyword\nstream\n`),
      data,
      enc('\nendstream\nendobj\n6 0 obj << /Type /XRef /Root 1 0 R /Size 7 /W [1 2 1] /Length 0 >> % xref\nstream\n\nendstream\nendobj\n%%EOF\n'),
    );
    expect(await pdfPageCount(pdf)).toBe(4);
  });
  describe('stream boundaries come from /Length, never from searching the data (PR #71 review)', () => {
    // A payload holding "endstream" and decoy objects before its real end: read as syntax, its catalog would point to
    // a page tree of 9 pages, defined after the real catalog, so the newest definition would win.
    const payload = 'BT (x) Tj ET\nendstream\nendobj\n9 0 obj\n<< /Type /Pages /Kids [] /Count 9 >>\nendobj\n1 0 obj\n<< /Type /Catalog /Pages 9 0 R >>\nendobj\n% padding';
    const objectsWith = (lengthObj: boolean, lengthValue = payload.length) => [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [] /Count 1 >>\nendobj\n',
      `3 0 obj\n<< /Length ${lengthObj ? '4 0 R' : lengthValue} >>\nstream\n${payload}\nendstream\nendobj\n`,
      ...(lengthObj ? [`4 0 obj\n${lengthValue}\nendobj\n`] : []),
    ];
    // Objects 1.. in order, then a classic cross-reference table and trailer (ISO 32000-1 §7.5.4, entries of 20 bytes).
    const withTable = (objs: string[]) => {
      let body = '%PDF-1.4\n';
      const offsets: number[] = [];
      for (const o of objs) { offsets.push(body.length); body += o; }
      const xrefAt = body.length;
      body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f\r\n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n\r\n`).join('')}`;
      body += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
      return enc(body);
    };
    it('reads an indirect /Length through the cross-reference table', async () => {
      const { pdfPageCount } = await import('../../worker/sources/pdfpages');
      expect(await pdfPageCount(withTable(objectsWith(true)))).toBe(1);
    });
    it('reads an indirect /Length through a compressed cross-reference stream with a PNG predictor', async () => {
      const { pdfPageCount } = await import('../../worker/sources/pdfpages');
      const objs = objectsWith(true);
      let body = '%PDF-1.5\n';
      const offsets: number[] = [];
      for (const o of objs) { offsets.push(body.length); body += o; }
      const xrefAt = body.length;
      // Rows of /W [1 4 1]: type, offset, generation; each row PNG-filtered "Up" (type byte 2), as /Predictor 12 says.
      const rows = [[0, 0, 255], ...offsets.map((o) => [1, o, 0]), [1, xrefAt, 0]].map(([t, o, g]) => [t, (o >>> 24) & 255, (o >>> 16) & 255, (o >>> 8) & 255, o & 255, g]);
      const filtered: number[] = [];
      rows.forEach((r, i) => { filtered.push(2, ...r.map((b, c) => (b - (i ? rows[i - 1][c] : 0)) & 255)); });
      const data = await deflate(Buffer.from(filtered));
      const head = `${objs.length + 1} 0 obj\n<< /Type /XRef /Size ${rows.length} /W [1 4 1] /Root 1 0 R /Filter /FlateDecode /DecodeParms << /Columns 6 /Predictor 12 >> /Length ${data.length} >>\nstream\n`;
      const pdf = join(enc(body + head), data, enc(`\nendstream\nendobj\nstartxref\n${xrefAt}\n%%EOF\n`));
      expect(await pdfPageCount(pdf)).toBe(1);
    });
    it('gives no count when an indirect /Length cannot be resolved, rather than search the data', async () => {
      const { pdfPageCount } = await import('../../worker/sources/pdfpages');
      const objs = objectsWith(true);
      expect(await pdfPageCount(enc(`%PDF-1.4\n${objs.join('')}trailer\n<< /Root 1 0 R >>\n%%EOF\n`))).toBeNull();
    });
    it('gives no count when /Length does not end where "endstream" is', async () => {
      const { pdfPageCount } = await import('../../worker/sources/pdfpages');
      // A length that ends inside "ET", so no "endstream" follows it.
      expect(await pdfPageCount(withTable(objectsWith(false, payload.indexOf('endstream') - 2)))).toBeNull();
      expect(await pdfPageCount(withTable(objectsWith(false)))).toBe(1);
    });
  });
  it('inflates object streams only within a fixed budget', async () => {
    const { pdfPageCount, MAX_INFLATE } = await import('../../worker/sources/pdfpages');
    // A small stream that inflates to far more than the budget, claiming its objects start past the budget.
    const bomb = await deflate(Buffer.alloc(MAX_INFLATE * 8));
    expect(bomb.length).toBeLessThan(200_000);
    const pdf = join(
      enc('%PDF-1.5\n'),
      enc(`5 0 obj\n<< /Type /ObjStm /N 2 /First ${MAX_INFLATE * 4} /Filter /FlateDecode /Length ${bomb.length} >>\nstream\n`),
      bomb,
      enc('\nendstream\nendobj\n6 0 obj\n<< /Type /XRef /Root 1 0 R /Size 7 /W [1 2 1] /Length 0 >>\nstream\n\nendstream\nendobj\n%%EOF\n'),
    );
    expect(await pdfPageCount(pdf)).toBeNull();
    // A page tree that can only be reached by inflating past the budget is not read: no count rather than the memory.
    const pad = ' '.repeat(MAX_INFLATE + 1024);
    const deep = await deflate(`2 ${pad.length} ${pad}<< /Type /Pages /Kids [] /Count 1 >>`);
    const far = join(
      enc(`%PDF-1.5\n${catalog}`),
      enc(`5 0 obj\n<< /Type /ObjStm /N 1 /First ${`2 ${pad.length} `.length} /Filter /FlateDecode /Length ${deep.length} >>\nstream\n`),
      deep,
      enc('\nendstream\nendobj\ntrailer\n<< /Size 6 /Root 1 0 R >>\n%%EOF\n'),
    );
    expect(await pdfPageCount(far)).toBeNull();
  });
  it('keeps a "### Page 2" line that is the text of a one-page PDF, instead of calling it a scan', async () => {
    const r = await readDocument(out('h.pdf', '### Page 1\n### Page 2\n'), { name: 'h.pdf', bytes: plainPdf(1) });
    expect(r).toMatchObject({ ok: true, meta: { pages: 1 } });
    expect(r.ok && r.text).toContain('### Page 2');
    const z = await readDocument(out('z.pdf', '### Page 1\n### Page 2\n'), { name: 'z.pdf', bytes: await compressedPdf(1) });
    expect(z).toMatchObject({ ok: true, meta: { pages: 1 } });
  });
  it('keeps every copy of a page heading that also appears in the text, instead of guessing which is the break (PR #71 review)', async () => {
    const r = await readDocument(out('t.pdf', `### Page 1\nContents\n### Page 2\n${prose}\n### Page 2\n${prose}\n`), { name: 't.pdf', bytes: plainPdf(2) });
    expect(r).toMatchObject({ ok: true, meta: { pages: 2 } });
    expect(r.ok && r.text.match(/### Page 2/g)).toHaveLength(2);
    // Unambiguous breaks are still removed.
    expect(r.ok && r.text).not.toContain('### Page 1');
  });
  it('still returns needs_ocr for a two-page scan whose PDF declares two pages', async () => {
    const r = await readDocument(out('s2.pdf', '### Page 1\n### Page 2\n'), { name: 's2.pdf', bytes: plainPdf(2) });
    expect(r).toMatchObject({ ok: false, code: 'needs_ocr', meta: { pages: 2 } });
  });
});
