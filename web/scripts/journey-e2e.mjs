// End-to-end proof of the first-run journey (issue #48, canvas page "Journey (v3)") against a deployed JamJam.
// It walks the same API calls the journey UI makes, J0 to J7, and prints raw evidence: facts with quotes, coverage,
// kit v1 registered on Solana devnet, the first post registered, and Verify answering Official for its exact text.
//
// Run: node scripts/journey-e2e.mjs
// Env:  BASE_URL (default https://jamjam.tech), SITE (default https://adna.network), SUPABASE_URL,
//       SUPABASE_PUBLISHABLE_KEY (public), SUPABASE_SECRET_KEY (Actions secret; used only to create the saved test
//       account, standing in for the emailed code a person types at J2), PROOF_FILE (optional output path).
// Sources: anonymous sign-in POST /auth/v1/signup with no email or phone, and password sign-in
//   POST /auth/v1/token?grant_type=password (supabase.com/docs/guides/auth/auth-anonymous; Auth API);
//   admin create user POST /auth/v1/admin/users with the secret key on the apikey header only
//   (supabase.com/docs/guides/getting-started/migrating-to-new-api-keys: secret keys go on apikey, never Bearer).
import { writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const BASE = (process.env.BASE_URL || 'https://jamjam.tech').replace(/\/$/, '');
const SITE = process.env.SITE || 'https://adna.network';
const SB = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const PK = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const SK = process.env.SUPABASE_SECRET_KEY || '';
const MAX_MS = 5 * 60 * 1000;

const t0 = Date.now();
const log = [];
const out = (line) => { const l = `[+${((Date.now() - t0) / 1000).toFixed(1)}s] ${line}`; log.push(l); console.log(l); };
const fail = (msg) => { out(`FAIL: ${msg}`); finish(1); };
function finish(code) {
  const total = Date.now() - t0;
  out(`total ${(total / 1000).toFixed(1)}s (limit ${MAX_MS / 1000}s): ${total <= MAX_MS ? 'within' : 'OVER'}`);
  if (process.env.PROOF_FILE) writeFileSync(process.env.PROOF_FILE, log.join('\n') + '\n');
  process.exit(code || (total <= MAX_MS ? 0 : 1));
}
if (!SB || !PK || !SK) fail('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY are required');

async function req(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}
const auth = (path, body, headers = {}) => req(`${SB}/auth/v1/${path}`, { method: 'POST', headers: { apikey: PK, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const api = (token, method, path, body) => req(`${BASE}/api${path}`, {
  method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
});
async function must(label, p, want = [200, 201]) {
  const r = await p;
  // Label and status only: an error body can quote post or page text, and this output is posted to a public issue.
  if (!want.includes(r.status)) fail(`${label}: HTTP ${r.status}`);
  return r.body;
}

// The site is operator input: only its hostname is logged (no path, query or token), since the proof is public.
out(`base ${BASE}, site host ${new URL(SITE).hostname}`);
const health = await must('health', req(`${BASE}/api/health`));
out(`health ${JSON.stringify(health)}`);

// J0 and J1: no sign-in. An anonymous session, a brand, and the site read with quotes.
const anon = await must('anonymous sign-in (is it enabled? run the supabase-auth-config workflow)', auth('signup', { data: {} }));
const anonToken = anon.access_token;
if (!anon.user?.is_anonymous) fail('the session is not anonymous');
out(`J0 anonymous session ${anon.user.id}`);
const host = new URL(SITE).hostname.replace(/^www\./, '');
const { brand } = await must('create brand', api(anonToken, 'POST', '/brands', { name: host.split('.')[0], website: SITE }));
out(`J0 brand ${brand.id} (${brand.name})`);
let read = await must('read site', api(anonToken, 'POST', `/brands/${brand.id}/sources`, { url: SITE }), [200, 201, 409]);
// With the workflow engine, a read that is still running answers 409 {runId}: poll the run (spec/api/README.md, J1).
if (read.runId && read.facts === undefined) {
  out(`J1 still reading (run ${read.runId}); polling`);
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const r = await must('run status', api(anonToken, 'GET', `/runs/${read.runId}`));
    if (r.run?.status === 'done') { read = r.run.output; break; }
    if (r.run?.status === 'failed') fail('the read failed (run status failed; details in the Worker logs, not here, because this output is public)');
  }
  if (read.facts === undefined) fail('the read did not finish within 3 minutes');
}
out(`J1 read: ${read.facts} facts kept, ${read.dropped} dropped (quote not on page), kind ${read.kind}${read.pages ? `, ${read.pages} pages` : ''}`);
let state = await must('brand state', api(anonToken, 'GET', `/brands/${brand.id}`));
const sourceFacts = state.evidence.filter((e) => e.origin === 'source');
if (!sourceFacts.length) fail('no facts were read from the site');
const noQuote = sourceFacts.filter((e) => !e.quote);
out(`J1 facts with a quote: ${sourceFacts.length - noQuote.length}/${sourceFacts.length}`);
if (noQuote.length) fail(`${noQuote.length} facts have no quote`);
// Counts only: the proof is posted to a public issue (and Actions logs are public), so no page text, claim or quote is
// printed (AGENTS.md rule 5). The facts themselves are in the brand's state for anyone signed in as its owner.
const bySection = sourceFacts.reduce((m, e) => ({ ...m, [e.section]: (m[e.section] ?? 0) + 1 }), {});
out(`J1 facts by section: ${Object.entries(bySection).map(([k, v]) => `${k}=${v}`).join(', ')}`);
out(`J1 coverage ${state.coverage.covered}/${state.coverage.total}: ${state.coverage.sections.map((s) => `${s.section}=${s.status}`).join(', ')}`);

// J2: save. A saved account (created here in place of the emailed code), then the anonymous brand is claimed.
const email = `e2e+${Date.now()}-${randomBytes(3).toString('hex')}@jamjam.tech`;
const password = randomBytes(18).toString('base64url');
await must('create saved test account', req(`${SB}/auth/v1/admin/users`, { method: 'POST', headers: { apikey: SK, 'content-type': 'application/json' }, body: JSON.stringify({ email, password, email_confirm: true }) }));
const perm = await must('password sign-in', auth('token?grant_type=password', { email, password }));
const token = perm.access_token;
const claim = await must('claim', api(token, 'POST', '/me/claim', { anonymousToken: anonToken }));
if (!claim.moved?.includes(brand.id)) fail('the brand did not move to the saved account');
out(`J2 saved: brand claimed by the saved account`);
const refused = await api(anonToken, 'GET', `/brands/${brand.id}`);
out(`J2 refusal check: the anonymous session now gets HTTP ${refused.status} for the brand`);
if (refused.status !== 404) fail('the anonymous session can still read the claimed brand');

// J3: confirm. Every fact waiting for review is accepted (the person's Accept on each card).
for (const e of state.evidence.filter((x) => x.review_status === 'proposed')) await must('approve fact', api(token, 'PATCH', `/brands/${brand.id}/evidence/${e.id}`, { review_status: 'approved' }));
state = await must('brand state', api(token, 'GET', `/brands/${brand.id}`));
out(`J3 confirmed; coverage ${state.coverage.covered}/${state.coverage.total} (ratio ${state.coverage.ratio.toFixed(2)})`);

// J4: voice by example, two rounds, then the pick saved as the Voice answer.
const r1 = await must('voice round 1', api(token, 'POST', `/brands/${brand.id}/voice/samples`, { round: 1 }));
out(`J4 round 1: ${r1.samples.map((s) => s.template).join(', ')}`);
const r2 = await must('voice round 2', api(token, 'POST', `/brands/${brand.id}/voice/samples`, { round: 2, near: r1.samples[0].template }));
out(`J4 round 2 near ${r1.samples[0].template}: ${r2.samples.map((s) => s.template).join(', ')}`);
await must('save voice', api(token, 'PUT', `/brands/${brand.id}/answers/voice`, { data: r2.samples[0].answer, skipped: false }));
out(`J4 voice saved: ${r2.samples[0].template}`);

// J5: draft, approve (the three gates record who and when) and register kit v1 on Solana devnet.
for (const s of ['origin', 'purpose', 'positioning', 'audience', 'voice', 'messaging']) {
  await must(`draft ${s}`, api(token, 'POST', `/brands/${brand.id}/sections/${s}/draft`));
  await must(`approve ${s}`, api(token, 'POST', `/brands/${brand.id}/sections/${s}/approve`, { note: 'e2e approval' }));
}
out('J5 six sections drafted and approved; gates purpose, positioning and voice recorded');
const kit = await must('register kit', api(token, 'POST', `/brands/${brand.id}/kit/register`));
out(`J5 kit v${kit.kit.version} registered: ${kit.explorer}`);
out(`J5 attestation: ${kit.attestationExplorer}`);

// J6: the first post, with no brief, approved and registered.
const { post } = await must('draft first post', api(token, 'POST', `/brands/${brand.id}/posts`, {}));
out(`J6 first post drafted (kit v${post.kit_version}, ${post.body.length} characters)`);
const cm = await must('claims on the draft', api(token, 'POST', `/brands/${brand.id}/posts/${post.id}/claims`, { rev: post.rev }));
// Counts only, no claim text (the proof is public): how many claims, and how many rest on a fact with its quote.
const withQuote = cm.claimMap.items.filter((c) => c.facts.some((f) => f.quote)).length;
out(`J6 claims: ${cm.claimMap.items.length} listed, ${cm.claimMap.items.filter((c) => c.status === 'supported').length} supported (${withQuote} with a quote), ${cm.claimMap.unsupported} unsupported`);
const approved = await must('approve post', api(token, 'POST', `/brands/${brand.id}/posts/${post.id}/approve`, { rev: post.rev }));
const reg = await must('register post', api(token, 'POST', `/brands/${brand.id}/posts/${post.id}/register`, { rev: approved.post.rev }));
out(`J6 post registered: ${reg.explorer ?? JSON.stringify(reg).slice(0, 200)}`);

// J7: anyone checks the exact text on Verify, with no sign-in.
const v = await must('verify', req(`${BASE}/api/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: approved.post.body }) }));
out(`J7 verify exact text: official=${v.official} brand=${v.brand} kitVersion=${v.kitVersion} explorer=${v.explorer}`);
if (!v.official) fail('Verify did not answer Official for the registered text');
const edited = await must('verify edited', req(`${BASE}/api/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: approved.post.body + ' (edited)' }) }));
out(`J7 refusal check, edited text: official=${edited.official}`);
if (edited.official) fail('an edited copy was reported Official');
out('PASS');
finish(0);
