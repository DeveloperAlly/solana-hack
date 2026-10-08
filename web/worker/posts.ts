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
interface Checks { slop: { passed: boolean; hits: string[] }; voiceFit: number | null; platform: number | null; notes: string[]; source?: 'ai' | 'edit'; history?: (Snapshot | string)[]; lastAction?: string; policy?: PolicyResult }

const snapshot = (post: Post): Snapshot => ({ body: post.body, slop: post.checks.slop, voiceFit: post.checks.voiceFit ?? null, platform: post.checks.platform ?? null, notes: post.checks.notes ?? [], source: post.checks.source });
export const pushHistory = (post: Post) => [...(post.checks.history ?? []), snapshot(post)].slice(-10);
export function restoreEntry(entry: Snapshot | string): Snapshot {
  if (typeof entry === 'string') return { body: entry, slop: slopCheck(entry), voiceFit: null, platform: null, notes: [], source: 'edit' };
  return { ...entry, slop: slopCheck(entry.body) };
}

// Same banned list the drafting prompt carries (llm.ts SLOP_RULES), checked again on the output.
const BANNED = ['delve', 'unlock', 'unleash', 'elevate', 'seamless', 'game-changer', 'game changer', 'revolutioniz', 'cutting-edge', "in today's fast-paced", 'landscape', 'tapestry', 'empower', 'leverage', 'synergy', 'robust', 'harness', 'navigate the', "it's not just", 'more than just', '—'];

export function slopCheck(text: string) {
  // Checked on a plain copy so styled letters (𝘂𝗻𝗹𝗼𝗰𝗸, ᴜɴʟᴏᴄᴋ, fullwidth ！) cannot hide a banned term; the post keeps its styling.
  const plain = plainLetters(text).normalize('NFKC');
  const t = plain.toLowerCase();
  const hits = BANNED.filter((w) => t.includes(w));
  if ((plain.match(/!/g) ?? []).length > 0) hits.push('exclamation mark');
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
  const [kit] = await db.select<{ version: number; payload: { brand?: { name?: string }; sections?: { section: string; body: string; citations?: string[] }[]; evidence?: { claim: string; quote: string | null }[] } }>(env, 'kits', `${db.eq('brand_id', brandId)}&${db.eq('status', 'registered')}${which}&select=version,payload&order=version.desc&limit=1`);
  if (!kit) throw new HttpError(409, 'register your brand kit first, so posts are written to a fixed kit version');
  const pick = (id: string) => kit.payload.sections?.find((s) => s.section === id)?.body ?? '';
  const citations = [...new Set((kit.payload.sections ?? []).flatMap((s) => s.citations ?? []))].filter((id) => /^[0-9a-f-]{36}$/.test(id));
  return { kitVersion: kit.version, brandName: kit.payload.brand?.name, voice: pick('voice'), messaging: pick('messaging'), positioning: pick('positioning'), purpose: pick('purpose'), citations, evidence: kit.payload.evidence };
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

/** A model reply as a post, with every field type-checked: a wrong type becomes empty, never a crash. */
export function modelPost(raw: unknown): { body: string; voiceFit: unknown; platform: unknown; notes: string[] } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    body: typeof r.body === 'string' ? r.body : '',
    voiceFit: r.voiceFit, platform: r.platform,
    notes: Array.isArray(r.notes) ? r.notes.filter((n): n is string => typeof n === 'string') : [],
  };
}

export async function draftPost(env: Env, brand: { id: string; name: string }, brief: string, channel: string) {
  const ctx = await voiceContext(env, brand.id);
  if (!ctx.voice) throw new HttpError(409, 'the registered kit has no voice section');
  // The brand name is the one registered in the kit the post is written to, not a later rename.
  const system = `You write one social post for "${ctx.brandName ?? brand.name}" in its approved voice. Stay inside the facts in the kit; do not invent numbers, customers or claims. ${SLOP_RULES} Then score it. Reply with JSON only: {"body": string, "voiceFit": number 0-100, "platform": number 0-100, "notes": string[] (max 3, what to improve)}.`;
  const user = `Channel: ${channel || 'LinkedIn'}\nBrief: ${brief}\n\nVoice:\n${ctx.voice}\n\nMessaging:\n${ctx.messaging}\n\nPositioning:\n${ctx.positioning}\n\nPurpose:\n${ctx.purpose}`;
  const { text, model: firstModel } = await chat(env, system, user);
  // The model recorded is the one that wrote the text kept: the rewrite's, when a rewrite is accepted.
  let model = firstModel;
  const out = modelPost(parseJson<unknown>(text));
  let body = out.body.trim().slice(0, 4000);
  if (!body) throw new HttpError(502, 'the AI model returned an empty post, try again');
  // R9: an AI draft that fails the slop check gets one automatic rewrite; if it still fails it is stored
  // but never shown (the UI hides AI text whose slop check failed).
  // The rewrite is scored again with the same context, so the scores shown always describe the text shown.
  let scored = out;
  const first = slopCheck(body);
  if (!first.passed) {
    const fix = await chat(env, `Rewrite the draft post without these: ${first.hits.join(', ')}. Keep the meaning, facts and voice. ${SLOP_RULES} Then score the rewrite. Reply with JSON only: {"body": string, "voiceFit": number 0-100, "platform": number 0-100, "notes": string[] (max 3)}.`, `${user}\n\nDraft to rewrite:\n${body}`);
    const fixed = modelPost(parseJson<unknown>(fix.text));
    const fixedBody = fixed.body.trim().slice(0, 4000);
    if (fixedBody) { body = fixedBody; scored = fixed; model = fix.model; }
  }
  const num = (n: unknown) => (typeof n === 'number' && n >= 0 && n <= 100 ? Math.round(n) : null);
  const checks: Checks = { slop: slopCheck(body), voiceFit: num(scored.voiceFit), platform: num(scored.platform), notes: scored.notes.slice(0, 3).map((n) => n.slice(0, 200)), source: 'ai' };
  const [post] = await db.insert<Post>(env, 'posts', { brand_id: brand.id, brief: brief.slice(0, 1000), channel: channel || null, body, checks, status: 'drafted', model, kit_version: ctx.kitVersion });
  return post;
}

export async function editPost(env: Env, post: Post, body: string) {
  if (post.status === 'registered' || post.status === 'registering') throw new HttpError(409, post.status === 'registered' ? 'a registered post cannot change; draft a new one' : 'this post is being registered and cannot change');
  const text = body.trim().slice(0, 4000);
  if (!text) throw new HttpError(400, 'the post cannot be empty');
  // Scores belonged to the old text; a person's edit is shown even if it fails the slop check (only approval is blocked).
  const checks: Checks = { ...post.checks, slop: slopCheck(text), voiceFit: null, platform: null, notes: [], source: 'edit', history: pushHistory(post), lastAction: 'edit', policy: undefined };
  return changePost(env, post, ['drafted', 'approved'], { body: text, checks, status: 'drafted', approved_by: null, approved_at: null });
}

// Polish actions (architecture §6): single click, always reversible (the previous text is kept in checks.history).
const POLISH: Record<string, string> = {
  review: 'Do not rewrite. Return the text unchanged as "body", and in "notes" list up to 4 issues: unclear sentences, factual claims without evidence, off-voice phrases, platform problems.',
  shorten: 'Shorten to the platform norm (LinkedIn about 600 characters, X under 280). Keep the point, the facts and the voice.',
  clarify: 'Simplify sentences and remove jargon. Same length or shorter. Keep the facts and the voice.',
  beautify: 'Structure for scanning: a hook first line, short blocks with blank lines between them, lists as lines starting with "•". For LinkedIn you may set up to 3 key phrases in Unicode mathematical bold. Keep the words otherwise.',
  beautify_accessible: 'Structure for scanning: a hook first line, short blocks with blank lines between them, lists as lines starting with "•". Use no Unicode styling at all: this is the accessible variant, plain letters only. Keep the words otherwise.',
};
export const POLISH_ACTIONS = Object.keys(POLISH);

/**
 * Maps Unicode "styled" letters and digits to plain ones. Policy: the accessible Beautify variant contains no styled
 * letters, whatever the model returns.
 * Blocks scanned: Letterlike Symbols (U+2100-214F), Enclosed Alphanumerics (U+2460-24FF), fullwidth forms
 * (U+FF01-FF5E), Mathematical Alphanumeric Symbols (U+1D400-1D7FF) and the Enclosed Alphanumeric Supplement up to
 * U+1F1E5 (flags after it are left alone). A character is replaced only when NFKC turns it into a single plain
 * letter or digit, or fullwidth ASCII punctuation; real symbols such as ℉, Ω or ™ are kept as written.
 */
const STYLED = /[\u{2100}-\u{214F}\u{2460}-\u{24FF}\u{FF01}-\u{FF5E}\u{1D400}-\u{1D7FF}\u{1F100}-\u{1F1E5}]/gu;
// Superscript and modifier letters (Spacing Modifier Letters U+02B0-02FF, Phonetic Extensions U+1D00-1DBF,
// Superscripts and Subscripts U+2070-209F, Latin-1 ¹ ² ³ ª º) are mapped only in runs of two or more, which is how
// a styled word looks (ᴴᵉˡˡᵒ); a single one is usually meaning (x², a footnote¹) and is kept. Runs made only of
// superscript or subscript digits, signs and brackets are kept too: they are quantities (10¹², 10⁻¹², H₂O).
const SUPER_RUN = /[\u{00AA}\u{00B2}\u{00B3}\u{00B9}\u{00BA}\u{0280}\u{0262}\u{026A}\u{029C}\u{029F}\u{0274}\u{028F}\u{02B0}-\u{02FF}\u{1D00}-\u{1DBF}\u{2070}-\u{209F}\u{A730}\u{A731}]{2,}/gu;
const NUMERIC_RUN = /^[\u{00B2}\u{00B3}\u{00B9}\u{2070}\u{2074}-\u{207E}\u{2080}-\u{208E}]+$/u;
// Small capitals have no NFKC decomposition, so they are mapped by table (Latin small capital letters).
const SMALL_CAPS: Record<string, string> = Object.fromEntries([...'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘʀꜱᴛᴜᴠᴡʏᴢ'].map((c, i) => [c, 'abcdefghijklmnoprstuvwyz'[i]]));
const toPlain = (c: string) => { if (SMALL_CAPS[c]) return SMALL_CAPS[c]; const n = c.normalize('NFKC'); return /^[A-Za-z0-9]$/.test(n) ? n : c; };
export const plainLetters = (s: string) => s
  .replace(STYLED, (c) => {
    const n = c.normalize('NFKC');
    const fullwidth = c >= '\uFF01' && c <= '\uFF5E';
    return /^[A-Za-z0-9]$/.test(n) || (fullwidth && /^[\x21-\x7E]$/.test(n)) ? n : c;
  })
  .replace(SUPER_RUN, (run, at: number, all: string) => (NUMERIC_RUN.test(run) || insideIpa(all, at, run.length) ? run : [...run].map(toPlain).join('')));

// Phonetic transcriptions are meaning, not styling: /ʰɪ/ and [ʜɪ] are written that way on purpose. A run inside a
// /…/ or […] span on one line that contains an IPA or modifier letter is left as written.
const IPA_SPAN = /\/[^/\n]{1,80}\/|\[[^\]\n]{1,80}\]/gu;
const IPA_CHAR = /[\u{0250}-\u{02FF}\u{1D00}-\u{1DBF}]/u;
function insideIpa(all: string, at: number, len: number) {
  for (const m of all.matchAll(IPA_SPAN)) {
    const start = m.index ?? 0;
    if (start < at && at + len <= start + m[0].length && IPA_CHAR.test(m[0])) return true;
  }
  return false;
}

// X's counting rules, from twitter-text 3.1.0 configs.version3: weight 2 by default, 1 for these code point ranges,
// 23 for any URL, 2 for any emoji sequence; the limit is 280 of these.
const X_LIGHT = [[0, 4351], [8192, 8205], [8208, 8223], [8242, 8247]];
/** A post's length as X counts it (weighted), so Shorten can check the real limit. */
export function xWeightedLength(text: string): number {
  let n = 0;
  // A URL ends before trailing punctuation (as twitter-text extracts it); that punctuation is counted as text.
  const withoutUrls = text.replace(/https?:\/\/\S+/gi, (u) => { const tail = u.match(/[.,:;!?)\]'"]+$/)?.[0] ?? ''; n += 23; return tail; });
  for (const { segment } of new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(withoutUrls)) {
    // Emoji graphemes: pictographs, flags (regional-indicator pairs) and keycaps (base + U+20E3) each count 2.
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u.test(segment)) { n += 2; continue; }
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
  const cited = new Set(ctx.citations);
  const evidence = (ctx.evidence as { id?: string; claim: string; quote: string | null }[] | undefined)?.filter((e) => !e.id || cited.has(e.id)) ?? (ctx.citations.length ? await db.select<{ claim: string; quote: string | null }>(env, 'evidence', `id=in.(${ctx.citations.join(',')})&select=claim,quote`) : []);
  const facts = evidence.map((e) => `- ${e.claim}${e.quote ? ` (source: "${e.quote.slice(0, 160)}")` : ''}`).join('\n') || '(the kit cites no evidence; treat every factual claim as unsupported)';
  const system = `You polish one ${post.channel || 'LinkedIn'} post for a brand with the approved kit below. ${POLISH[action]} A factual claim is supported only if the evidence list states it. ${SLOP_RULES} Then score the resulting post against the kit. Reply with JSON only: {"body": string, "voiceFit": number 0-100, "platform": number 0-100, "notes": string[] (max 4)}.`;
  const user = `Voice:\n${ctx.voice}\n\nMessaging:\n${ctx.messaging}\n\nPositioning:\n${ctx.positioning}\n\nPurpose:\n${ctx.purpose}\n\nEvidence:\n${facts}\n\nPost:\n${post.body}`;
  const { text } = await chat(env, system, user);
  // Type-checked like drafts (modelPost): a malformed reply becomes an empty body (a clean 502), never a crash.
  const out = modelPost(parseJson<unknown>(text));
  let body = action === 'review' ? post.body : out.body.trim();
  // Refused, not cut: truncating would drop words (or qualifiers) and the scores would describe text we did not keep.
  if (body.length > 4000) throw new HttpError(422, 'the polished post came back longer than 4,000 characters, so nothing was saved; try again or edit it yourself');
  // The accessible variant is guaranteed, not requested: styled Unicode letters are mapped back to plain ones.
  const modelBody = body;
  if (action === 'beautify_accessible') body = plainLetters(body);
  // The model scored its own text; if mapping changed it, those scores no longer describe what is saved.
  const rescored = body !== modelBody;
  // Shorten must actually meet the platform limit; a longer result is refused, not saved.
  const limit = platformLimit(post.channel);
  if (action === 'shorten' && limit && xWeightedLength(body) > limit) throw new HttpError(422, `Shorten came back at ${xWeightedLength(body)} characters as X counts them, over the ${limit} limit; try again or edit it yourself`);
  if (!body) throw new HttpError(502, 'the AI model returned an empty post, try again');
  // Shorten must also be shorter than what it started from, measured the way the channel counts.
  const size = (t: string) => (limit ? xWeightedLength(t) : [...t].length);
  if (action === 'shorten' && size(body) >= size(post.body)) throw new HttpError(422, 'Shorten did not make the post any shorter; try again or edit it yourself');
  // Clarify is asked for the same length or shorter; a longer result is refused rather than saved.
  if (action === 'clarify' && size(body) > size(post.body)) throw new HttpError(422, 'Clarify made the post longer, so nothing was saved; try again or edit it yourself');
  const num = (n: unknown) => (typeof n === 'number' && n >= 0 && n <= 100 ? Math.round(n) : null);
  const checks: Checks = {
    // Review never changes the text, so its scores stay the ones that describe that text; only its notes are new.
    ...post.checks, slop: slopCheck(body),
    voiceFit: action === 'review' ? post.checks.voiceFit ?? null : rescored ? null : num(out.voiceFit),
    platform: action === 'review' ? post.checks.platform ?? null : rescored ? null : num(out.platform),
    notes: rescored ? ['Styled letters were replaced with plain ones after scoring, so the scores were cleared. Run Review for notes on this text.'] : out.notes.slice(0, 4).map((n) => n.slice(0, 200)),
    history: pushHistory(post), lastAction: action,
    source: action === 'review' ? post.checks.source : 'ai', policy: undefined,
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
  const checks: Checks = { ...post.checks, slop: prev.slop, voiceFit: prev.voiceFit, platform: prev.platform, notes: prev.notes, history, lastAction: 'undo', source: 'edit', policy: undefined };
  return changePost(env, post, ['drafted', 'approved'], { body: prev.body, checks, status: 'drafted', approved_by: null, approved_at: null });
}

// Research 06: claims strictness is a gate, not a slider, and Flirty needs a hard content-policy gate.
export const CLAIMS_POLICY: Record<string, string> = {
  '5': 'strict: every claim about the brand, its product, customers or results must be supported by the evidence list',
  '4': 'standard: every factual claim (numbers, customers, results, comparisons, firsts) must be supported by the evidence list; opinions and intentions are fine',
  '3': 'light: opinions are fine; any number, statistic or named customer must be supported by the evidence list',
};
// Content categories the checker must answer for every post. Sexual content and anything sexualising minors are
// blocked for every brand; explicit language is blocked for Flirty (research 06 guardrail), allowed elsewhere.
const CATEGORIES = { sexual: 'sexual content', minors: 'content sexualising or targeting minors', explicitLanguage: 'explicit language' } as const;
type Category = keyof typeof CATEGORIES;
/**
 * Version of the approval check. Bumped when what a passing result means changes; 2 = checked against the evidence
 * snapshot of the post's kit version. A result from an earlier version is not current and must be run again.
 */
export const POLICY_VERSION = 2;
export interface PolicyResult { v: number; claims: string; template: string | null; unsupported: string[]; blocked: string[]; passed: boolean }

/**
 * Decides from the checker's raw reply; pure, so the gate is testable without a model. The reply must have exactly
 * the expected types (a string array and three booleans); anything else is rejected, so the gate fails closed.
 */
export function policyVerdict(claims: string, template: string | null, raw: unknown): PolicyResult {
  const r = raw as Record<string, unknown> | null;
  const ok = !!r && Array.isArray(r.unsupported) && r.unsupported.every((x) => typeof x === 'string')
    && (Object.keys(CATEGORIES) as Category[]).every((k) => typeof r[k] === 'boolean');
  if (!ok) throw new HttpError(502, 'the approval check returned an unusable answer, so nothing was approved; try again');
  // Every unsupported claim is kept whole: dropping one, or cutting its text, would let a later evidence batch clear
  // a shortened claim whose missing qualifier was the unsupported part. Only the screen shortens them for display.
  // (4000 is the longest a post can be, so no claim from a post is cut by it.)
  const unsupported = (r!.unsupported as string[]).map((x) => x.slice(0, 4000));
  const enforced: Category[] = template === 'flirty' ? ['sexual', 'minors', 'explicitLanguage'] : ['sexual', 'minors'];
  const blocked = enforced.filter((k) => r![k] === true).map((k) => CATEGORIES[k]);
  return { v: POLICY_VERSION, claims, template, unsupported, blocked, passed: blocked.length === 0 && unsupported.length === 0 };
}

/**
 * The claims gate and template that govern a post: from the registered kit it was written to (kits record them
 * since this change), else from the brand's voice answer for kits registered before that.
 */
async function postPolicy(env: Env, post: Post): Promise<{ claims: string; template: string | null; evidence: { claim: string; origin?: string }[] }> {
  if (post.kit_version) {
    const [kit] = await db.select<{ payload: { policy?: { claims?: string; template?: string }; evidence?: { claim: string; origin?: string }[] } }>(env, 'kits', `${db.eq('brand_id', post.brand_id)}&${db.eq('version', String(post.kit_version))}&${db.eq('status', 'registered')}&select=payload`);
    const pol = kit?.payload?.policy;
    // The kit's own evidence snapshot: claims are judged against what the registered kit contained, which cannot
    // change after approval (live rows can be deleted when an answer is edited).
    if (pol && CLAIMS_POLICY[pol.claims ?? ''] && Array.isArray(kit.payload.evidence)) return { claims: pol.claims!, template: pol.template ?? null, evidence: kit.payload.evidence };
  }
  // No fallback to the brand's live evidence or voice answer: a source added after the kit was signed could then
  // approve a post whose attestation names a kit that never contained it. Such a post is drafted again instead.
  throw new HttpError(409, post.kit_version
    ? `this post was written to kit v${post.kit_version}, which was registered before kits recorded their evidence; register a new kit version, then draft the post again`
    : 'this post is not tied to a registered kit; draft it again');
}

/**
 * A passing result in the current shape. Results stored by the earlier, fail-open check ({explicit, passed}) do not
 * count: they have no per-category verdict, so the post is checked again before it can be approved or registered.
 */
export function isCurrentPolicy(p: unknown): boolean {
  const r = p as Partial<PolicyResult> | undefined;
  return !!r && r.v === POLICY_VERSION && r.passed === true && Array.isArray(r.blocked) && r.blocked.length === 0 && Array.isArray(r.unsupported) && r.unsupported.length === 0 && 'template' in r;
}

/** Every non-assumption evidence row for a brand, paged in a fixed order, so no supporting fact is silently left out. */
export async function allEvidence(env: Env, brandId: string) {
  const out: { claim: string }[] = [];
  // No total cap: keep paging until a short page, so a claim supported by any row can be found.
  for (let offset = 0; ; offset += 200) {
    const page = await db.select<{ claim: string }>(env, 'evidence', `${db.eq('brand_id', brandId)}&origin=neq.assumption&select=claim&order=created_at.asc,id.asc&limit=200&offset=${offset}`);
    out.push(...page);
    if (page.length < 200) break;
  }
  return out;
}

export const MAX_EVIDENCE_BATCHES = 8; // about 190k characters of evidence
/** How many classifier batches an evidence set needs; registration refuses a kit that one approval could not check. */
export const evidenceBatchCount = (evidence: { claim: string }[]) => evidenceBatches(evidence.map((e) => `- ${e.claim}`)).length;

/**
 * Pre-approval check: the post's claims gate against the brand's evidence, and the content policy categories.
 * Fails closed: if the check cannot run or answers in the wrong shape, approval waits.
 */
export async function policyCheck(env: Env, post: Post): Promise<PolicyResult> {
  const { claims, template, evidence } = await postPolicy(env, post);
  const flirty = template === 'flirty';
  const facts0 = (evidence ?? []).filter((e) => e.origin !== 'assumption');
  const batches = evidenceBatches(facts0.map((e) => `- ${e.claim}`));
  // Bounded cost: at most MAX_EVIDENCE_BATCHES model calls per approval. Beyond that the check cannot be complete,
  // so it fails closed rather than approving on partial evidence.
  if (batches.length > MAX_EVIDENCE_BATCHES) throw new HttpError(422, `your brand has more evidence than one approval can check (${batches.length} batches, limit ${MAX_EVIDENCE_BATCHES}); remove sources you no longer need on the Your links step, then register a new kit version`);
  const facts = batches[0];
  const system = `You check one social post before a brand approves it. Do not rewrite it.
1. Claims gate, ${CLAIMS_POLICY[claims]}. List each claim in the post that the evidence does not support, quoted briefly. Anything the evidence states, or that is plainly opinion where opinions are allowed, is supported.
2. Content: answer each question true or false.
   sexual: does it contain sexual content (descriptions of sexual acts or nudity, or sexual innuendo beyond light flirtation)?
   minors: does it sexualise, or direct romantic or sexual content at, anyone who is or appears to be under 18?
   explicitLanguage: does it use profanity, slurs or crude sexual words?${flirty ? '\n   This brand uses a flirty voice: light, playful flirtation is fine and is not sexual content.' : ''}
Reply with JSON only, all four keys: {"unsupported": string[], "sexual": boolean, "minors": boolean, "explicitLanguage": boolean}.`;
  const { text } = await chat(env, system, `Evidence:\n${facts}\n\nPost:\n${post.body}`);
  let verdict = policyVerdict(claims, template, parseJson<unknown>(text));
  // All evidence is considered, a bounded batch at a time: later batches only re-check the claims still unsupported.
  for (const batch of batches.slice(1)) {
    if (!verdict.unsupported.length) break;
    const r = await chat(env, `You check whether evidence supports claims. Claims gate, ${CLAIMS_POLICY[claims]}. Reply with JSON only: {"supported": string[]}, each item copied exactly from the claims list.`, `Claims:\n${verdict.unsupported.map((c) => `- ${c}`).join('\n')}\n\nEvidence:\n${batch}`);
    const supported = parseJson<{ supported?: unknown }>(r.text).supported;
    if (!Array.isArray(supported) || !supported.every((x) => typeof x === 'string')) throw new HttpError(502, 'the approval check returned an unusable answer, so nothing was approved; try again');
    const unsupported = verdict.unsupported.filter((c) => !supported.includes(c));
    verdict = { ...verdict, unsupported, passed: verdict.blocked.length === 0 && unsupported.length === 0 };
  }
  return verdict;
}

/** Evidence lines in batches of at most ~24k characters, so each model call stays well inside its context. */
export function evidenceBatches(lines: string[], maxChars = 24000): string[] {
  const out: string[] = [];
  let cur = '';
  // Every line is kept whole (a claim cut short could hide the part that supports a post). Only a line longer than a
  // whole batch, which the answer and source limits do not produce, is split, into consecutive batch-sized pieces.
  const pieces = lines.flatMap((line) => (line.length <= maxChars ? [line] : Array.from({ length: Math.ceil(line.length / maxChars) }, (_, i) => line.slice(i * maxChars, (i + 1) * maxChars))));
  for (const l of pieces) {
    if (cur && cur.length + l.length + 1 > maxChars) { out.push(cur); cur = ''; }
    cur = cur ? `${cur}\n${l}` : l;
  }
  out.push(cur || '(no evidence recorded)');
  return out;
}

// Human approval before anything is registered or published (R8), after the slop, claims and content checks.
export async function approvePost(env: Env, user: User, post: Post) {
  if (post.status === 'registered') return post;
  // Posts approved before the claims and content checks existed have no passing result; they are checked now.
  if (post.status === 'approved' && isCurrentPolicy(post.checks.policy)) return post;
  if (post.status !== 'drafted' && post.status !== 'approved') throw new HttpError(409, 'this post is being registered');
  if (!post.checks.slop?.passed) throw new HttpError(409, 'fix the slop check first: ' + post.checks.slop.hits.join(', '));
  const policy = await policyCheck(env, post);
  if (!policy.passed) {
    // Record why, against this revision, so the screen can show it; then refuse.
    await changePost(env, post, ['drafted', 'approved'], { checks: { ...post.checks, policy } as Checks, status: 'drafted', approved_by: null, approved_at: null });
    throw new HttpError(409, policy.blocked.length
      ? `blocked by the content policy (${policy.blocked.join(', ')}): this cannot be published. Rewrite it, then approve again.`
      : `blocked by the claims gate (${policy.claims === '5' ? 'strict' : policy.claims === '3' ? 'light' : 'standard'}): no evidence for ${policy.unsupported.map((u) => `"${u}"`).join(', ')}. Add a source on your brand, or rewrite, then approve again.`);
  }
  // Approves exactly the revision whose checks were read: an edit in between bumps rev and this fails with 409.
  return changePost(env, post, ['drafted', 'approved'], { status: 'approved', approved_by: user.id, approved_at: new Date().toISOString(), checks: { ...post.checks, policy } as Checks });
}

export function cleanPublishedUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('scheme');
    // Shown publicly by Verify, so never keep a username or password embedded in the link.
    if (u.username || u.password) throw new Error('credentials');
    // Shown publicly by Verify, so the fragment and any credential-like query parameter are dropped (other parameters,
    // which some platforms need to locate a post, are kept).
    u.hash = '';
    for (const k of [...u.searchParams.keys()]) if (/token|key|secret|sig|auth|pass|session|code|cred/i.test(k)) u.searchParams.delete(k);
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
  // Registration requires a passing claims and content check, including for posts approved before those checks existed.
  if (!isCurrentPolicy(post.checks.policy)) throw new HttpError(409, 'this post needs the claims and content checks first: press Run approval checks');
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
    if (checked.some((c) => c.onchain === 'unavailable') || truncated) return { official: false, checked: false, hash, matches: [], note: truncated ? 'more than 10 registrations share this text and none of the first 10 verified, so this cannot be confirmed' : 'Solana could not be checked just now, so this cannot be confirmed; try again in a minute' };
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
    db.select<{ brand_id: string; version: number; hash: string; signature: string; registered_at: string | null }>(env, 'kits', `${db.eq('status', 'registered')}&select=brand_id,version,hash,signature,registered_at&order=registered_at.desc.nullslast&limit=50`),
    db.select<Post>(env, 'posts', `${db.eq('status', 'registered')}&select=brand_id,kit_version,hash,signature,registered_at&order=registered_at.desc&limit=50`),
  ]);
  const ids = [...new Set([...kits, ...posts].map((r) => r.brand_id))];
  const brands = ids.length ? await db.select<{ id: string; name: string }>(env, 'brands', `id=in.(${ids.join(',')})&select=id,name`) : [];
  const name = (id: string) => brands.find((b) => b.id === id)?.name ?? 'unknown';
  return {
    kits: kits.map((k) => ({ type: 'kit', brand: name(k.brand_id), version: k.version, hash: k.hash, at: k.registered_at, explorer: explorerTx(k.signature) })),
    content: posts.map((p) => ({ type: 'content', brand: name(p.brand_id), kitVersion: p.kit_version, hash: p.hash, at: p.registered_at ?? null, explorer: p.signature ? explorerTx(p.signature) : null })),
  };
}
