// Intake for the sources that are converted when they are added, and the readers and run kind that read them (R9 on
// issue #38; issues #33 and #35). Routes follow the /api/brands/:id style of spec/api/README.md (PR #96); owner-only,
// like every /api/brands route:
//   POST /api/brands/:id/sources/document  multipart, field "file"  -> 202 {source, run, notes}
//   POST /api/brands/:id/sources/social    {platform, items}         -> 202 {source, run, notes}
//   POST /api/brands/:id/runs {kind: "extract_facts", reader: "search"}  web research on the brand (no route here)
//   POST /api/brands/:id/competitors       {}                        -> 202 {run}         a find_competitors run
//   GET  /api/brands/:id/competitors                                 -> 200 {candidates}  newest first
// An upload or export stores its text in sources.source_text and starts an extract_facts run whose read step reads it
// back (sources/stored.ts), so every source goes through the same chunk, quote, support and conflict steps (issue #64).
// A source that cannot be read answers with its adapter's typed failure, {error, code}, at the status in STATUS.
//
// Each reader is registered here with its input check (engine/readers.ts registerReader) and the competitor run kind
// with its prepare (engine/kinds.ts registerKind), so adding them touched neither registry's module.
import { db } from './db';
import { HttpError, type Env } from './env';
import { startRun } from './engine/api';
import type { WaitUntil } from './engine/executor';
import type { Caller } from './engine/guards';
import { registerKind, type BrandRef } from './engine/kinds';
import { capText, fitsRead, registerReader, SOURCE_READ_LIMIT, STATUS, utf8Length, type ReaderBrand, type ReadStepOutput } from './engine/readers';
import { WRITES } from './engine/steps';
import type { RunRow } from './engine/types';
import { stableId } from './ids';
import { readCapped } from './ingest';
import { DOC_MAX_BYTES, readDocument } from './sources/document';
import { readCompetitors, readSearch } from './sources/search';
import { SOCIAL_MAX_BODY_BYTES, readSocial } from './sources/social';
import { readStored, type StoredKind } from './sources/stored';
import type { SourceFail, SourceOk } from './sources/types';

export interface IntakeReply { status: number; body: Record<string, unknown> }

/** Room for the multipart framing around the file: boundaries, part headers and the other small fields. */
export const MULTIPART_OVERHEAD = 64 * 1024;

const failed = (r: SourceFail): IntakeReply => ({ status: STATUS[r.code], body: { error: r.reason, code: r.code } });
const isId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/**
 * A request body read through a streamed cap, never whole first: a declared length over the cap is refused before any
 * byte is read, and an undeclared or false one stops at the cap (ingest.ts readCapped cancels the rest).
 */
export async function readBodyCapped(req: Request, max: number): Promise<Uint8Array<ArrayBuffer> | null> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > max) {
    await req.body?.cancel().catch(() => undefined);
    return null;
  }
  const { bytes, truncated } = await readCapped(new Response(req.body), max);
  // readCapped copies the chunks into a new Uint8Array of its own, so the buffer is a plain ArrayBuffer.
  return truncated ? null : (bytes as Uint8Array<ArrayBuffer>);
}

/**
 * Stores a converted source as pending, then starts its extraction. A source without an address keeps url '' and is
 * named by its title, as the paste reader's rows are (engine/readers.ts READER_INPUTS.paste). If the run cannot start
 * (its budget, a missing migration, the executor), the stored row is removed, so nothing is left half added; the
 * person adds it again.
 */
async function storeAndExtract(env: Env, ctx: WaitUntil | undefined, caller: Caller, brand: BrandRef, r: SourceOk, title: string): Promise<IntakeReply> {
  const [src] = await db.insert<{ id: string; kind: string; title: string | null; status: string }>(env, 'sources', {
    brand_id: brand.id, url: '', kind: r.kind, status: 'pending', title: title.slice(0, 200), source_text: r.text, text_excerpt: capText(r.text, 2000, 8000),
  });
  let run: RunRow;
  try {
    run = await startRun(env, ctx, caller, brand, 'extract_facts', { reader: r.kind, sourceId: src.id });
  } catch (e) {
    await db.del(env, 'sources', `${db.eq('id', src.id)}&${db.eq('brand_id', brand.id)}`).catch(() => undefined);
    throw e;
  }
  return { status: 202, body: { source: { id: src.id, kind: src.kind, title: src.title, status: src.status }, run, notes: r.meta.notes } };
}

/** POST /api/brands/:id/sources/document: a PDF, DOCX or XLSX converted now (sources/document.ts), its text stored. */
export async function uploadDocument(env: Env, ctx: WaitUntil | undefined, caller: Caller, brand: BrandRef, req: Request, maxBytes = DOC_MAX_BYTES): Promise<IntakeReply> {
  const type = req.headers.get('content-type') ?? '';
  if (!/^multipart\/form-data;\s*boundary=/i.test(type)) throw new HttpError(415, 'send the file as multipart/form-data, in a field named "file"');
  const bytes = await readBodyCapped(req, maxBytes + MULTIPART_OVERHEAD);
  if (!bytes) return { status: STATUS.too_large, body: { error: `That file is over ${Math.round(maxBytes / 1024 / 1024)} MB; upload a smaller copy, or paste the key points.`, code: 'too_large' } };
  let file: FormDataEntryValue | null;
  try {
    file = (await new Response(bytes, { headers: { 'content-type': type } }).formData()).get('file');
  } catch {
    throw new HttpError(400, 'the upload could not be read; choose the file again');
  }
  if (!file || typeof file === 'string') throw new HttpError(400, 'attach the file in a field named "file"');
  const r = await readDocument(env, { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()), maxBytes });
  if (!r.ok) return failed(r);
  // A file under the upload limit can still convert to more text than one run reads (a compressed DOCX or XLSX). It is
  // refused whole, before anything is stored: a stored text longer than the read would be cut by the run, and facts
  // from the part it read would look like the whole document (Codex review on PR #100).
  if (!fitsRead(r.text)) {
    const { maxChars, maxBytes: readBytes } = SOURCE_READ_LIMIT;
    return { status: STATUS.too_large, body: { code: 'too_large', error: `That document converts to ${r.text.length.toLocaleString('en')} characters (${utf8Length(r.text).toLocaleString('en')} bytes); we read at most ${maxChars.toLocaleString('en')} characters (${readBytes.toLocaleString('en')} bytes) of one document. Split it into smaller files and upload each.` } };
  }
  // The file name is what the owner knows the upload by; the document's own heading stays in its text.
  return storeAndExtract(env, ctx, caller, brand, r, r.name ?? r.title);
}

/** POST /api/brands/:id/sources/social: post text the browser parsed from the owner's own export (sources/social.ts). */
export async function addSocialExport(env: Env, ctx: WaitUntil | undefined, caller: Caller, brand: BrandRef, req: Request): Promise<IntakeReply> {
  const bytes = await readBodyCapped(req, SOCIAL_MAX_BODY_BYTES);
  if (!bytes) return { status: STATUS.too_large, body: { error: `That is more than ${SOCIAL_MAX_BODY_BYTES / 1024 / 1024} MB of posts; send the newest posts only.`, code: 'too_large' } };
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'invalid JSON body');
  }
  const r = readSocial(body && typeof body === 'object' ? body : {});
  return r.ok ? storeAndExtract(env, ctx, caller, brand, r, r.title) : failed(r);
}

/** POST /api/brands/:id/competitors: starts a find_competitors run (Exa findSimilar on the brand's website). */
export async function findCompetitors(env: Env, ctx: WaitUntil | undefined, caller: Caller, brand: BrandRef): Promise<IntakeReply> {
  return { status: 202, body: { run: await startRun(env, ctx, caller, brand, 'find_competitors', {}) } };
}

export interface Candidate { sourceId: string; url: string; title: string; excerpt: string }
const EXCERPT = 300;

/** GET /api/brands/:id/competitors: stored candidates, newest first, each with its page as the source. */
export async function listCompetitors(env: Env, brand: Pick<BrandRef, 'id'>) {
  const rows = await db.select<{ id: string; url: string; title: string | null; text_excerpt: string | null }>(env, 'sources', `${db.eq('brand_id', brand.id)}&${db.eq('kind', 'competitor_page')}&select=id,url,title,text_excerpt,created_at&order=created_at.desc,id.desc&limit=50`);
  return { candidates: rows.map((r): Candidate => ({ sourceId: r.id, url: r.url, title: r.title ?? r.url, excerpt: (r.text_excerpt ?? '').slice(0, EXCERPT) })) };
}

/**
 * The find_competitors save step: the run's candidate pages replace the brand's previous candidates as one set, in one
 * database call (spec/db/014 replace_competitor_candidates), so GET /competitors lists only the latest set (Codex review
 * on PR #100). Rows are keyed by brand and address, so a retried step writes the same set. A run that a newer one has
 * superseded writes nothing. Its output is the run's: the candidates, and Exa's cost for the request (null when Exa
 * gave none; also metered on the read step's cost_usd).
 */
export async function saveCompetitorCandidates(env: Env, run: Pick<RunRow, 'id' | 'brand_id'>, read: ReadStepOutput) {
  const rows = await Promise.all(read.pages.map(async (p) => {
    const text = read.text.slice(p.start, p.end);
    return { id: await stableId('competitor', run.brand_id, p.url), url: p.url, title: p.title, source_text: text, text_excerpt: capText(text, 2000, 8000) };
  }));
  const current = await db.rpc<boolean>(env, 'replace_competitor_candidates', { p_brand: run.brand_id, p_run: run.id, p_rows: rows });
  const candidates: Candidate[] = rows.map((r) => ({ sourceId: r.id, url: r.url, title: r.title, excerpt: r.source_text.slice(0, EXCERPT) }));
  return { candidates, current, cost: read.meta.cost };
}

// ------------------------------------------------------------------------------------------------ registrations

/**
 * Input check for a stored source: an existing row of this brand and of the reader's kind, added by its route above.
 * The run reads it by id (engine/kinds.ts extract_facts checks the brand again before starting).
 */
const storedInput = (kind: StoredKind) => async (env: Env, brand: ReaderBrand, body: Record<string, unknown>) => {
  if (!isId(body.sourceId)) throw new HttpError(400, `add the ${kind === 'document' ? 'document' : 'export'} first; its source id is required`);
  const [row] = await db.select<{ id: string }>(env, 'sources', `${db.eq('id', body.sourceId)}&${db.eq('brand_id', brand.id)}&${db.eq('kind', kind)}&select=id`);
  if (!row) throw new HttpError(404, 'source not found');
  return { args: { brandId: brand.id }, sourceId: row.id };
};

for (const kind of ['document', 'social_export'] as const) {
  registerReader(kind, (env, a) => readStored(env, kind, { sourceId: a.sourceId, brandId: a.brandId }), storedInput(kind));
}

/**
 * Web research on the brand (#35): one search_result source per brand at a time, held by the database
 * (spec/db/014 sources_one_search, a unique index, and reserve_search_source, which inserts with ON CONFLICT DO
 * NOTHING), so two requests at once can never both start a paid search (Codex review on PR #100). The request that
 * gets no row answers 409 with the search already listed and starts nothing. A failed search does not hold the place;
 * removing a listed one (DELETE /sources/:id, which removes its facts) allows a new one.
 */
registerReader('search', (env, a) => readSearch(env, { brandName: str(a.brandName), website: str(a.website) || null }), async (env, brand) => {
  const name = (brand.name ?? '').trim();
  if (!name) throw new HttpError(400, 'the brand needs a name before we can search the web for it');
  const id = await db.rpc<string | null>(env, 'reserve_search_source', { p_brand: brand.id, p_title: `Web search: ${name}`.slice(0, 200) });
  if (!id) {
    const [had] = await db.select<{ id: string }>(env, 'sources', `${db.eq('brand_id', brand.id)}&${db.eq('kind', 'search_result')}&status=neq.failed&select=id&limit=1`);
    throw new HttpError(409, `a web search is already in your sources${had ? ` (${had.id})` : ''}; remove it to search again`);
  }
  return { args: { brandName: name, website: brand.website ?? '' }, sourceId: id };
});

/**
 * Competitor candidates (#35) are read by their own run kind, not extract_facts: they are not facts about the brand.
 * The reader has an input check only to keep the two registries in step; extract_facts refuses it (no source row).
 */
registerReader('competitors', (env, a) => readCompetitors(env, { brandName: str(a.brandName), website: str(a.website) || null }), async () => {
  throw new HttpError(400, 'competitors are found with the find_competitors run, not read as a source');
});
// The save step's write op, added to the engine's write registry (engine/steps.ts WRITES) like the reader and kind.
if (Object.hasOwn(WRITES, 'save_competitor_candidates')) throw new Error('write op save_competitor_candidates is already registered');
WRITES.save_competitor_candidates = ({ env, run }, { read }) => saveCompetitorCandidates(env, run, read as ReadStepOutput);
registerKind('find_competitors', async (_env, brand) => {
  if (!brand.website) throw new HttpError(400, 'add the brand\'s website first; competitors are found from it');
  return { reader: 'competitors', args: { brandName: brand.name, website: brand.website } };
});
