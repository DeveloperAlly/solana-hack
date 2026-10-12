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
  it('returns needs_ocr when only a few letters per page come through', async () => {
    const pages = Array.from({ length: 10 }, (_, i) => `### Page ${i + 1}\nPage ${i + 1} of 10 Confidential`).join('\n');
    const r = await readDocument({ AI: ai({ name: 's.pdf', format: 'markdown', data: pages }) }, { name: 's.pdf', bytes });
    expect(r).toMatchObject({ ok: false, code: 'needs_ocr' });
  });
  it('reads DOCX and XLSX with their MIME types', async () => {
    for (const [name, mime] of [['brief.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], ['plan.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']]) {
      const env: SourceEnv = { AI: ai({ name, format: 'markdown', data: prose }) };
      expect(await readDocument(env, { name, bytes })).toMatchObject({ ok: true, title: name });
      expect(((env.AI!.toMarkdown as ReturnType<typeof vi.fn>).mock.calls[0][0] as { blob: Blob }[])[0].blob.type).toBe(mime);
    }
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
    expect(readableText(prose)).toEqual({ body: prose, pages: 1 });
  });
});
