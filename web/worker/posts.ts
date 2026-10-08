import type { User } from './auth';
import { db } from './db';
import { HttpError, safeError, sha256Hex, type Env } from './env';
import { chat, parseJson, SLOP_RULES } from './llm';
import { explorerTx, registerKitAttestation, registrarFromSecret } from './registry';

export interface Post {
  id: string; brand_id: string; brief: string; channel: string | null; body: string; checks: Checks; status: string;
  kit_version: number | null; hash: string | null; approved_by: string | null; approved_at: string | null;
  signature: string | null; attestation: string | null; published_url: string | null; created_at: string;
}
interface Checks { slop: { passed: boolean; hits: string[] }; voiceFit: number | null; platform: number | null; notes: string[]; source?: 'ai' | 'edit' }

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

// Drafts use the latest *registered* kit snapshot (kits.payload), not the editable sections, so a post's
// kit_version always names the kit its voice came from.
async function voiceContext(env: Env, brandId: string) {
  const [kit] = await db.select<{ version: number; payload: { sections?: { section: string; body: string }[] } }>(env, 'kits', `${db.eq('brand_id', brandId)}&${db.eq('status', 'registered')}&select=version,payload&order=version.desc&limit=1`);
  if (!kit) throw new HttpError(409, 'register your brand kit first, so posts are written to a fixed kit version');
  const pick = (id: string) => kit.payload.sections?.find((s) => s.section === id)?.body ?? '';
  return { kitVersion: kit.version, voice: pick('voice'), messaging: pick('messaging'), positioning: pick('positioning'), purpose: pick('purpose') };
}

export async function draftPost(env: Env, brand: { id: string; name: string }, brief: string, channel: string) {
  const ctx = await voiceContext(env, brand.id);
  if (!ctx.voice) throw new HttpError(409, 'the registered kit has no voice section');
  const system = `You write one social post for "${brand.name}" in its approved voice. Stay inside the facts in the kit; do not invent numbers, customers or claims. ${SLOP_RULES} Then score it. Reply with JSON only: {"body": string, "voiceFit": number 0-100, "platform": number 0-100, "notes": string[] (max 3, what to improve)}.`;
  const user = `Channel: ${channel || 'LinkedIn'}\nBrief: ${brief}\n\nVoice:\n${ctx.voice}\n\nMessaging:\n${ctx.messaging}\n\nPositioning:\n${ctx.positioning}\n\nPurpose:\n${ctx.purpose}`;
  const { text, model } = await chat(env, system, user);
  const out = parseJson<{ body?: string; voiceFit?: number; platform?: number; notes?: string[] }>(text);
  let body = (out.body ?? '').trim().slice(0, 4000);
  if (!body) throw new HttpError(502, 'the AI model returned an empty post, try again');
  // R9: an AI draft that fails the slop check gets one automatic rewrite; if it still fails it is stored
  // but never shown (the UI hides AI text whose slop check failed).
  const first = slopCheck(body);
  if (!first.passed) {
    const fix = await chat(env, `Rewrite this post without these: ${first.hits.join(', ')}. Keep the meaning, facts and voice. ${SLOP_RULES} Reply with JSON only: {"body": string}.`, body);
    const fixed = (parseJson<{ body?: string }>(fix.text).body ?? '').trim().slice(0, 4000);
    if (fixed) body = fixed;
  }
  const num = (n: unknown) => (typeof n === 'number' && n >= 0 && n <= 100 ? Math.round(n) : null);
  const checks: Checks = { slop: slopCheck(body), voiceFit: num(out.voiceFit), platform: num(out.platform), notes: (out.notes ?? []).slice(0, 3).map((n) => String(n).slice(0, 200)), source: 'ai' };
  const [post] = await db.insert<Post>(env, 'posts', { brand_id: brand.id, brief: brief.slice(0, 1000), channel: channel || null, body, checks, status: 'drafted', model, kit_version: ctx.kitVersion });
  return post;
}

export async function editPost(env: Env, post: Post, body: string) {
  if (post.status === 'registered') throw new HttpError(409, 'a registered post cannot change; draft a new one');
  const text = body.trim().slice(0, 4000);
  if (!text) throw new HttpError(400, 'the post cannot be empty');
  // Scores belonged to the old text; a person's edit is shown even if it fails the slop check (only approval is blocked).
  const checks: Checks = { ...post.checks, slop: slopCheck(text), voiceFit: null, platform: null, notes: [], source: 'edit' };
  const [row] = await db.update<Post>(env, 'posts', db.eq('id', post.id), { body: text, checks, status: 'drafted', approved_by: null, approved_at: null });
  return row;
}

// Human approval before anything is registered or published (R8).
export async function approvePost(env: Env, user: User, post: Post) {
  if (post.status === 'registered') return post;
  if (!post.checks.slop?.passed) throw new HttpError(409, 'fix the slop check first: ' + post.checks.slop.hits.join(', '));
  const [row] = await db.update<Post>(env, 'posts', db.eq('id', post.id), { status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() });
  return row;
}

export function cleanPublishedUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('scheme');
    return u.toString().slice(0, 500);
  } catch {
    throw new HttpError(400, 'the published link must be an http or https address');
  }
}

export async function registerPost(env: Env, user: User, post: Post, publishedUrl: string) {
  if (post.status !== 'approved') throw new HttpError(409, post.status === 'registered' ? 'already registered' : post.status === 'registering' ? 'a registration is already in progress' : 'approve the post first');
  if (!post.kit_version) throw new HttpError(409, 'register the kit first, so the post can point at a kit version');
  const url = cleanPublishedUrl(publishedUrl);
  // Claim the post first (approved -> registering, conditional), so two requests cannot both write to chain.
  const [claimed] = await db.update<Post>(env, 'posts', `${db.eq('id', post.id)}&${db.eq('status', 'approved')}`, { status: 'registering' });
  if (!claimed) throw new HttpError(409, 'a registration is already in progress');
  const hash = await contentHash(claimed.body);
  try {
    const registrar = await registrarFromSecret(env.REGISTRAR_KEY);
    // Only hashes and ids go onchain (R27): brand id, content hash, kit version, approver id.
    const out = await registerKitAttestation(env.RPC_URL, registrar, { brand_id: post.brand_id, hash, kit_version: String(claimed.kit_version), approver: claimed.approved_by ?? user.id, domain_verified: 'false' });
    const [row] = await db.update<Post>(env, 'posts', `${db.eq('id', post.id)}&${db.eq('status', 'registering')}`, { status: 'registered', hash, signature: out.signature, attestation: out.attestation, published_url: url });
    return { post: row, explorer: out.explorer };
  } catch (e) {
    console.error('post registration failed', safeError(e));
    await db.update(env, 'posts', `${db.eq('id', post.id)}&${db.eq('status', 'registering')}`, { status: 'approved' });
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

/** Public ledger: registrations grouped by type: brand name, fingerprint, version and explorer link. Content stays private. */
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
