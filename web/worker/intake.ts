// Intake routes for the sources that are converted when they are added (R9 on issue #38; issues #33 and #35), in the
// /api/brands/:id route style of spec/api/README.md (PR #96). Each stores the source's text in sources.source_text and
// starts an extract_facts run whose read step reads that text back (sources/stored.ts), so every source goes through
// the same chunk, quote, support and conflict steps (issue #64). Owner-only, like every /api/brands route.
//   POST /api/brands/:id/sources/document  multipart, field "file"  -> 202 {source, run, notes}
//   POST /api/brands/:id/sources/social    {platform, items}         -> 202 {source, run, notes}
//   POST /api/brands/:id/competitors       {}                        -> 202 {run}         find_competitors run
//   GET  /api/brands/:id/competitors                                 -> 200 {candidates}  newest first
// A source that cannot be read answers with its adapter's typed failure: {error, code} with the status in STATUS.
import { db } from './db';
import { HttpError, type Env } from './env';
import { startRun } from './engine/api';
import type { WaitUntil } from './engine/executor';
import { capText, STATUS, type ReadStepOutput } from './engine/readers';
import type { RunRow } from './engine/types';
import { stableId } from './ids';
import { readCapped } from './ingest';
import { DOC_MAX_BYTES, readDocument } from './sources/document';
import { SOCIAL_MAX_BODY_BYTES, readSocial } from './sources/social';
import type { SourceFail, SourceOk } from './sources/types';

interface BrandRef { id: string; owner_id: string; name: string; website?: string | null }
interface UserRef { id: string }
export interface IntakeReply { status: number; body: Record<string, unknown> }

/** Room for the multipart framing around the file: boundaries, part headers and the other small fields. */
export const MULTIPART_OVERHEAD = 64 * 1024;

const failed = (r: SourceFail): IntakeReply => ({ status: STATUS[r.code], body: { error: r.reason, code: r.code } });

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

/** Stores a converted source as pending, then starts its extraction; the source is marked failed if the run cannot start. */
async function storeAndExtract(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, r: SourceOk): Promise<IntakeReply> {
  const [src] = await db.insert<{ id: string; kind: string; name: string | null; title: string | null; status: string }>(env, 'sources', {
    brand_id: brand.id, kind: r.kind, status: 'pending', name: r.name ?? r.title, title: r.title,
    source_text: r.text, text_excerpt: capText(r.text, 2000, 8000),
  });
  let run: RunRow;
  try {
    run = await startRun(env, ctx, user, brand, 'extract_facts', { reader: r.kind, sourceId: src.id });
  } catch (e) {
    await db.update(env, 'sources', `${db.eq('id', src.id)}&${db.eq('brand_id', brand.id)}`, { status: 'failed', error: 'the read could not start' }).catch(() => undefined);
    throw e;
  }
  const source = { id: src.id, kind: src.kind, name: src.name, title: src.title, status: src.status };
  return { status: 202, body: { source, run, notes: r.meta.notes } };
}

/** POST /api/brands/:id/sources/document: a PDF, DOCX or XLSX converted now (sources/document.ts), its text stored. */
export async function uploadDocument(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, req: Request, maxBytes = DOC_MAX_BYTES): Promise<IntakeReply> {
  const type = req.headers.get('content-type') ?? '';
  if (!/^multipart\/form-data;\s*boundary=/i.test(type)) throw new HttpError(415, 'send the file as multipart/form-data, in a field named "file"');
  const bytes = await readBodyCapped(req, maxBytes + MULTIPART_OVERHEAD);
  const tooLarge = `That file is over ${Math.round(maxBytes / 1024 / 1024)} MB; upload a smaller copy, or paste the key points.`;
  if (!bytes) return { status: STATUS.too_large, body: { error: tooLarge, code: 'too_large' } };
  let file: FormDataEntryValue | null;
  try {
    file = (await new Response(bytes, { headers: { 'content-type': type } }).formData()).get('file');
  } catch {
    throw new HttpError(400, 'the upload could not be read; choose the file again');
  }
  if (!file || typeof file === 'string') throw new HttpError(400, 'attach the file in a field named "file"');
  const r = await readDocument(env, { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()), maxBytes });
  return r.ok ? storeAndExtract(env, ctx, user, brand, r) : failed(r);
}

/** POST /api/brands/:id/sources/social: post text the browser parsed from the owner's own export (sources/social.ts). */
export async function addSocialExport(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, req: Request): Promise<IntakeReply> {
  const bytes = await readBodyCapped(req, SOCIAL_MAX_BODY_BYTES);
  if (!bytes) return { status: STATUS.too_large, body: { error: `That is more than ${SOCIAL_MAX_BODY_BYTES / 1024 / 1024} MB of posts; send the newest posts only.`, code: 'too_large' } };
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'invalid JSON body');
  }
  const r = readSocial(body && typeof body === 'object' ? body : {});
  return r.ok ? storeAndExtract(env, ctx, user, brand, r) : failed(r);
}

/** POST /api/brands/:id/competitors: starts a find_competitors run (Exa findSimilar on the brand's website). */
export async function findCompetitors(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef): Promise<IntakeReply> {
  return { status: 202, body: { run: await startRun(env, ctx, user, brand, 'find_competitors', {}) } };
}

export interface Candidate { sourceId: string; url: string; title: string; excerpt: string }
const EXCERPT = 300;

/** GET /api/brands/:id/competitors: stored candidates, newest first, each with its page as the source. */
export async function listCompetitors(env: Env, brand: BrandRef) {
  const rows = await db.select<{ id: string; url: string; title: string | null; text_excerpt: string | null }>(env, 'sources', `${db.eq('brand_id', brand.id)}&${db.eq('kind', 'competitor_page')}&select=id,url,title,text_excerpt,created_at&order=created_at.desc,id.desc&limit=50`);
  return { candidates: rows.map((r): Candidate => ({ sourceId: r.id, url: r.url, title: r.title ?? r.url, excerpt: (r.text_excerpt ?? '').slice(0, EXCERPT) })) };
}

/**
 * The find_competitors save step: each candidate page becomes a competitor_page source (third-party), keyed by brand
 * and address so a retried step, or the same competitor found again, writes the same row and never a second one. Its
 * output is the run's: the candidates and Exa's cost for the request.
 */
export async function saveCompetitorCandidates(env: Env, run: Pick<RunRow, 'id' | 'brand_id'>, read: ReadStepOutput) {
  const now = new Date().toISOString();
  const rows = await Promise.all(read.pages.map(async (p) => {
    const text = read.text.slice(p.start, p.end);
    return { id: await stableId('competitor', run.brand_id, p.url), brand_id: run.brand_id, url: p.url, title: p.title, kind: 'competitor_page', status: 'read', source_text: text, text_excerpt: capText(text, 2000, 8000), fetched_at: now };
  }));
  if (rows.length) await db.insertNew(env, 'sources', rows, 'id');
  const candidates: Candidate[] = rows.map((r) => ({ sourceId: r.id, url: r.url, title: r.title, excerpt: r.source_text.slice(0, EXCERPT) }));
  return { candidates, cost: read.meta.cost };
}
