// First-run journey (issue #48, canvas page "Journey (v3)"): the server pieces the journey needs on top of the existing
// routes. Everything here reads and writes through the same tables and the same rules as the rest of the Worker:
// facts only with a quote on their page, an allow-list before anything reaches a kit (sources/registry.ts usableFact),
// a person approves every step, and models are free by default (llm.ts).
import { requirePermanent, userFromToken, type User } from './auth';
import { db } from './db';
import { HttpError, type Env } from './env';
import { SECTIONS, type SectionId } from './kit';
import { chat, parseJson, SLOP_RULES } from './llm';
import { usableFact } from './sources/registry';
import { nearestTemplates, templateById, voiceAnswerFor, VOICE_TEMPLATES } from './voice';

/** Reading before sign-in (decision D1) uses Supabase anonymous users; these caps bound what one anonymous visitor uses. */
export const ANON_MAX_BRANDS = 1;
export const ANON_MAX_SOURCES = 8;

export async function assertCanCreateBrand(env: Env, user: User) {
  if (!user.isAnonymous) return;
  // The count below is check-then-insert; the per-IP limit the caller applies first (api.ts) bounds concurrent bursts.
  const rows = await db.select<{ id: string }>(env, 'brands', `${db.eq('owner_id', user.id)}&select=id&limit=${ANON_MAX_BRANDS + 1}`);
  if (rows.length >= ANON_MAX_BRANDS) throw new HttpError(409, 'save your brand with your email to start another one');
}

export async function assertCanAddSource(env: Env, user: User, brandId: string) {
  if (!user.isAnonymous) return;
  const rows = await db.select<{ id: string }>(env, 'sources', `${db.eq('brand_id', brandId)}&select=id&limit=${ANON_MAX_SOURCES + 1}`);
  if (rows.length >= ANON_MAX_SOURCES) throw new HttpError(409, `save your brand with your email to read more than ${ANON_MAX_SOURCES} sources`);
}

/**
 * Moves an anonymous visitor's brands to the account they signed in to, when the email they gave already had an account
 * (Supabase "Linking an anonymous user to an existing account"). A new email instead links to the anonymous user itself
 * (updateUser), so nothing moves. The caller proves it held the anonymous session by sending that session's token.
 */
export async function claimAnonymous(env: Env, user: User, anonymousToken: string) {
  requirePermanent(user);
  if (!anonymousToken) throw new HttpError(400, 'anonymousToken is required');
  // An expired anonymous token is not the caller's session expiring: say what happened (the UI refreshes the anonymous
  // session before signing in; spec/api/README.md).
  const anon = await userFromToken(env, anonymousToken).catch((e: unknown) => {
    if (e instanceof HttpError && e.status === 401) throw new HttpError(409, 'the unsaved session expired before it was claimed; refresh it and try again');
    throw e;
  });
  if (!anon.isAnonymous) throw new HttpError(409, 'that session is not an anonymous one');
  if (anon.id === user.id) return { moved: [] as string[] };
  const moved = await db.update<{ id: string }>(env, 'brands', db.eq('owner_id', anon.id), { owner_id: user.id });
  return { moved: moved.map((b) => b.id) };
}

/** The same values as the journey UI's EvidenceStatus (web/src/ui/domain/EvidenceChip.tsx on PR #75). */
export type CoverageStatus = 'found' | 'partly' | 'needs-you';
interface FactRow { id: string; section: string; claim: string; quote: string | null; trust?: string | null; review_status?: string | null; origin?: string }

/**
 * Coverage over the kit sections (canvas J1 and J3: Found / Partly found / Needs you). Found: at least two facts that
 * may enter a kit. Partly: at least one fact not rejected (including facts still waiting for review). Needs you: none.
 */
export function coverage(evidence: FactRow[]) {
  const sections = (Object.keys(SECTIONS) as SectionId[]).map((section) => {
    const own = evidence.filter((e) => e.section === section && e.review_status !== 'rejected');
    const usable = own.filter((e) => usableFact(e)).length;
    const status: CoverageStatus = usable >= 2 ? 'found' : own.length ? 'partly' : 'needs-you';
    return { section, title: SECTIONS[section].title, status, facts: own.length, usable };
  });
  const covered = sections.filter((s) => s.status !== 'needs-you').length;
  return { sections, covered, total: sections.length, ratio: sections.length ? covered / sections.length : 0 };
}

/** answer: what PUT /api/brands/:id/answers/voice saves when this sample is picked (template, 8 dials, claims gate, sample). */
export interface VoiceSample { template: string; label: string; text: string; answer: Record<string, string> }

/**
 * Voice by example (canvas J4, architecture §5 step 6): three short paragraphs about the brand, each in a different
 * template, written only from facts that may enter a kit. Round 1 offers three contrasting templates the model judges
 * plausible for this brand; round 2 offers the round 1 pick and its two nearest neighbours by dial distance.
 * The pick is saved with the existing Voice answer route, so kitPolicy and Gate 3 work unchanged.
 */
export async function voiceSamples(env: Env, brand: { id: string; name: string }, round: number, near?: string): Promise<VoiceSample[]> {
  const evidence = (await db.select<FactRow>(env, 'evidence', `${db.eq('brand_id', brand.id)}&order=created_at.asc`)).filter((e) => usableFact(e));
  if (!evidence.length) throw new HttpError(409, 'approve some facts first, so the samples are about your brand');
  let candidates: string[];
  if (round === 2) {
    if (!near || !templateById(near)) throw new HttpError(400, 'round 2 needs the template picked in round 1');
    candidates = nearestTemplates(near, 3);
  } else {
    candidates = VOICE_TEMPLATES.map((t) => t.value);
  }
  const facts = evidence.slice(0, 40).map((e) => `- ${e.claim}`).join('\n');
  const list = candidates.map((id) => `${id}: ${templateById(id)!.label}`).join('\n');
  const want = round === 2 ? `one paragraph in each of these three templates: ${candidates.join(', ')}` : 'three paragraphs in three clearly different templates from the list that could suit this brand';
  const system = `You show a brand owner how "${brand.name}" could sound. Write ${want}. Each paragraph is 40 to 70 words introducing the brand, using only the facts given; no numbers, customers or claims that are not in the facts. ${SLOP_RULES} Reply with JSON only: {"samples": [{"template": string, "text": string}]}.`;
  const { text } = await chat(env, system, `Templates:\n${list}\n\nFacts:\n${facts}`);
  const raw = parseJson<{ samples?: { template?: string; text?: string }[] }>(text).samples ?? [];
  const seen = new Set<string>();
  const out: VoiceSample[] = [];
  for (const s of raw) {
    const t = typeof s.template === 'string' ? templateById(s.template) : undefined;
    const body = typeof s.text === 'string' ? s.text.trim().slice(0, 800) : '';
    if (!t || !body || seen.has(t.value) || !candidates.includes(t.value)) continue;
    seen.add(t.value);
    // The picked paragraph is saved as the answer's sample, as the voice form does (normaliseVoice keeps it), so the voice
    // section is drafted from the example the owner chose, not only the template name and dials.
    out.push({ template: t.value, label: t.label, text: body, answer: { ...voiceAnswerFor(t.value), sample: body } });
  }
  if (out.length < 3) throw new HttpError(502, 'the AI model did not return three usable samples, try again');
  return out.slice(0, 3);
}

/** The brief for the first post when the owner gives none (canvas J6: "no blank brief"). */
export const FIRST_POST_BRIEF = 'First post for this brand: introduce who it is, what it does and for whom, using the messaging and positioning in the kit. End with one clear next step.';

/**
 * J3 Edit: the owner rewords a fact read from a source. The source fact is rejected (its wording is not the owner's),
 * and the owner's wording is stored as the owner's own statement (origin and trust owner_answer, approved, no quote:
 * ADR-011 never pairs an owner's wording with a source's quote), linked to the fact it replaced by edited_from
 * (spec/db/012). saveAnswer replaces only interview rows (edited_from null), and removing the source keeps the edit.
 */
export async function editFact(env: Env, brandId: string, id: string, claim: string) {
  const text = claim.trim().slice(0, 500);
  if (!text) throw new HttpError(400, 'the fact cannot be empty');
  const f = `${db.eq('brand_id', brandId)}&${db.eq('id', id)}`;
  const [row] = await db.select<FactRow & { edited_from?: string | null }>(env, 'evidence', f);
  if (!row) throw new HttpError(404, 'fact not found');
  if (row.trust === 'owner_answer' && !row.edited_from) throw new HttpError(409, 'this fact is your own answer; change the answer instead');
  // Editing a correction, or editing its source fact again, replaces that one correction.
  const original = row.edited_from ?? id;
  const [prev] = await db.select<{ id: string; section: string }>(env, 'evidence', `${db.eq('brand_id', brandId)}&${db.eq('edited_from', original)}&select=id,section&limit=1`);
  const [source] = row.edited_from ? await db.select<FactRow>(env, 'evidence', `${db.eq('brand_id', brandId)}&${db.eq('id', original)}`) : [row];
  if (!row.edited_from) await db.update(env, 'evidence', f, { review_status: 'rejected' });
  // One statement, atomic: evidence.edited_from is unique (spec/db/012), so concurrent edits of one fact leave one row.
  // Every save writes a new id, so a section citing the old wording sees a missing citation, is stale, and registerKit
  // refuses it until it is redrafted and approved again; an approved section can never pair with changed evidence.
  const [edited] = await db.upsert<FactRow>(env, 'evidence', {
    id: crypto.randomUUID(), brand_id: brandId, source_id: null, section: source?.section ?? prev?.section ?? row.section, claim: text, quote: null,
    edited_from: original, origin: 'owner_answer', trust: 'owner_answer', review_status: 'approved',
  }, 'edited_from');
  const changed = prev?.id ?? original;
  const sections = await db.select<{ section: string; citations: string[] }>(env, 'kit_sections', `${db.eq('brand_id', brandId)}&select=section,citations`);
  return { evidence: edited, replaced: original, stale: sections.filter((s) => (s.citations ?? []).includes(changed)).map((s) => s.section) };
}
