import { requireUser, type User } from './auth';
import { db } from './db';
import { HttpError, json, safeError, sha256Hex, type Env } from './env';
import { readPage } from './ingest';
import { canonical, GATES, isSection, SECTION_GUIDE, SECTIONS, STEPS, type SectionId } from './kit';
import { chat, parseJson, SLOP_RULES } from './llm';
import { registerKitAttestation, registrarFromSecret } from './registry';
import { approvePost, draftPost, editPost, evidenceBatchCount, ledger, MAX_EVIDENCE_BATCHES, polishPost, registerPost, undoPost, verifyText, type Post } from './posts';

/** The most posts the Create list will show; older ones stay in the database. */
export const MAX_POSTS = 500;

interface Brand { id: string; owner_id: string; name: string; type: string; description: string | null; website: string | null; goal: string | null; channel: string | null }
interface Answer { step: string; data: Record<string, string>; skipped: boolean; updated_at?: string }
interface Evidence { id: string; section: string; claim: string; quote: string | null; origin: string; source_id: string | null }
interface Section { section: string; body: string; citations: string[]; status: string }
interface Gate { gate: string; approved_by: string; approved_at: string; note: string | null }
interface Kit { id: string; version: number; hash: string; status: string; signature: string | null; attestation: string | null; created_at: string; error: string | null }

const str = (v: unknown, max = 4000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
  } catch {
    throw new HttpError(400, 'invalid JSON body');
  }
}

async function ownBrand(env: Env, user: User, id: string): Promise<Brand> {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, 'brand not found');
  const [b] = await db.select<Brand>(env, 'brands', `${db.eq('id', id)}&${db.eq('owner_id', user.id)}`);
  if (!b) throw new HttpError(404, 'brand not found');
  return b;
}

async function brandState(env: Env, brand: Brand) {
  const f = db.eq('brand_id', brand.id);
  const [answers, sources, evidence, sections, gates, kits] = await Promise.all([
    db.select<Answer>(env, 'answers', f),
    db.select(env, 'sources', `${f}&select=id,url,title,status,error,fetched_at&order=created_at`),
    // Paged: the kit snapshot records all evidence, so a response row cap must not drop any.
    db.selectAll<Evidence>(env, 'evidence', `${f}&order=created_at.asc,id.asc`),
    db.select<Section>(env, 'kit_sections', f),
    db.select<Gate>(env, 'gates', f),
    db.select<Kit>(env, 'kits', `${f}&select=id,version,hash,status,signature,attestation,created_at,error,payload&order=version.desc`),
  ]);
  return { brand, answers, sources, evidence, sections, gates, kits };
}

function answerText(answers: Answer[], steps: readonly string[]) {
  return answers
    .filter((a) => steps.includes(a.step) && !a.skipped)
    .map((a) => `## ${a.step}\n` + Object.entries(a.data).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n'))
    .join('\n\n');
}

async function draftSection(env: Env, brand: Brand, section: SectionId) {
  const st = await brandState(env, brand);
  const ev = st.evidence;
  const evText = ev.map((e) => `[${e.id}] (${e.origin}${e.quote ? `, quote: "${e.quote.slice(0, 200)}"` : ''}) ${e.claim}`).join('\n') || '(no evidence yet)';
  const system = `You draft one section of a brand kit for "${brand.name}". Use only the owner's answers and the evidence list. Cite the evidence ids you rely on. If something is not supported, write it anyway as a clearly labelled assumption ("Assumption:"). ${SLOP_RULES} Reply with JSON only: {"body": string, "citations": string[]}.`;
  const user = `Section: ${SECTIONS[section].title}\nWhat to write: ${SECTION_GUIDE[section]}\n\nOwner answers:\n${answerText(st.answers, SECTIONS[section].from) || '(none)'}\n\nEvidence:\n${evText}`;
  const { text, model } = await chat(env, system, user);
  const out = parseJson<{ body?: string; citations?: string[] }>(text);
  const known = new Set(ev.map((e) => e.id));
  const citations = (out.citations ?? []).filter((c) => known.has(c));
  const bodyText = str(out.body, 6000);
  if (!bodyText) throw new HttpError(502, 'the AI model returned an empty draft, try again');
  const [row] = await db.upsert<Section>(env, 'kit_sections', { brand_id: brand.id, section, body: bodyText, citations, status: 'drafted', model, updated_at: new Date().toISOString() }, 'brand_id,section');
  // A redraft reopens its gate: the owner approves what is there now.
  const gate = SECTIONS[section].gate;
  if (gate) await db.del(env, 'gates', `${db.eq('brand_id', brand.id)}&${db.eq('gate', gate)}`);
  return row;
}

async function ingest(env: Env, brand: Brand, rawUrl: string) {
  const [src] = await db.insert<{ id: string }>(env, 'sources', { brand_id: brand.id, url: rawUrl.slice(0, 500), status: 'pending' });
  try {
    const page = await readPage(rawUrl);
    const text = page.text.slice(0, 14000);
    const system = `You extract facts about the brand "${brand.name}" from a web page. Each fact needs an exact quote copied character for character from the page text. Sections: ${Object.keys(SECTIONS).join(', ')}. Reply with JSON only: {"facts": [{"section": string, "claim": string, "quote": string}]}. At most 12 facts. No facts that the page does not state.`;
    const { text: reply } = await chat(env, system, `Page title: ${page.title}\nURL: ${page.url}\n\n${text}`);
    const facts = parseJson<{ facts?: { section?: string; claim?: string; quote?: string }[] }>(reply).facts ?? [];
    const norm = (s: string) => s.replace(/\s+/g, ' ').toLowerCase();
    const hay = norm(page.text);
    // Keep only facts whose quote really is on the page (no invented evidence).
    const rows = facts
      .filter((f) => f.claim && f.quote && isSection(f.section ?? '') && hay.includes(norm(f.quote)))
      .map((f) => ({ brand_id: brand.id, source_id: src.id, section: f.section, claim: str(f.claim, 500), quote: str(f.quote, 500), origin: 'source' }));
    if (rows.length) await db.insert(env, 'evidence', rows);
    await db.update(env, 'sources', db.eq('id', src.id), { status: 'read', title: page.title, text_excerpt: text.slice(0, 2000), fetched_at: new Date().toISOString(), url: page.url.slice(0, 500) });
    return { sourceId: src.id, facts: rows.length, dropped: facts.length - rows.length };
  } catch (e) {
    const msg = e instanceof HttpError ? e.message : 'reading the page failed';
    await db.update(env, 'sources', db.eq('id', src.id), { status: 'failed', error: msg });
    throw e;
  }
}

async function registerKit(env: Env, user: User, brand: Brand) {
  const st = await brandState(env, brand);
  const missing = GATES.filter((g) => !st.gates.some((x) => x.gate === g));
  if (missing.length) throw new HttpError(409, `approve these first: ${missing.join(', ')}`);
  if (st.kits.some((k) => k.status === 'pending')) throw new HttpError(409, 'a registration is already in progress');
  // A section that cites evidence which no longer exists (an answer edited after drafting replaces its evidence
  // rows) would register without its support. Refuse, and name the sections to redraft.
  const live = new Set(st.evidence.map((e) => e.id));
  const stale = st.sections.filter((s) => s.citations.some((id) => !live.has(id))).map((s) => s.section);
  if (stale.length) throw new HttpError(409, `these sections cite answers you have since changed; draft them again first: ${stale.join(', ')}`);
  // Gate 3 must postdate the voice answer it approved. Reads of gates and answers are separate requests, so a voice
  // change racing this registration could pair the old approval with the new answer; this check refuses that pair.
  const voiceGate = st.gates.find((g) => g.gate === 'voice');
  const voiceAnswer = st.answers.find((a) => a.step === 'voice');
  if (voiceGate && voiceAnswer?.updated_at && new Date(voiceAnswer.updated_at) > new Date(voiceGate.approved_at)) {
    throw new HttpError(409, 'your voice changed after Gate 3 was approved; approve the voice again first');
  }
  // Every gated section must be in the snapshot. A voice save deletes Gate 3 and the voice section, so a read that
  // raced it could hold the old gate but no section; that kit would be unusable for posts.
  const absent = GATES.filter((g) => !st.sections.some((s) => s.section === g));
  if (absent.length) throw new HttpError(409, `draft and approve these sections first: ${absent.join(', ')}`);
  const version = (st.kits[0]?.version ?? 0) + 1;
  const payload = {
    brand: { id: brand.id, name: brand.name },
    // The sources read so far, so an export of this version lists exactly what it was built from.
    sources: (st.sources as { id: string; url: string; title: string | null; status: string }[]).map((s) => ({ id: s.id, url: s.url, title: s.title, status: s.status })).sort((a, b) => a.id.localeCompare(b.id)),
    version,
    sections: st.sections.map((s) => ({ section: s.section, body: s.body, citations: [...s.citations].sort(), status: s.status })).sort((a, b) => a.section.localeCompare(b.section)),
    gates: st.gates.map((g) => ({ gate: g.gate, approved_by: g.approved_by, approved_at: g.approved_at })).sort((a, b) => a.gate.localeCompare(b.gate)),
    // The claims gate and voice template are part of the registered kit, so approval of a post written to this
    // version applies this version's policy even if the voice answers change later.
    policy: kitPolicy(st.answers.find((a) => a.step === 'voice')),
    // The cited evidence itself (claim and quote), not just ids: evidence rows can be replaced later (owner answers
    // are rewritten on every save), and a post pinned to this version must still see what the kit relied on.
    // All recorded evidence (assumptions excluded): polish reads the cited part, and the claims gate for posts written
    // to this version checks against all of it, so neither depends on rows that can change after registration.
    evidence: st.evidence.filter((e) => e.origin !== 'assumption').map((e) => ({ id: e.id, claim: e.claim, quote: e.quote, origin: e.origin })).sort((a, b) => a.id.localeCompare(b.id)),
  };
  // Posts written to this version are approved against this evidence, at most MAX_EVIDENCE_BATCHES model calls each;
  // a larger set would register a kit no post could ever be approved under, so it is refused before signing.
  const batches = evidenceBatchCount(payload.evidence);
  if (batches > MAX_EVIDENCE_BATCHES) throw new HttpError(422, `your sources hold more evidence than one approval can check (${batches} batches, limit ${MAX_EVIDENCE_BATCHES}); remove sources you no longer need on the Your links step`);
  // The snapshot came from separate reads. Read the voice gate, answer and section again: if any changed while this
  // ran (a voice save in flight), the snapshot may pair rows from two revisions, so refuse rather than sign it.
  const again = await brandState(env, brand);
  const voiceKey = (x: typeof st) => JSON.stringify([
    x.gates.find((g) => g.gate === 'voice')?.approved_at ?? null,
    x.answers.find((a) => a.step === 'voice')?.updated_at ?? null,
    x.sections.find((s) => s.section === 'voice')?.body ?? null,
  ]);
  if (voiceKey(again) !== voiceKey(st)) throw new HttpError(409, 'your voice changed while registering; check Gate 3 and try again');
  const hash = 'sha256:' + (await sha256Hex(canonical(payload)));
  const [kit] = await db.insert<Kit>(env, 'kits', { brand_id: brand.id, version, hash, payload, approved_by: user.id, status: 'pending' });
  try {
    const registrar = await registrarFromSecret(env.REGISTRAR_KEY);
    // Only hashes and ids go onchain (R27): brand id, kit hash, version, approver id.
    const out = await registerKitAttestation(env.RPC_URL, registrar, { brand_id: brand.id, hash, kit_version: String(version), approver: user.id, domain_verified: 'false' });
    const [done] = await db.update<Kit>(env, 'kits', db.eq('id', kit.id), { status: 'registered', signature: out.signature, attestation: out.attestation, registered_at: new Date().toISOString() });
    return { kit: done, explorer: out.explorer, attestationExplorer: out.attestationExplorer, registrar: out.registrar };
  } catch (e) {
    console.error('kit registration failed', safeError(e));
    await db.update(env, 'kits', db.eq('id', kit.id), { status: 'failed', error: 'registration failed' });
    throw new HttpError(502, 'registering on Solana failed, try again');
  }
}

// Voice templates from the first form, mapped to their research 06 equivalent (same map as the Voice step).
const LEGACY_TEMPLATES: Record<string, string> = { friendly_expert: 'friendly' };

/**
 * The policy a kit registers, from the approved voice answer. An answer saved by the older form has no claims gate;
 * rather than silently default it, registration is refused until the owner saves the Voice step once (which, since
 * it changes the answer, reopens Gate 3 for a fresh approval). A skipped voice registers the Standard gate.
 */
export function kitPolicy(voice: { data: Record<string, string>; skipped: boolean } | undefined) {
  // No answer at all is not a skip: nobody chose (or chose to skip) a claims gate, so nothing is registered.
  if (!voice) throw new HttpError(409, 'save the Voice step (or skip it) before registering, so the kit records its claims gate');
  if (voice.skipped) return { claims: '4', template: null };
  if (!['3', '4', '5'].includes(voice.data.claims)) throw new HttpError(409, 'your voice was saved before the claims gate existed: open the Voice step, choose a claims gate and save, then approve Gate 3 again');
  const t = voice.data.template;
  return { claims: voice.data.claims, template: t ? LEGACY_TEMPLATES[t] ?? t : null };
}

/**
 * True when a voice save must reopen Gate 3: the first save (steps are not enforced in order, so a gate could exist
 * before any voice answer) or any change to template, dials, claims, sample or skipped.
 */
export function voiceChanged(prev: { data: Record<string, string>; skipped: boolean } | undefined, next: { data: Record<string, string>; skipped: boolean }) {
  if (!prev) return true;
  return prev.skipped !== next.skipped || canonical(prev.data) !== canonical(next.data);
}

/** Per-IP limit for anonymous endpoints (wrangler.jsonc ratelimits). Without the binding (tests, local) it is a no-op. */
export async function publicLimit(req: Request, env: Env, scope: string) {
  if (!env.PUBLIC_LIMITER) return;
  // Keyed per endpoint and IP, so browsing the Ledger does not use up Verify checks.
  const { success } = await env.PUBLIC_LIMITER.limit({ key: `${scope}:${req.headers.get('cf-connecting-ip') ?? 'unknown'}` });
  if (!success) throw new HttpError(429, 'too many checks from your network; wait a minute and try again');
}

/** Authenticated product API (S1-S4). Returns null for paths it does not own. */
export async function handleApi(req: Request, env: Env, url: URL): Promise<Response | null> {
  const p = url.pathname.split('/').filter(Boolean); // ['api', ...]
  const m = req.method;
  // Public (no sign-in): Verify and Ledger (S6), limited per client IP because they query the database and Solana.
  // Only the supported methods are counted, so stray requests (a GET to /api/verify) cannot use up a visitor's quota.
  if (p[1] === 'verify' && p.length === 2 && m === 'POST') {
    await publicLimit(req, env, 'verify');
    const b = await body(req);
    // Over-long text is refused, never truncated: a truncated text could match a post it does not equal.
    if (typeof b.text === 'string' && b.text.length > 8000) throw new HttpError(413, 'that is longer than any post we register (8,000 characters)');
    return json(await verifyText(env, str(b.text, 8000)));
  }
  if (p[1] === 'ledger' && p.length === 2 && m === 'GET') { await publicLimit(req, env, 'ledger'); return json(await ledger(env)); }
  if (p[1] !== 'me' && p[1] !== 'brands') return null;
  const user = await requireUser(req, env);

  if (p[1] === 'me' && p.length === 2 && m === 'GET') {
    const brands = await db.select<Brand>(env, 'brands', `${db.eq('owner_id', user.id)}&order=created_at`);
    return json({ user, brands });
  }
  if (p[1] === 'brands' && p.length === 2 && m === 'POST') {
    const b = await body(req);
    const name = str(b.name, 120);
    if (!name) throw new HttpError(400, 'a brand name is required');
    const type = ['company', 'person', 'founder_linked'].includes(str(b.type)) ? str(b.type) : 'company';
    const [brand] = await db.insert<Brand>(env, 'brands', { owner_id: user.id, name, type, description: str(b.description, 300) || null, website: str(b.website, 300) || null, goal: str(b.goal, 300) || null, channel: str(b.channel, 60) || null });
    return json({ brand }, 201);
  }
  if (p[1] !== 'brands' || !p[2]) return json({ error: 'not found' }, 404);
  const brand = await ownBrand(env, user, p[2]);

  if (p.length === 3 && m === 'GET') return json(await brandState(env, brand));
  if (p.length === 3 && m === 'PATCH') {
    const b = await body(req);
    const patch: Record<string, string | null> = {};
    for (const k of ['name', 'description', 'website', 'goal', 'channel'] as const) if (k in b) patch[k] = str(b[k], 300) || null;
    if ('name' in patch && !patch.name) throw new HttpError(400, 'a brand name is required');
    const [row] = await db.update<Brand>(env, 'brands', db.eq('id', brand.id), patch);
    return json({ brand: row });
  }
  // PUT /api/brands/:id/answers/:step  {data, skipped}
  if (p[3] === 'answers' && p[4] && m === 'PUT') {
    const step = p[4];
    if (!(STEPS as readonly string[]).includes(step)) throw new HttpError(404, 'unknown step');
    const b = await body(req);
    const data: Record<string, string> = {};
    const raw = (b.data ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(raw).slice(0, 20)) data[k.slice(0, 60)] = str(v, 2000);
    const skipped = b.skipped === true;
    const [prev] = step === 'voice' ? await db.select<Answer>(env, 'answers', `${db.eq('brand_id', brand.id)}&${db.eq('step', 'voice')}`) : [];
    // The voice answer carries the template and claims gate a kit registers. Changing it after Gate 3 reopens that
    // gate and removes the voice section, which must be drafted again, so a kit can only register policy a person approved.
    // The gate is removed *before* the new answer is saved: if anything fails in between, the state is safe (no gate),
    // and a concurrent registration can never pair the new policy with the old approval.
    // An identical save changes nothing (not even updated_at), so an approved Gate 3 stays valid.
    if (step === 'voice' && prev && !voiceChanged(prev, { data, skipped })) return json({ answer: prev });
    if (step === 'voice' && voiceChanged(prev, { data, skipped })) {
      await db.del(env, 'gates', `${db.eq('brand_id', brand.id)}&${db.eq('gate', 'voice')}`);
      // The old voice text described the old settings, so it is removed: Gate 3 can only be approved on a fresh draft.
      await db.del(env, 'kit_sections', `${db.eq('brand_id', brand.id)}&${db.eq('section', 'voice')}`);
    }
    const [row] = await db.upsert(env, 'answers', { brand_id: brand.id, step, data, skipped, updated_at: new Date().toISOString() }, 'brand_id,step');
    // Owner answers are evidence, dated (P2: "owner answer, date").
    await db.del(env, 'evidence', `${db.eq('brand_id', brand.id)}&${db.eq('origin', 'owner_answer')}&${db.eq('section', step)}`);
    const rows = skipped ? [] : Object.entries(data).filter(([, v]) => v).map(([k, v]) => ({ brand_id: brand.id, section: step, claim: `${k}: ${v}`, origin: 'owner_answer' }));
    if (rows.length) await db.insert(env, 'evidence', rows);
    return json({ answer: row });
  }
  if (p[3] === 'sources' && p.length === 5 && m === 'DELETE') {
    // Removing a source removes the facts read from it. Sections that cited them then need redrafting before the next
    // registration (registerKit refuses stale citations); kits already registered keep their own evidence snapshot.
    const id = p[4];
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, 'not found');
    const f = `${db.eq('brand_id', brand.id)}&${db.eq('id', id)}`;
    const [src] = await db.select<{ id: string }>(env, 'sources', `${f}&select=id`);
    if (!src) throw new HttpError(404, 'not found');
    await db.del(env, 'evidence', `${db.eq('brand_id', brand.id)}&${db.eq('source_id', id)}`);
    await db.del(env, 'sources', f);
    return json({ removed: id });
  }
  if (p[3] === 'sources' && p.length === 4 && m === 'POST') {
    const b = await body(req);
    const u = str(b.url, 500);
    if (!u) throw new HttpError(400, 'a link is required');
    return json(await ingest(env, brand, u), 201);
  }
  if (p[3] === 'sections' && p[4] && isSection(p[4])) {
    const section = p[4];
    if (p[5] === 'draft' && m === 'POST') return json({ section: await draftSection(env, brand, section) });
    if (p.length === 5 && m === 'PUT') {
      const b = await body(req);
      const text = str(b.body, 6000);
      if (!text) throw new HttpError(400, 'the section cannot be empty');
      const [row] = await db.upsert(env, 'kit_sections', { brand_id: brand.id, section, body: text, status: 'drafted', updated_at: new Date().toISOString() }, 'brand_id,section');
      const gate = SECTIONS[section].gate;
      if (gate) await db.del(env, 'gates', `${db.eq('brand_id', brand.id)}&${db.eq('gate', gate)}`);
      return json({ section: row });
    }
    if (p[5] === 'approve' && m === 'POST') {
      const b = await body(req);
      const [row] = await db.update<Section>(env, 'kit_sections', `${db.eq('brand_id', brand.id)}&${db.eq('section', section)}`, { status: 'approved' });
      if (!row) throw new HttpError(409, 'draft this section first');
      const gate = SECTIONS[section].gate;
      // Each gate records who, when and why (S3 done-when).
      if (gate) await db.upsert(env, 'gates', { brand_id: brand.id, gate, approved_by: user.id, approved_at: new Date().toISOString(), note: str(b.note, 500) || null }, 'brand_id,gate');
      return json({ section: row });
    }
  }
  if (p[3] === 'kit' && p[4] === 'register' && m === 'POST') return json(await registerKit(env, user, brand), 201);
  // S5 Create: posts in the brand voice; human approval before registration (R8).
  if (p[3] === 'posts') {
    if (p.length === 4 && m === 'GET') {
      // Newest first; ?limit grows as the owner asks for older posts (one extra row says whether more exist).
      // At the MAX_POSTS ceiling there is no further page, so 'more' is false and 'capped' says older posts exist.
      const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), MAX_POSTS);
      const rows = await db.select<Post>(env, 'posts', `${db.eq('brand_id', brand.id)}&order=created_at.desc,id.desc&limit=${limit + 1}`);
      const older = rows.length > limit;
      return json({ posts: rows.slice(0, limit), more: older && limit < MAX_POSTS, capped: older && limit >= MAX_POSTS });
    }
    if (p.length === 4 && m === 'POST') {
      const b = await body(req);
      const brief = str(b.brief, 1000);
      if (!brief) throw new HttpError(400, 'say what the post is about');
      return json({ post: await draftPost(env, brand, brief, str(b.channel, 40)) }, 201);
    }
    const [post] = p[4] && /^[0-9a-f-]{36}$/.test(p[4]) ? await db.select<Post>(env, 'posts', `${db.eq('id', p[4])}&${db.eq('brand_id', brand.id)}`) : [];
    if (!post) throw new HttpError(404, 'post not found');
    const b = await body(req);
    // Every change names the revision the person saw; if the post changed since (another tab), it is refused.
    if (b.rev !== post.rev) throw new HttpError(409, 'this post changed since you loaded it; reload to see the latest version');
    if (p.length === 5 && m === 'PUT') return json({ post: await editPost(env, post, str(b.body, 4000)) });
    if (p[5] === 'approve' && m === 'POST') return json({ post: await approvePost(env, user, post) });
    if (p[5] === 'polish' && m === 'POST') return json({ post: await polishPost(env, post, str(b.action, 40)) });
    if (p[5] === 'undo' && m === 'POST') return json({ post: await undoPost(env, post) });
    if (p[5] === 'register' && m === 'POST') {
      // Refused, not cut: a truncated link would be stored, and shown on Verify, as a different address.
      if (typeof b.publishedUrl === 'string' && b.publishedUrl.trim().length > 500) throw new HttpError(400, 'that link is longer than 500 characters; use the post\'s short link');
      return json(await registerPost(env, user, post, str(b.publishedUrl, 500)), 201);
    }
  }
  return json({ error: 'not found' }, 404);
}
