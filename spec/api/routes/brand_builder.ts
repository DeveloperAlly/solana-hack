/**
 * Waterlily: Brand Builder API (BOILERPLATE, proposed 2026-10-06). Not runnable.
 * Screens: Main, Onboard-1/2/2b/3/3b, Ingest-Error, BB-1…BB-6, Gates 1–3, Coverage-Map,
 * Brand-Build, Onboard-6, Kit-RegisterFailed, Kit-Export, Claims (screen missing, see UI review #5).
 * Pipeline: architecture §2 and §12.2. External clients: lib/clients.ts. Tables: schema.sql.
 *
 * Every endpoint block lists: METHOD PATH · Screens · Auth · In → Out · Reads/Writes · External · Jobs · Errors.
 */
import { requireUser, requireRole, adminClient, llm, searchWeb, lookupTxt, registerMemo, memoString, sha256Hex, enqueue, startWorkflow } from "../lib/clients";

// ----------------------------------------------------------------------------- auth
/**
 * POST /api/auth/otp  (client-side SDK call, no Worker route needed)
 * Screens: Onboard-1-SignIn (Send code), Amb-2/M-2 (join).
 * Auth: none.
 * In: {email} → Out: {sent:true}.
 * External: Supabase Auth `supabase.auth.signInWithOtp({ email })` from the browser with the publishable key.
 *   ⚠ Verified: the email contains a 6-digit code only if the template uses {{ .Token }}.
 *   ⚠ The built-in email service allows 2 emails/hour, so custom SMTP is REQUIRED before the demo
 *     (provider not chosen: GAP G-AUTH-2).
 * Errors: 429 (60 s between requests per user). Verify is limited to 30 per 5 min per IP.
 */
/**
 * POST /api/auth/verify  (client-side)
 * In: {email, token} → `supabase.auth.verifyOtp({ email, token, type: "email" })` → session.
 * Then POST /api/profile to upsert profiles(id,email).
 * ⚠ The UI says "Your account and wallet are set up automatically". Phantom Connect embedded wallets are
 *   NOT accepting new apps, so sign-in creates NO wallet. See GAP G-WALLET (backend_map.md §7). Copy must change.
 */
export async function upsertProfile(req: Request, env: any) {}

// ----------------------------------------------------------------------------- brand + domain
/**
 * POST /api/brands
 * Screens: Main (brand name/site carried over), BB-1-Basics.
 * Auth: signed in. The caller becomes the owner (memberships row).
 * In: {name, type, oneLiner, links[], goal12m, primaryChannel} → Out: {brandId}.
 * Writes: brands; memberships(owner); evidence rows (status 'answered', source "owner answer, date") for
 *   oneLiner / goal / channel (§12.2: every answer is stored as evidence); sources(kind by URL) for each link (status 'queued').
 * Jobs: none yet. Ingest starts when the user taps "Read my sources".
 * Errors: 400 invalid URL (validate on blur, BB-1 note).
 */
export async function createBrand(req: Request, env: any) {}

/**
 * POST /api/brands/:id/domain/token  → {txtName:"_waterlily.<domain>", txtValue}
 * Screens: Onboard-2-Domain (Copy value).
 * Writes: brands.domain, brands.domain_txt_token (a random value).
 */
export async function issueDomainToken(req: Request, env: any) {}

/**
 * POST /api/brands/:id/domain/check
 * Screens: Onboard-2 (Check now), Onboard-2b (Check again; auto re-check every 60 s while open).
 * Out: {verified:boolean, found:string[]}.
 * External: lookupTxt() via DNS-over-HTTPS (TO VERIFY endpoint).
 * Writes: brands.domain_verified. On success: registerMemo(identity) → registrations(type 'identity').
 *   The memo holds the brand id and domain hash, plus the owner wallet ONLY if one is linked (G-WALLET).
 * Errors: not found → Onboard-2b (likely causes listed). DNS provider timeout → retry.
 * Rule fix (UI review #3): unverified brands CAN register kits and posts; registrations carry
 *   domain_verified_at_time=false and Verify shows "unverified domain". Only payouts require verification.
 */
export async function checkDomain(req: Request, env: any) {}

// ----------------------------------------------------------------------------- sources + ingest
/**
 * POST /api/brands/:id/sources          In: {url} | {upload:true, filename, contentType}
 * Screens: Onboard-3-Sources (Add link, Browse files).
 * For uploads: returns a Supabase Storage signed upload URL. Verified: createSignedUploadUrl(path), valid 2 h;
 *   the browser then calls uploadToSignedUrl(path, token, file). Free tier: 1 GB storage, 50 MB max per file.
 * Writes: sources (owner_supplied=true for uploads).
 * DELETE /api/brands/:id/sources/:sourceId → Remove.
 */
export async function addSource(req: Request, env: any) {}

/**
 * POST /api/brands/:id/ingest
 * Screens: Onboard-3 (Read my sources) → Onboard-3b (progress), Ingest-Error (Retry / Skip / upload instead).
 * Out: {jobId}. The UI subscribes to Supabase Realtime on jobs and sources (postgres_changes) for live progress.
 * Jobs: startWorkflow("ingest", {brandId}). Steps (pipeline/worker.ts):
 *   1. per URL source: fetchPages() (Exa /contents) → text. Failures go to sources.status='failed' with the error.
 *   2. per upload: read from Storage, then extract text. ⚠ GAP G-INGEST-1: PDF/DOCX text extraction inside a
 *      10 ms CPU Worker step is unverified. Options: Workers Paid (30 s CPU per step), or an extraction API (TBD).
 *   3. Extractor (LLM, prompt extractor@v): chunk → JSON [{section, fact, quote, confidence}] → evidence rows.
 *   4. Gap analyst (deterministic rules, §12.3.1, proposed): compute E / I / M per section.
 *   5. Mark the job done. An email when done is optional (needs the SMTP provider, G-AUTH-2).
 * Retry endpoint: POST /api/sources/:id/retry. Skip: PATCH status='skipped'.
 */
export async function startIngest(req: Request, env: any) {}

// ----------------------------------------------------------------------------- coverage + interview
/**
 * GET /api/brands/:id/coverage
 * Screens: Coverage-Map (⚠ must move to after ingest and before the interview, UI review #1), Brand-Build badges.
 * Out: [{section, state:'E'|'I'|'M'|'stale', evidenceCount, topEvidence[], nextQuestionKey?}], questionsLeft.
 * Reads: evidence, kit_sections. Pure SQL plus rules (no LLM).
 */
export async function getCoverage(req: Request, env: any) {}

/**
 * GET /api/brands/:id/interview/next
 * Screens: BB-2 … BB-6.
 * Out: {questionKey, prompt, exercise:'text'|'voice'|'card_sort'|'pick_example'|'sliders',
 *       prefill?:{fact, source} (for "That's right / Not quite"), skippable:true}
 * Logic (Interviewer): the next missing REQUIRED section in dependency order (§12.3.2, proposed):
 *   Identity → Origin → Purpose(G1) → Alternatives → Positioning(G2) → Audience → Voice(G3).
 *   If evidence already covers it: return prefill and mode 'confirm'.
 * The question text comes from the §4 input spec (static), so no LLM is needed. An LLM only rephrases (optional).
 */
export async function nextQuestion(req: Request, env: any) {}

/**
 * POST /api/brands/:id/interview/answer
 * In: {questionKey, answer:string | {audioPath}, confirm?:boolean}
 * Writes: evidence(status 'answered' | 'evidenced' when confirmed | 'rejected' when "Not quite").
 * ⚠ GAP G-VOICE-INPUT: BB-2 "Record voice" needs speech-to-text. No provider chosen or verified.
 *   Hackathon fallback: text only, and hide the record button.
 */
export async function answerQuestion(req: Request, env: any) {}

// ----------------------------------------------------------------------------- drafting + gates
/**
 * POST /api/brands/:id/draft-section    In: {section:'purpose'|'positioning'|'audience'|'voice'|...,
 *                                            variant?:'another'|'shorter'}
 * Screens: BB-3 "Draft my purpose", Gate 1 (Try another / Make it shorter), BB-4 (3 positioning options),
 *   BB-5 (proto personas), BB-6 (3 sample paragraphs × 2 rounds), Brand-Build Edit / Regenerate.
 * Out: {draftId, content, citations:[evidenceId], assumptions:[...]} (streamed or polled; the UI shows a skeleton).
 * Logic (Drafter + Critic, §12.3.3):
 *   inputs = evidence(section) + approved upstream sections + the §4 rules for that section.
 *   llm(prompt "drafter.<section>@v", jsonSchema {content, citations[], assumptions[]})
 *   → critic llm(prompt "critic.slop_citation@v"): no-AI-slop pass + check every sentence is cited.
 *   Anything uncited is labelled "assumption".
 * Positioning extra: searchWeb({query: "<category> alternatives to <brand>", category:"company"}) to
 *   research competitors; the results become evidence (source = URL). Every option shows its sources (BB-4).
 * BB-5 privacy: audiences.real_people are NEVER included in prompts by name (schema g13).
 * Errors: 402/429 from OpenRouter → "AI is busy, try again". Draft-failed state is missing in the UI (review f).
 */
export async function draftSection(req: Request, env: any) {}

/**
 * POST /api/brands/:id/gates/:gate/approve     gate ∈ purpose | positioning | voice
 * Screens: Gate 1 / 2 / 3 (Approve), "Save, decide later" = no call.
 * Auth: owner or approver.
 * Writes: decisions(gate, choice); kit_sections(state 'E', approved_by/at) in the working kit version.
 *   If the gate was already approved and has changed, downstream sections are set to state='stale'
 *   (§12.3.2, proposed) and the UI shows "redraft n sections" (UI review #16).
 * Gate 3 also writes voices(core voice: template + overrides + claims rule) and compiles writer_rules (see create.ts).
 */
export async function approveGate(req: Request, env: any) {}

/**
 * PATCH /api/brands/:id/sections/:section     In: {content} | {confirm:true}
 * Screens: Brand-Build (Edit / Confirm per section), Quick review (screen missing, UI review #15).
 * Writes: kit_sections(content, state). An owner edit is stored as evidence 'answered'.
 */
export async function editSection(req: Request, env: any) {}

// ----------------------------------------------------------------------------- kit compile + register
/**
 * POST /api/brands/:id/kit/approve
 * Screens: Coverage-Map / Brand-Build "Approve kit v1 / v[n+1]" → Onboard-6, or Kit-RegisterFailed.
 * Auth: owner or approver. Requires the 3 gates approved (§1 principle 4).
 * Logic (Kit compiler + Registrar, §12.3.4, proposed):
 *   1. canonical JSON of approved sections (keys sorted) → sha256Hex → kit_versions.hash, version++.
 *   2. registerMemo(memoString('kit', brandId, hash, version)) signed by the REGISTRAR (the brand never signs).
 *   3. registrations(type 'kit', hash, kit_version, approver_id, tx_signature, status).
 * Out: {version, hash, txSignature, explorerUrl:"https://explorer.solana.com/tx/<sig>?cluster=devnet"}.
 * Errors: RPC failure → registrations.status='failed' → Kit-RegisterFailed (Retry: POST /api/registrations/:id/retry).
 *   The kit stays approved offchain either way.
 */
export async function approveKit(req: Request, env: any) {}

/**
 * GET /api/brands/:id/kit/:version/export?include=sections,decisions,sources,voices
 * Screens: Kit-Export (Download .zip), Onboard-6 (Download the kit).
 * Out: application/zip holding an aDNA folder (§8): what/brand/*.md, what/decisions/*.md, what/context/sources.md, how/templates/*.md.
 * ⚠ GAP G-ZIP: zipping inside a 10 ms CPU request is unverified for larger kits. Options: build the zip in the
 *   browser from JSON (GET /api/brands/:id/kit/:version → JSON), or store it in R2/Storage from a Workflow step.
 *   Recommended: build it in the browser.
 */
export async function exportKit(req: Request, env: any) {}

// ----------------------------------------------------------------------------- claims (screen missing)
/**
 * GET/POST/PATCH /api/brands/:id/claims
 * Screens: Claims (MISSING, two broken links: UI review #5); Brand-Build section 12.
 * In (POST): {text, evidenceIds[], expiresAt}. PATCH approve → status 'approved' and registerMemo(claim hash + evidence hashes).
 * Suggest-from-sources: GET /api/brands/:id/claims/suggest → numbers and superlatives found in evidence (Extractor output).
 * The approved claims form the allow-list used by the writer and critic (§12.3.5).
 */
export async function claims(req: Request, env: any) {}

// ----------------------------------------------------------------------------- brand view
/**
 * GET /api/brands/:id/kit/current
 * Screens: Brand-Build, Hub-Home ("Kit v1 · 8 of 17 sections evidenced").
 * Out: sections with state, content, citations, version, hash, txSignature. Reads kit_versions, kit_sections, evidence, registrations.
 */
export async function currentKit(req: Request, env: any) {}
