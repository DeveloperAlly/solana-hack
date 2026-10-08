import type { User } from './auth';
import { db } from './db';
import { HttpError, safeError, sha256Hex, type Env } from './env';
import { chat, parseJson, SLOP_RULES } from './llm';
import { currentBlockHeight, explorerTx, NotLanded, prepareKitAttestation, readKitAttestation, registrarFromSecret } from './registry';

export interface Post {
  id: string; brand_id: string; brief: string; channel: string | null; body: string; checks: Checks; status: string;
  kit_version: number | null; hash: string | null; approved_by: string | null; approved_at: string | null;
  signature: string | null; attestation: string | null; published_url: string | null; created_at: string; rev: number;
  registering_at?: string | null; registered_at?: string | null; last_valid_block_height?: string | number | null;
}
// A history entry is the full visible state before a change, so Undo restores the text *and* the scores and notes
// that described it. Older rows stored only the text (string); those restore with scores cleared.
export interface Snapshot { body: string; slop: Checks['slop']; voiceFit: number | null; platform: number | null; notes: string[]; source?: 'ai' | 'edit' }
interface Checks { slop: { passed: boolean; hits: string[] }; voiceFit: number | null; platform: number | null; notes: string[]; source?: 'ai' | 'edit'; history?: (Snapshot | string)[]; lastAction?: string }

const snapshot = (post: Post): Snapshot => ({ body: post.body, slop: post.checks.slop, voiceFit: post.checks.voiceFit ?? null, platform: post.checks.platform ?? null, notes: post.checks.notes ?? [], source: post.checks.source });
export const pushHistory = (post: Post) => [...(post.checks.history ?? []), snapshot(post)].slice(-10);
export function restoreEntry(entry: Snapshot | string): Snapshot {
  if (typeof entry === 'string') return { body: entry, slop: slopCheck(entry), voiceFit: null, platform: null, notes: [], source: 'edit' };
  return { ...entry, slop: slopCheck(entry.body) };
}

// Same banned list the drafting prompt carries (llm.ts SLOP_RULES), checked again on the output.
const BANNED = ['delve', 'unlock', 'unleash', 'elevate', 'seamless', 'game-changer', 'game changer', 'revolutioniz', 'cutting-edge', "in today's fast-paced", 'landscape', 'tapestry', 'empower', 'leverage', 'synergy', 'robust', 'harness', 'navigate the', "it's not just", 'more than just', '—'];

export function slopCheck(text: string) {
  const t = text.toLowerCase();
  const hits = BANNED.filter((w) => t.includes(w));
  if ((text.match(/!/g) ?? []).length > 0) hits.push('exclamation mark');
  return { passed: hits.length === 0, hits };
}

/**
 * The canonical form that is hashed (spec/api/routes/create.ts: NFC, whitespace collapsed): Unicode NFC, then every
 * run of whitespace, line breaks included, becomes one space. A post pasted through a platform that rewraps lines or
 * joins paragraphs still verifies; changing any word does not.
 */
export const normalise = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
export const contentHash = async (s: string) => 'sha256:' + (await sha256Hex(normalise(s)));

// Drafts use the latest *registered* kit snapshot (kits.payload), not the editable sections, so a post's
// kit_version always names the kit its voice came from.
async function voiceContext(env: Env, brandId: string, version?: number | null) {
  const which = version ? `&${db.eq('version', String(version))}` : '';
  const [kit] = await db.select<{ version: number; payload: { sections?: { section: string; body: string; citations?: string[] }[]; evidence?: { claim: string; quote: string | null }[] } }>(env, 'kits', `${db.eq('brand_id', brandId)}&${db.eq('status', 'registered')}${which}&select=version,payload&order=version.desc&limit=1`);
  if (!kit) throw new HttpError(409, 'register your brand kit first, so posts are written to a fixed kit version');
  const pick = (id: string) => kit.payload.sections?.find((s) => s.section === id)?.body ?? '';
  const citations = [...new Set((kit.payload.sections ?? []).flatMap((s) => s.citations ?? []))].filter((id) => /^[0-9a-f-]{36}$/.test(id));
  return { kitVersion: kit.version, voice: pick('voice'), messaging: pick('messaging'), positioning: pick('positioning'), purpose: pick('purpose'), citations, evidence: kit.payload.evidence };
}

/** Filter for a compare-and-swap: this post, at the revision we read, in one of the allowed states. */
export const casFilter = (post: Pick<Post, 'id' | 'rev'>, statuses: string[]) =>
  `${db.eq('id', post.id)}&${db.eq('rev', String(post.rev ?? 0))}&status=in.(${statuses.join(',')})`;

/** Changes a post only if nobody else changed it since it was read; otherwise 409, so stale requests never overwrite. */
export async function changePost(env: Env, post: Post, statuses: string[], patch: Partial<Post>) {
  const [row] = await db.update<Post>(env, 'posts', casFilter(post, statuses), { ...patch, rev: (post.rev ?? 0) + 1 });
  if (!row) throw new HttpError(409, 'this post changed in another window or is being registered; reload and try again');
  return row;
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
  // The rewrite is scored again with the same context, so the scores shown always describe the text shown.
  let scored = out;
  const first = slopCheck(body);
  if (!first.passed) {
    const fix = await chat(env, `Rewrite the draft post without these: ${first.hits.join(', ')}. Keep the meaning, facts and voice. ${SLOP_RULES} Then score the rewrite. Reply with JSON only: {"body": string, "voiceFit": number 0-100, "platform": number 0-100, "notes": string[] (max 3)}.`, `${user}\n\nDraft to rewrite:\n${body}`);
    const fixed = parseJson<{ body?: string; voiceFit?: number; platform?: number; notes?: string[] }>(fix.text);
    const fixedBody = (fixed.body ?? '').trim().slice(0, 4000);
    if (fixedBody) { body = fixedBody; scored = fixed; }
  }
  const num = (n: unknown) => (typeof n === 'number' && n >= 0 && n <= 100 ? Math.round(n) : null);
  const checks: Checks = { slop: slopCheck(body), voiceFit: num(scored.voiceFit), platform: num(scored.platform), notes: (scored.notes ?? []).slice(0, 3).map((n) => String(n).slice(0, 200)), source: 'ai' };
  const [post] = await db.insert<Post>(env, 'posts', { brand_id: brand.id, brief: brief.slice(0, 1000), channel: channel || null, body, checks, status: 'drafted', model, kit_version: ctx.kitVersion });
  return post;
}

export async function editPost(env: Env, post: Post, body: string) {
  if (post.status === 'registered' || post.status === 'registering') throw new HttpError(409, post.status === 'registered' ? 'a registered post cannot change; draft a new one' : 'this post is being registered and cannot change');
  const text = body.trim().slice(0, 4000);
  if (!text) throw new HttpError(400, 'the post cannot be empty');
  // Scores belonged to the old text; a person's edit is shown even if it fails the slop check (only approval is blocked).
  const checks: Checks = { ...post.checks, slop: slopCheck(text), voiceFit: null, platform: null, notes: [], source: 'edit', history: pushHistory(post), lastAction: 'edit' };
  return changePost(env, post, ['drafted', 'approved'], { body: text, checks, status: 'drafted', approved_by: null, approved_at: null });
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

/**
 * Maps Unicode "styled" letters and digits to plain ones; screen readers spell styled ones out letter by letter.
 * Blocks scanned: Letterlike Symbols (U+2100-214F), Enclosed Alphanumerics (U+2460-24FF), fullwidth forms
 * (U+FF01-FF5E), Mathematical Alphanumeric Symbols (U+1D400-1D7FF) and the Enclosed Alphanumeric Supplement up to
 * U+1F1E5 (flags after it are left alone). A character is replaced only when NFKC turns it into a single plain
 * letter or digit, or fullwidth ASCII punctuation; real symbols such as ℉, Ω or ™ are kept as written.
 */
const STYLED = /[\u{2100}-\u{214F}\u{2460}-\u{24FF}\u{FF01}-\u{FF5E}\u{1D400}-\u{1D7FF}\u{1F100}-\u{1F1E5}]/gu;
// Superscript and modifier letters (Spacing Modifier Letters U+02B0-02FF, Phonetic Extensions U+1D00-1DBF,
// Superscripts and Subscripts U+2070-209F, Latin-1 ¹ ² ³ ª º) are mapped only in runs of two or more, which is how
// a styled word looks (ᴴᵉˡˡᵒ, ⁰¹²³); a single one is usually meaning (x², a footnote¹) and is kept.
const SUPER_RUN = /[\u{00AA}\u{00B2}\u{00B3}\u{00B9}\u{00BA}\u{0280}\u{0262}\u{026A}\u{029C}\u{029F}\u{0274}\u{028F}\u{02B0}-\u{02FF}\u{1D00}-\u{1DBF}\u{2070}-\u{209F}\u{A730}\u{A731}]{2,}/gu;
// Small capitals have no NFKC decomposition, so they are mapped by table (Latin small capital letters).
const SMALL_CAPS: Record<string, string> = Object.fromEntries([...'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘʀꜱᴛᴜᴠᴡʏᴢ'].map((c, i) => [c, 'abcdefghijklmnoprstuvwyz'[i]]));
const toPlain = (c: string) => { if (SMALL_CAPS[c]) return SMALL_CAPS[c]; const n = c.normalize('NFKC'); return /^[A-Za-z0-9]$/.test(n) ? n : c; };
export const plainLetters = (s: string) => s
  .replace(STYLED, (c) => {
    const n = c.normalize('NFKC');
    const fullwidth = c >= '\uFF01' && c <= '\uFF5E';
    return /^[A-Za-z0-9]$/.test(n) || (fullwidth && /^[\x21-\x7E]$/.test(n)) ? n : c;
  })
  .replace(SUPER_RUN, (run) => [...run].map(toPlain).join(''));

// X's counting rules, from twitter-text 3.1.0 configs.version3: weight 2 by default, 1 for these code point ranges,
// 23 for any URL, 2 for any emoji sequence; the limit is 280 of these.
const X_LIGHT = [[0, 4351], [8192, 8205], [8208, 8223], [8242, 8247]];
/** A post's length as X counts it (weighted), so Shorten can check the real limit. */
export function xWeightedLength(text: string): number {
  let n = 0;
  const withoutUrls = text.replace(/https?:\/\/\S+/gi, () => { n += 23; return ''; });
  for (const { segment } of new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(withoutUrls)) {
    if (/\p{Extended_Pictographic}/u.test(segment)) { n += 2; continue; }
    for (const ch of segment) {
      const cp = ch.codePointAt(0)!;
      n += X_LIGHT.some(([a, b]) => cp >= a && cp <= b) ? 1 : 2;
    }
  }
  return n;
}

/** Hard character limit for a channel, where the platform has one (X: 280). */
export function platformLimit(channel: string | null): number | null {
  return /^\s*(x|twitter)\s*$/i.test(channel ?? '') ? 280 : null;
}

export const isPolishAction = (a: unknown): a is string => typeof a === 'string' && Object.hasOwn(POLISH, a);

export async function polishPost(env: Env, post: Post, action: string) {
  if (!isPolishAction(action)) throw new HttpError(400, 'unknown polish action');
  if (post.status !== 'drafted' && post.status !== 'approved') throw new HttpError(409, post.status === 'registered' ? 'a registered post cannot change; draft a new one' : 'this post is being registered and cannot change');
  // Every action sees the kit version the post was written to, so Review can judge voice and claims,
  // and every result is re-scored against it: the scores shown always describe the text shown.
  const ctx = await voiceContext(env, post.brand_id, post.kit_version);
  // The evidence the registered kit cites, so Review can tell sourced claims from unsupported ones.
  // Kits registered from now on carry their cited evidence; older kits fall back to looking the ids up.
  const evidence = ctx.evidence ?? (ctx.citations.length ? await db.select<{ claim: string; quote: string | null }>(env, 'evidence', `id=in.(${ctx.citations.join(',')})&select=claim,quote`) : []);
  const facts = evidence.map((e) => `- ${e.claim}${e.quote ? ` (source: "${e.quote.slice(0, 160)}")` : ''}`).join('\n') || '(the kit cites no evidence; treat every factual claim as unsupported)';
  const system = `You polish one ${post.channel || 'LinkedIn'} post for a brand with the approved kit below. ${POLISH[action]} A factual claim is supported only if the evidence list states it. ${SLOP_RULES} Then score the resulting post against the kit. Reply with JSON only: {"body": string, "voiceFit": number 0-100, "platform": number 0-100, "notes": string[] (max 4)}.`;
  const user = `Voice:\n${ctx.voice}\n\nMessaging:\n${ctx.messaging}\n\nPositioning:\n${ctx.positioning}\n\nPurpose:\n${ctx.purpose}\n\nEvidence:\n${facts}\n\nPost:\n${post.body}`;
  const { text } = await chat(env, system, user);
  const out = parseJson<{ body?: string; voiceFit?: number; platform?: number; notes?: string[] }>(text);
  let body = action === 'review' ? post.body : (out.body ?? '').trim().slice(0, 4000);
  // The accessible variant is guaranteed, not requested: styled Unicode letters are mapped back to plain ones.
  if (action === 'beautify_accessible') body = plainLetters(body);
  // Shorten must actually meet the platform limit; a longer result is refused, not saved.
  const limit = platformLimit(post.channel);
  if (action === 'shorten' && limit && xWeightedLength(body) > limit) throw new HttpError(422, `Shorten came back at ${xWeightedLength(body)} characters as X counts them, over the ${limit} limit; try again or edit it yourself`);
  if (!body) throw new HttpError(502, 'the AI model returned an empty post, try again');
  const num = (n: unknown) => (typeof n === 'number' && n >= 0 && n <= 100 ? Math.round(n) : null);
  const checks: Checks = {
    ...post.checks, slop: slopCheck(body), voiceFit: num(out.voiceFit), platform: num(out.platform),
    notes: (out.notes ?? []).slice(0, 4).map((n) => String(n).slice(0, 200)), history: pushHistory(post), lastAction: action,
    source: action === 'review' ? post.checks.source : 'ai',
  };
  // Compare-and-swap on the revision read before the model call: an edit, undo or registration meanwhile wins.
  return changePost(env, post, ['drafted', 'approved'], { body, checks, status: 'drafted', approved_by: null, approved_at: null });
}

export async function undoPost(env: Env, post: Post) {
  if (post.status !== 'drafted' && post.status !== 'approved') throw new HttpError(409, 'a registered post cannot change');
  const history = [...(post.checks.history ?? [])];
  const entry = history.pop();
  if (entry === undefined) throw new HttpError(409, 'nothing to undo');
  // The restored text was already shown to the owner, so it stays visible whatever its slop result.
  const prev = restoreEntry(entry);
  const checks: Checks = { ...post.checks, slop: prev.slop, voiceFit: prev.voiceFit, platform: prev.platform, notes: prev.notes, history, lastAction: 'undo', source: 'edit' };
  return changePost(env, post, ['drafted', 'approved'], { body: prev.body, checks, status: 'drafted', approved_by: null, approved_at: null });
}

// Human approval before anything is registered or published (R8).
export async function approvePost(env: Env, user: User, post: Post) {
  if (post.status === 'registered' || post.status === 'approved') return post;
  if (post.status !== 'drafted') throw new HttpError(409, 'this post is being registered');
  if (!post.checks.slop?.passed) throw new HttpError(409, 'fix the slop check first: ' + post.checks.slop.hits.join(', '));
  // Approves exactly the revision whose checks were read: an edit in between bumps rev and this fails with 409.
  return changePost(env, post, ['drafted'], { status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() });
}

export function cleanPublishedUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('scheme');
    // Shown publicly by Verify, so never keep a username or password embedded in the link.
    if (u.username || u.password) throw new Error('credentials');
    return u.toString().slice(0, 500);
  } catch {
    throw new HttpError(400, 'the published link must be a plain http or https address, without a username or password');
  }
}

// Rows claimed before last_valid_block_height was recorded fall back to a wall-clock wait.
const RECONCILE_AFTER_MS = 3 * 60 * 1000;

export async function registerPost(env: Env, user: User, post: Post, publishedUrl: string) {
  if (post.status === 'registering') return reconcilePost(env, post);
  if (post.status !== 'approved') throw new HttpError(409, post.status === 'registered' ? 'already registered' : 'approve the post first');
  if (!post.kit_version) throw new HttpError(409, 'register the kit first, so the post can point at a kit version');
  const url = cleanPublishedUrl(publishedUrl);
  const hash = await contentHash(post.body);
  const registrar = await registrarFromSecret(env.REGISTRAR_KEY);
  // Only hashes and ids go onchain (R27): brand id, content hash, kit version, approver id, domain flag.
  const tx = await prepareKitAttestation(env.RPC_URL, registrar, { brand_id: post.brand_id, hash, kit_version: String(post.kit_version), approver: post.approved_by ?? user.id, domain_verified: 'false' });
  // Claim the post and record the signature and attestation address *before* sending (compare-and-swap on the
  // approved revision), so two requests cannot both write, and any later failure can be reconciled, never re-sent.
  const [claimed] = await db.update<Post>(env, 'posts', casFilter(post, ['approved']), {
    status: 'registering', rev: (post.rev ?? 0) + 1, hash, signature: tx.signature, attestation: tx.attestation, published_url: url, registering_at: new Date().toISOString(),
    last_valid_block_height: String(tx.lastValidBlockHeight),
  });
  if (!claimed) throw new HttpError(409, 'this post changed or a registration is already in progress; reload');
  try {
    await tx.send();
  } catch (e) {
    console.error('post registration send failed', safeError(e));
    if (e instanceof NotLanded) {
      // Certainly not on chain: reopen the post for another try.
      await db.update(env, 'posts', attemptFilter(post.id, tx.signature), RESET);
      throw new HttpError(502, 'Solana rejected the registration, try again');
    }
    // Outcome unknown: keep it locked with its signature; the next Register click reconciles it against the chain.
    throw new HttpError(502, 'sent to Solana but not confirmed yet. It stays locked; press Register again in a few minutes to check.');
  }
  return finishRegistration(env, claimed, tx.explorer);
}

// Every write that settles an attempt names that attempt (its signature), so it can never touch a newer one.
const attemptFilter = (id: string, signature: string) => `${db.eq('id', id)}&${db.eq('status', 'registering')}&${db.eq('signature', signature)}`;
const RESET = { status: 'approved', hash: null, signature: null, attestation: null, registering_at: null, last_valid_block_height: null };

async function finishRegistration(env: Env, post: Post, explorer: string) {
  const [row] = await db.update<Post>(env, 'posts', attemptFilter(post.id, post.signature!), { status: 'registered', registered_at: new Date().toISOString() });
  if (!row) throw new HttpError(500, 'registered on Solana, but saving that failed; press Register again to finish');
  return { post: row, explorer };
}

/** True once the attempt can no longer land: the chain is past its last valid block height. */
async function attemptExpired(env: Env, post: Post) {
  if (post.last_valid_block_height != null) {
    const height = await currentBlockHeight(env.RPC_URL);
    return height !== null && height > BigInt(post.last_valid_block_height);
  }
  return Date.now() - new Date(post.registering_at ?? 0).getTime() > RECONCILE_AFTER_MS;
}

/** A post left in 'registering' (unknown outcome or a failed save): settle it from what is actually on chain. */
export async function reconcilePost(env: Env, post: Post) {
  if (!post.attestation || !post.hash || !post.signature) throw new HttpError(409, 'a registration is already in progress');
  const registrar = await registrarFromSecret(env.REGISTRAR_KEY);
  const onchain = await readKitAttestation(env.RPC_URL, registrar.address, post.attestation, { hash: post.hash, brand_id: post.brand_id, kit_version: String(post.kit_version) });
  if (onchain === 'verified') return finishRegistration(env, post, explorerTx(post.signature));
  if (onchain === 'missing' && (await attemptExpired(env, post))) {
    const [reset] = await db.update<Post>(env, 'posts', attemptFilter(post.id, post.signature), RESET);
    if (!reset) throw new HttpError(409, 'this registration was already settled; reload');
    throw new HttpError(409, 'the earlier registration never reached Solana; press Register to try again');
  }
  if (onchain === 'mismatch') {
    console.error('attestation mismatch on reconcile', { post: post.id });
    throw new HttpError(500, 'the onchain record does not match this post; it stays locked for review');
  }
  throw new HttpError(409, 'the registration is still settling on Solana; try again in a minute');
}

/**
 * Public: is this text an official post of a Waterlily brand? Identical text can be registered by more than one
 * brand, so every match is returned, earliest first; the top-level fields describe the earliest registration.
 */
export async function verifyText(env: Env, text: string) {
  if (!text.trim()) throw new HttpError(400, 'paste a post to check');
  const hash = await contentHash(text);
  // At most 10 registrations are checked onchain per request (each costs RPC reads); an 11th row signals truncation.
  const rows = await db.select<Post>(env, 'posts', `${db.eq('hash', hash)}&${db.eq('status', 'registered')}&order=registered_at.asc&limit=11`);
  const truncated = rows.length > 10;
  if (!rows.length) return { official: false, checked: true, hash, matches: [] };
  // The database is an index; Solana is the proof. "Official" requires a verified attestation: it exists, the
  // Registrar signed it under the WATERLILY credential and WL-KIT schema, and it carries this hash.
  const registrar = env.REGISTRAR_KEY ? (await registrarFromSecret(env.REGISTRAR_KEY)).address : null;
  const checked = await Promise.all(rows.slice(0, 10).map(async (p) => ({
    p, onchain: registrar && p.attestation ? await readKitAttestation(env.RPC_URL, registrar, p.attestation, { hash, brand_id: p.brand_id, kit_version: String(p.kit_version) }) : ('unavailable' as const),
  })));
  const verified = checked.filter((c) => c.onchain === 'verified');
  // Some rows could not be checked: the result is partial, and says so.
  const partial = checked.some((c) => c.onchain === 'unavailable');
  if (!verified.length) {
    // Could not check Solana: say so, never certify from the index alone.
    if (checked.some((c) => c.onchain === 'unavailable')) return { official: false, checked: false, hash, matches: [], note: 'Solana could not be checked just now, so this cannot be confirmed; try again in a minute' };
    return { official: false, checked: true, hash, matches: [], note: 'a record exists, but its Solana attestation is missing or does not match' };
  }
  const ids = [...new Set(verified.map((c) => c.p.brand_id))];
  const brands = await db.select<{ id: string; name: string }>(env, 'brands', `id=in.(${ids.join(',')})&select=id,name`);
  const matches = verified.map(({ p }) => ({
    brand: brands.find((b) => b.id === p.brand_id)?.name ?? null, kitVersion: p.kit_version, approvedAt: p.approved_at,
    registeredAt: p.registered_at ?? null, publishedUrl: p.published_url, explorer: p.signature ? explorerTx(p.signature) : null,
    // Every registration so far attests domain_verified 'false': the brand name is self-declared.
    domainVerified: false,
  }));
  return { official: true, checked: true, partial, hash, ...matches[0], matches, truncated };
}

/** Public ledger: the latest 50 registrations of each type: brand name, fingerprint, version and explorer link. Content stays private. */
export async function ledger(env: Env) {
  const [kits, posts] = await Promise.all([
    db.select<{ brand_id: string; version: number; hash: string; signature: string; created_at: string }>(env, 'kits', `${db.eq('status', 'registered')}&select=brand_id,version,hash,signature,created_at&order=created_at.desc&limit=50`),
    db.select<Post>(env, 'posts', `${db.eq('status', 'registered')}&select=brand_id,kit_version,hash,signature,registered_at&order=registered_at.desc&limit=50`),
  ]);
  const ids = [...new Set([...kits, ...posts].map((r) => r.brand_id))];
  const brands = ids.length ? await db.select<{ id: string; name: string }>(env, 'brands', `id=in.(${ids.join(',')})&select=id,name`) : [];
  const name = (id: string) => brands.find((b) => b.id === id)?.name ?? 'unknown';
  return {
    kits: kits.map((k) => ({ type: 'kit', brand: name(k.brand_id), version: k.version, hash: k.hash, at: k.created_at, explorer: explorerTx(k.signature) })),
    content: posts.map((p) => ({ type: 'content', brand: name(p.brand_id), kitVersion: p.kit_version, hash: p.hash, at: p.registered_at ?? null, explorer: p.signature ? explorerTx(p.signature) : null })),
  };
}
