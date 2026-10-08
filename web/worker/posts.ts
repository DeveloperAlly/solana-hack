import type { User } from './auth';
import { db } from './db';
import { HttpError, sha256Hex, type Env } from './env';
import { chat, parseJson, SLOP_RULES } from './llm';
import { explorerTx, registerKitAttestation, registrarFromSecret } from './registry';

export interface Post {
  id: string; brand_id: string; brief: string; channel: string | null; body: string; checks: Checks; status: string;
  kit_version: number | null; hash: string | null; approved_by: string | null; approved_at: string | null;
  signature: string | null; attestation: string | null; published_url: string | null; created_at: string;
}
interface Checks { slop: { passed: boolean; hits: string[] }; voiceFit: number | null; platform: number | null; notes: string[] }

// Same banned list the drafting prompt carries (llm.ts SLOP_RULES), checked again on the output.
const BANNED = ['delve', 'unlock', 'unleash', 'elevate', 'seamless', 'game-changer', 'game changer', 'revolutioniz', 'cutting-edge', "in today's fast-paced", 'landscape', 'tapestry', 'empower', 'leverage', 'synergy', 'robust', 'harness', 'navigate the', "it's not just", 'more than just', '—'];

export function slopCheck(text: string) {
  const t = text.toLowerCase();
  const hits = BANNED.filter((w) => t.includes(w));
  if ((text.match(/!/g) ?? []).length > 0) hits.push('exclamation mark');
  return { passed: hits.length === 0, hits };
}

/** Whitespace-normalised text, so the same post hashes the same however it was pasted. */
export const normalise = (s: string) => s.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
export const contentHash = async (s: string) => 'sha256:' + (await sha256Hex(normalise(s)));

async function voiceContext(env: Env, brandId: string) {
  const sections = await db.select<{ section: string; body: string; status: string }>(env, 'kit_sections', db.eq('brand_id', brandId));
  const kits = await db.select<{ version: number }>(env, 'kits', `${db.eq('brand_id', brandId)}&${db.eq('status', 'registered')}&order=version.desc&limit=1`);
  const pick = (id: string) => sections.find((s) => s.section === id)?.body ?? '';
  return { kitVersion: kits[0]?.version ?? null, voice: pick('voice'), messaging: pick('messaging'), positioning: pick('positioning'), purpose: pick('purpose') };
}

export async function draftPost(env: Env, brand: { id: string; name: string }, brief: string, channel: string) {
  const ctx = await voiceContext(env, brand.id);
  if (!ctx.voice) throw new HttpError(409, 'approve a voice in Build your brand first');
  const system = `You write one social post for "${brand.name}" in its approved voice. Stay inside the facts in the kit; do not invent numbers, customers or claims. ${SLOP_RULES} Then score it. Reply with JSON only: {"body": string, "voiceFit": number 0-100, "platform": number 0-100, "notes": string[] (max 3, what to improve)}.`;
  const user = `Channel: ${channel || 'LinkedIn'}\nBrief: ${brief}\n\nVoice:\n${ctx.voice}\n\nMessaging:\n${ctx.messaging}\n\nPositioning:\n${ctx.positioning}\n\nPurpose:\n${ctx.purpose}`;
  const { text, model } = await chat(env, system, user);
  const out = parseJson<{ body?: string; voiceFit?: number; platform?: number; notes?: string[] }>(text);
  const body = (out.body ?? '').trim().slice(0, 4000);
  if (!body) throw new HttpError(502, 'the AI model returned an empty post, try again');
  const num = (n: unknown) => (typeof n === 'number' && n >= 0 && n <= 100 ? Math.round(n) : null);
  const checks: Checks = { slop: slopCheck(body), voiceFit: num(out.voiceFit), platform: num(out.platform), notes: (out.notes ?? []).slice(0, 3).map((n) => String(n).slice(0, 200)) };
  const [post] = await db.insert<Post>(env, 'posts', { brand_id: brand.id, brief: brief.slice(0, 1000), channel: channel || null, body, checks, status: 'drafted', model, kit_version: ctx.kitVersion });
  return post;
}

export async function editPost(env: Env, post: Post, body: string) {
  if (post.status === 'registered') throw new HttpError(409, 'a registered post cannot change; draft a new one');
  const text = body.trim().slice(0, 4000);
  if (!text) throw new HttpError(400, 'the post cannot be empty');
  const history = [...((post.checks as Checks & { history?: string[] }).history ?? []), post.body].slice(-10);
  const checks = { ...post.checks, slop: slopCheck(text), history, lastAction: 'edit' };
  const [row] = await db.update<Post>(env, 'posts', db.eq('id', post.id), { body: text, checks, status: 'drafted', approved_by: null, approved_at: null });
  return row;
}

// Polish actions (architecture §6): single click, always reversible (the previous text is kept in checks.history).
const POLISH: Record<string, string> = {
  review: 'Do not rewrite. Return the text unchanged as "body", and in "notes" list up to 4 issues: unclear sentences, factual claims without evidence, off-voice phrases, platform problems.',
  shorten: 'Shorten to the platform norm (LinkedIn about 600 characters, X under 280). Keep the point, the facts and the voice.',
  clarify: 'Simplify sentences and remove jargon. Same length or shorter. Keep the facts and the voice.',
  beautify: 'Structure for scanning: a hook first line, short blocks with blank lines between them, lists as lines starting with "•". For LinkedIn you may set up to 3 key phrases in Unicode mathematical bold. Keep the words otherwise.',
  beautify_accessible: 'Structure for scanning: a hook first line, short blocks with blank lines between them, lists as lines starting with "•". Use no Unicode styling at all (screen readers read it letter by letter).',
};
export const POLISH_ACTIONS = Object.keys(POLISH);

export async function polishPost(env: Env, post: Post, action: string) {
  if (post.status === 'registered') throw new HttpError(409, 'a registered post cannot change; draft a new one');
  const how = POLISH[action];
  if (!how) throw new HttpError(400, 'unknown polish action');
  const system = `You polish one ${post.channel || 'LinkedIn'} post. ${how} ${SLOP_RULES} Reply with JSON only: {"body": string, "notes": string[]}.`;
  const { text } = await chat(env, system, post.body);
  const out = parseJson<{ body?: string; notes?: string[] }>(text);
  const body = action === 'review' ? post.body : (out.body ?? '').trim().slice(0, 4000);
  if (!body) throw new HttpError(502, 'the AI model returned an empty post, try again');
  const history = [...((post.checks as Checks & { history?: string[] }).history ?? []), post.body].slice(-10);
  const checks = { ...post.checks, slop: slopCheck(body), notes: (out.notes ?? []).slice(0, 4).map((n) => String(n).slice(0, 200)), history, lastAction: action };
  const [row] = await db.update<Post>(env, 'posts', db.eq('id', post.id), { body, checks, status: 'drafted', approved_by: null, approved_at: null });
  return row;
}

export async function undoPost(env: Env, post: Post) {
  if (post.status === 'registered') throw new HttpError(409, 'a registered post cannot change');
  const history = [...((post.checks as Checks & { history?: string[] }).history ?? [])];
  const prev = history.pop();
  if (prev === undefined) throw new HttpError(409, 'nothing to undo');
  const checks = { ...post.checks, slop: slopCheck(prev), history, lastAction: 'undo' };
  const [row] = await db.update<Post>(env, 'posts', db.eq('id', post.id), { body: prev, checks, status: 'drafted', approved_by: null, approved_at: null });
  return row;
}

// Human approval before anything is registered or published (R8).
export async function approvePost(env: Env, user: User, post: Post) {
  if (post.status === 'registered') return post;
  if (!post.checks.slop?.passed) throw new HttpError(409, 'fix the slop check first: ' + post.checks.slop.hits.join(', '));
  const [row] = await db.update<Post>(env, 'posts', db.eq('id', post.id), { status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() });
  return row;
}

export async function registerPost(env: Env, user: User, post: Post, publishedUrl: string) {
  if (post.status !== 'approved') throw new HttpError(409, post.status === 'registered' ? 'already registered' : 'approve the post first');
  if (!post.kit_version) throw new HttpError(409, 'register the kit first, so the post can point at a kit version');
  const hash = await contentHash(post.body);
  try {
    const registrar = await registrarFromSecret(env.REGISTRAR_KEY);
    // Only hashes and ids go onchain (R27): brand id, content hash, kit version, approver id.
    const out = await registerKitAttestation(env.RPC_URL, registrar, { brand_id: post.brand_id, hash, kit_version: String(post.kit_version), approver: post.approved_by ?? user.id, domain_verified: 'false' });
    const [row] = await db.update<Post>(env, 'posts', db.eq('id', post.id), { status: 'registered', hash, signature: out.signature, attestation: out.attestation, published_url: publishedUrl || null });
    return { post: row, explorer: out.explorer };
  } catch (e) {
    console.error('post registration failed', e);
    throw new HttpError(502, 'registering on Solana failed, try again');
  }
}

/** Public: is this text an official post (or kit) of a Waterlily brand? */
export async function verifyText(env: Env, text: string) {
  if (!text.trim()) throw new HttpError(400, 'paste a post to check');
  const hash = await contentHash(text);
  const [post] = await db.select<Post>(env, 'posts', `${db.eq('hash', hash)}&${db.eq('status', 'registered')}&limit=1`);
  if (!post) return { official: false, hash };
  const [brand] = await db.select<{ name: string }>(env, 'brands', `${db.eq('id', post.brand_id)}&select=name`);
  return {
    official: true, hash, brand: brand?.name ?? null, kitVersion: post.kit_version, approvedAt: post.approved_at,
    publishedUrl: post.published_url, explorer: post.signature ? explorerTx(post.signature) : null,
  };
}

/** Public ledger: registrations grouped by type, hashes and ids only. */
export async function ledger(env: Env) {
  const [kits, posts] = await Promise.all([
    db.select<{ brand_id: string; version: number; hash: string; signature: string; created_at: string }>(env, 'kits', `${db.eq('status', 'registered')}&select=brand_id,version,hash,signature,created_at&order=created_at.desc&limit=50`),
    db.select<Post>(env, 'posts', `${db.eq('status', 'registered')}&select=brand_id,kit_version,hash,signature,approved_at&order=approved_at.desc&limit=50`),
  ]);
  const ids = [...new Set([...kits, ...posts].map((r) => r.brand_id))];
  const brands = ids.length ? await db.select<{ id: string; name: string }>(env, 'brands', `id=in.(${ids.join(',')})&select=id,name`) : [];
  const name = (id: string) => brands.find((b) => b.id === id)?.name ?? 'unknown';
  return {
    kits: kits.map((k) => ({ type: 'kit', brand: name(k.brand_id), version: k.version, hash: k.hash, at: k.created_at, explorer: explorerTx(k.signature) })),
    content: posts.map((p) => ({ type: 'content', brand: name(p.brand_id), kitVersion: p.kit_version, hash: p.hash, at: p.approved_at, explorer: p.signature ? explorerTx(p.signature) : null })),
  };
}
