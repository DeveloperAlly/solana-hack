// Reads what the coverage map and the Journey screens need for one brand (issue #34), in one round of parallel reads.
// Evidence is read live only (proposed or approved): rejected facts never count, and the allow-list (usableFact,
// ADR-011) decides inside the coverage map which of the rest may back a field. Needs migrations 011 and 012.
import { db } from '../db';
import type { Env } from '../env';
import { SOURCE_TYPES } from '../sources/registry';
import type { CoverageAnswer, CoverageConflict, CoverageFact } from './coverage';
import type { JourneyInput, JourneyRun, JourneySourceRow } from './journey';

export const FACT_COLUMNS = 'id,source_id,section,claim,quote,origin,trust,review_status,match,confidence,slot,slot_value,quote_start,quote_end,field,decision';

/** Source kinds whose text is the brand's own words (owned trust, sources/registry.ts), for the voice field. */
const OWNED_KINDS = Object.values(SOURCE_TYPES).filter((t) => t.trust === 'owned').map((t) => t.kind as string);

export async function loadJourney(env: Env, brand: { id: string; name: string; website: string | null }): Promise<JourneyInput> {
  const f = db.eq('brand_id', brand.id);
  const [answers, facts, conflicts, sources, runs] = await Promise.all([
    db.select<CoverageAnswer>(env, 'answers', `${f}&select=step,data,skipped`),
    db.selectAll<CoverageFact>(env, 'evidence', `${f}&review_status=in.(proposed,approved)&select=${FACT_COLUMNS}&order=created_at.asc,id.asc`),
    db.select<CoverageConflict>(env, 'fact_conflicts', `${f}&status=eq.open&select=id,slot,evidence_ids,question&order=created_at.asc,id.asc`),
    db.select<JourneySourceRow>(env, 'sources', `${f}&select=id,url,title,status,error,kind,read_meta&order=created_at.asc,id.asc`),
    db.select<JourneyRun>(env, 'runs', `${f}&status=in.(running,paused)&select=status,progress,input&order=created_at.desc&limit=50`),
  ]);
  const ownedWords = sources.filter((s) => s.status === 'read' && OWNED_KINDS.includes(s.kind ?? '')).reduce((n, s) => n + (s.read_meta?.words ?? 0), 0);
  return { brand: { name: brand.name, website: brand.website }, answers, facts, conflicts, sources, runs, ownedWords };
}
