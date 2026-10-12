import { db } from '../db';
import type { Env } from '../env';
import { factTrust } from './registry';
import { clock, contentCount, type SourceResult } from './types';

/**
 * Reads a source whose text was stored when it was added (sources.source_text, spec/db/008), for the kinds converted at
 * upload time: a document (converted by Workers AI when uploaded; there is no upload store, so the file itself is never
 * kept) and a social export (parsed in the browser). The run's read step reads the stored text through this, so these
 * sources go through the same chunk, quote, support and conflict steps as a site (issue #64).
 * Reads only; never writes. A row of another brand, or of another kind, is reported as not found.
 */
export const STORED_KINDS = ['document', 'social_export'] as const;
export type StoredKind = (typeof STORED_KINDS)[number];

interface StoredRow { id: string; brand_id: string; kind: string; title: string | null; source_text: string | null }

export async function readStored(env: Env, kind: StoredKind, args: { sourceId?: unknown; brandId?: unknown }): Promise<SourceResult> {
  const c = clock();
  const { trust } = factTrust(kind);
  const fail = (code: 'invalid_input' | 'empty', reason: string) => ({ ok: false as const, kind, code, reason, meta: c.meta(0, 0, 'stored') });
  const id = typeof args.sourceId === 'string' ? args.sourceId : '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('invalid_input', 'That upload was not found; add it again.');
  const brand = typeof args.brandId === 'string' && /^[0-9a-f-]{36}$/i.test(args.brandId) ? `&${db.eq('brand_id', args.brandId)}` : '';
  const [row] = await db.select<StoredRow>(env, 'sources', `${db.eq('id', id)}&${db.eq('kind', kind)}${brand}&select=id,brand_id,kind,title,source_text`);
  if (!row) return fail('invalid_input', 'That upload was not found; add it again.');
  const text = row.source_text ?? '';
  if (contentCount(text) === 0) return fail('empty', 'That upload has no text to read; add it again, or paste the key points.');
  // The title is the name the source was stored under (the file name, "X export (412 items)"); the save step keeps it.
  const title = row.title || kind;
  return { ok: true, kind, trust, name: title, title, text, meta: c.meta(1, 0, 'stored') };
}
