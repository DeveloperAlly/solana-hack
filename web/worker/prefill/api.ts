// Prefill and coverage API (issue #34), owner-only like every /api/brands route (api.ts ownBrand). It serves the
// Journey contract of PR #75 (prefill/contract.ts) and the full coverage map for the Build screen and other components.
//   POST /api/brands/:id/journey/read {url?}           -> 202 {run}   starts read_brand on the website (or the link given)
//   GET  /api/brands/:id/journey/read                  -> ReadData    J1-Read: sources with progress, facts, coverage
//   GET  /api/brands/:id/journey/confirm               -> ConfirmData J3-Confirm
//   GET  /api/brands/:id/journey/gaps                  -> GapsData    J4's questions (GapsVoiceData without voice) + ranked list
//   GET  /api/brands/:id/coverage                      -> the coverage map: fields, sections, steps, questions, prefill
//   POST /api/brands/:id/conflicts/:cid/resolve {keep} -> {conflict, evidence, stale}  keep: a fact id, or null for none
//   PATCH /api/brands/:id/evidence/:eid {decision, edit?} (FactRecord) -> {evidence, stale, answer?}  (in api.ts, which
//        keeps the ADR-011 {review_status} body on the same route)
// Needs migrations 011 (fact_conflicts, evidence columns) and 012 (evidence.field and decision, sources.read_meta).
import type { WaitUntil } from '../engine/executor';
import { startRun } from '../engine/api';
import { HttpError, json, type Env } from '../env';
import { resolveConflict } from './decide';
import { confirmData, coverageData, gapsData, readData } from './journey';
import { loadJourney } from './load';

interface BrandRow { id: string; owner_id: string; name: string; type: string; description: string | null; website: string | null; goal: string | null; channel: string | null }

const UUID = /^[0-9a-f-]{36}$/i;

/** Handles the prefill routes; null for any path it does not own. `p` is the path split on '/', from 'api'. */
export async function handlePrefill(req: Request, env: Env, ctx: WaitUntil | undefined, user: { id: string }, brand: BrandRow, p: string[], body: () => Promise<Record<string, unknown>>): Promise<Response | null> {
  const m = req.method;
  if (p[3] === 'journey' && p.length === 5) {
    if (p[4] === 'read' && m === 'POST') {
      const b = await body();
      return json({ run: await startRun(env, ctx, user, brand, 'read_brand', { url: typeof b.url === 'string' ? b.url : '' }) }, 202);
    }
    if (m !== 'GET') return null;
    if (p[4] === 'read') return json(readData(await loadJourney(env, brand)));
    if (p[4] === 'confirm') return json(confirmData(await loadJourney(env, brand)));
    if (p[4] === 'gaps') return json(gapsData(await loadJourney(env, brand), new Date().toISOString().slice(0, 10)));
    return null;
  }
  if (p[3] === 'coverage' && p.length === 4 && m === 'GET') return json(coverageData(await loadJourney(env, brand)));
  if (p[3] === 'conflicts' && p.length === 6 && p[5] === 'resolve' && m === 'POST') {
    if (!UUID.test(p[4])) throw new HttpError(404, 'conflict not found');
    const b = await body();
    if (!('keep' in b) || (b.keep !== null && (typeof b.keep !== 'string' || !UUID.test(b.keep)))) throw new HttpError(400, 'keep must be the id of a fact on the side you choose, or null to reject every side');
    return json(await resolveConflict(env, user, brand, p[4], b.keep as string | null));
  }
  return null;
}
