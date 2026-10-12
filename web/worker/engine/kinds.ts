// Startable run kinds (issue #32; registry moved out of engine/api.ts for issue #64, so a new kind is one entry in its
// own file plus a workflow_defs row, with no edit to the run API). Each kind turns a request body into the run's input,
// checking it and writing any row the run needs (such as its pending source) before the run row is written; a check
// that fails throws an HttpError and nothing is started. engine/api.ts start() looks kinds up here by name.
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { urlKind } from '../sources/registry';
import { readerInput } from './readers';

export interface BrandRef { id: string; owner_id: string; name: string; website?: string | null }
export type KindPrepare = (env: Env, brand: BrandRef, body: Record<string, unknown>) => Promise<Record<string, unknown>>;

export const KINDS: Record<string, KindPrepare> = {
  /** Retired by spec/db/012 (one model call, no support check); kept so its in-flight runs and engine tests resolve. */
  ingest_url: async (env, brand, body) => {
    const url = typeof body.url === 'string' ? body.url.trim().slice(0, 500) : '';
    if (!url) throw new HttpError(400, 'a link is required');
    // The source row exists from the start (pending), as before, so the list shows it while it is read. Its kind is
    // 'site' only for a link on the brand's own website (sources/registry.ts urlKind, issue #57); the save step
    // classifies again on the page actually read, since a redirect can leave the website.
    const website = brand.website ?? null;
    const [src] = await db.insert<{ id: string }>(env, 'sources', { brand_id: brand.id, url, status: 'pending', kind: urlKind(url, website) });
    return { url, sourceId: src.id, brandName: brand.name, website };
  },
  /**
   * Fact extraction (issue #64): a source read through the reader the request names (`reader`, default 'site': a link
   * read as the home page plus key subpages, robots.txt checked; 'paste': pasted text), cut into chunks, extracted
   * under a strict schema, quote- and support-checked, then saved with conflicts for the owner. Each reader checks its
   * own input (engine/readers.ts READER_INPUTS) and names a new source row or an existing one of this brand; every
   * reader receives the run's sourceId in its args.
   */
  extract_facts: async (env, brand, body) => {
    const reader = typeof body.reader === 'string' ? body.reader : 'site';
    const input = await readerInput(env, reader, brand, body);
    let sourceId = input.sourceId;
    if (sourceId) {
      // An existing row must belong to this brand, whatever the reader's own check did.
      const [own] = await db.select<{ id: string }>(env, 'sources', `${db.eq('id', sourceId)}&${db.eq('brand_id', brand.id)}&select=id`);
      if (!own) throw new HttpError(404, 'source not found');
    } else {
      const s = input.source!;
      [{ id: sourceId }] = await db.insert<{ id: string }>(env, 'sources', { brand_id: brand.id, url: s.url, status: 'pending', kind: s.kind, ...(s.title ? { title: s.title } : {}) });
    }
    return { reader, args: { ...input.args, sourceId }, sourceId, brandName: brand.name };
  },
};

/** Adds a startable kind. Its workflow_defs row (the definition) comes from a migration; without one, starting it
 * answers 503 before anything is written (engine/api.ts activeDef). */
export function registerKind(name: string, prepare: KindPrepare) {
  if (Object.hasOwn(KINDS, name)) throw new Error(`run kind ${name} is already registered`);
  KINDS[name] = prepare;
}
