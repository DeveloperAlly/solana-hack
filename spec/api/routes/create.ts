/**
 * Waterlily: Create API (BOILERPLATE, proposed 2026-10-06). Not runnable.
 * Screens: Voice-Templates, Voice-Editor, Content-Dashboard (+Empty), Draft-Review,
 * Create-NewDraft and Publish (both MISSING, UI review #4), Campaign-v2-1 / v2-2 (steps 4–6 missing, #19), Hub-Home.
 * Format per block: METHOD PATH · Screens · Auth · In → Out · Reads/Writes · External · Jobs · Errors.
 */
import { requireUser, requireRole, adminClient, llm, sha256Hex, registerMemo, memoString, publishToX, publishToLinkedIn, startWorkflow } from "../lib/clients";

// ----------------------------------------------------------------------------- voices
/**
 * GET /api/templates
 * Screens: Voice-Templates, BB-6 ("Skip, use template"), Gate 3.
 * Out: the 12 templates on 9 dimensions (research 06; owner decision 2026-10-06), claims strictness as a gate,
 *   Flirty flagged content_policy_gate=true. Reads the templates table (seeded and versioned, P3).
 * ⚠ The UI still shows 7 templates on 10 dials (UI review #11). The API follows research 06.
 */
export async function listTemplates(req: Request, env: any) {}

/**
 * POST /api/brands/:id/voices        In: {name, templateId, overrides:{[channel]:{dim:value}}, claimsRule}
 * PATCH /api/voices/:id               (Voice-Editor: dials, Reset to template)
 * Screens: Voice-Templates (card) → Voice-Editor (Save voice).
 * Writes: voices. Then the Voice compiler (deterministic): dims → plain-language writer_rules
 *   (the "Rules the writer gets" panel). A rules table maps each 1–5 value to sentences. No LLM needed.
 * Flirty: blocked unless the brand has accepted the content policy. Output always passes a safety classifier
 *   (provider TBD: GAP G-SAFETY).
 */
export async function upsertVoice(req: Request, env: any) {}

/**
 * POST /api/voices/:id/preview      In: {exampleKey}
 * Screens: Voice-Editor ("Preview: same reply, this voice", "Try another example"), BB-6 sample paragraphs.
 * External: llm(prompt "voice.preview@v", messages = writer_rules + the example). Debounce dial changes on the client.
 */
export async function previewVoice(req: Request, env: any) {}

// ----------------------------------------------------------------------------- drafts
/**
 * GET /api/brands/:id/drafts?status=in_review|scheduled|published|rejected&channel=
 * Screens: Content-Dashboard (tabs, channel filter), Content-Dashboard-Empty (no rows), Hub-Home (KPIs, "Needs you next").
 * Reads: drafts (+ scores). The calendar rail is the same query, sorted by scheduled_for.
 */
export async function listDrafts(req: Request, env: any) {}

/**
 * POST /api/brands/:id/drafts        In: {channel, voiceId, brief, campaignId?}
 * Screens: Create-NewDraft (MISSING; "+ New draft" has no target), Onboard-6 "Write your first post".
 * Out: {draftId}. Jobs: startWorkflow("draft", {draftId}) → pipeline/worker.ts DraftWorkflow:
 *   1. Writer: llm("writer.<channel>@v") with inputs (§12.3.5, proposed): approved positioning, messaging, vocabulary,
 *      voice writer_rules, the claims ALLOW-LIST, platform rules (research 03), and the brief.
 *   2. Critic: llm("critic.slop@v") → slop_fixes[{before, after, reason}]; original_body saved for "Show original".
 *   3. Checks (deterministic): vocabulary avoid-list hits, claims check (any number or superlative not on the
 *      allow-list → block, UI review #13), and platform rules (length, links: an X post WITH A URL costs $0.20).
 *   4. Scores: voice_fit (LLM judge "score.voice_fit@v", 0–100) and platform score (rule-based from research 03).
 *      ⚠ The calibration method is open (§11).
 *   5. status='in_review'. The human sees it only after step 2 (principle 2).
 */
export async function createDraft(req: Request, env: any) {}

/**
 * GET /api/drafts/:id       Screens: Draft-Review. Out: body, original_body, slop_fixes, scores, checks, polish_history.
 * PATCH /api/drafts/:id     In: {body}. Inline edits re-run the checks synchronously (cheap rules only).
 */
export async function getDraft(req: Request, env: any) {}

/**
 * POST /api/drafts/:id/polish     In: {action:'review'|'shorten'|'clarify'|'beautify', accessible?:boolean, targetLength?}
 * Screens: Draft-Review polish actions (MISSING in the UI: first audit and UI review #4).
 * External: llm("polish.<action>@v"). Beautify: per-platform formatting. With accessible=true, no Unicode bold.
 *   Without it, Unicode emphasis is limited to ≤3 key phrases on LinkedIn (§6).
 * Writes: polish_history.push({action, before, after}) so every action is reversible
 *   (POST /api/drafts/:id/polish/undo). Re-runs the critic and checks on the result.
 */
export async function polishDraft(req: Request, env: any) {}

/**
 * POST /api/drafts/:id/approve     In: {when:'now'|'best_slot'|ISO datetime}
 * Screens: Draft-Review ("Approve and schedule"), Hub-Home queue.
 * Auth: owner or approver (principle 1: nothing posts without a person).
 * Logic: blocked if checks show unsupported claims. Sets status 'approved' → 'scheduled', approved_by/at.
 *   content_hash = sha256Hex(normalise(body)), where normalise = trim, collapse whitespace, NFC.
 * "best slot": ⚠ needs analytics (roadmap). Hackathon: a static per-platform default from research 03, labelled as such (UI review g11).
 * Jobs: a scheduler cron (pipeline/worker.ts scheduled()) publishes due drafts.
 */
export async function approveDraft(req: Request, env: any) {}

/**
 * POST /api/drafts/:id/publish      In: {route:'x'|'linkedin'|'manual', url?}
 * Screens: Publish (MISSING for brand posts; UI review #4), Amb-4 (ambassador variant in grow.ts), cron-triggered.
 * Routes:
 *  - 'x': connections(platform 'x') → refresh the token if expired (2 h tokens) → publishToX(POST https://api.x.com/2/tweets {text}).
 *    → published_url = https://x.com/<handle>/status/<id>.
 *  - 'linkedin': publishToLinkedIn via /v2/ugcPosts (verified self-serve path). The token lasts 60 days, then the
 *    user reconnects (no refresh token).
 *  - 'manual': copy to clipboard in the UI, then the user pastes the post URL (the fallback for any platform).
 * Then: registerMemo(memoString('content', brandId, content_hash, kitVersion)) via the REGISTRAR → registrations(type
 *   'content', kit_version, approver_id, author_id, platform_url). Out: {publishedUrl, txSignature} for the "Registered" success screen (missing).
 * Errors: 401 token expired → "Reconnect X/LinkedIn" (Draft-Review error state missing). 402/429 from X (pay-per-use credits).
 */
export async function publishDraft(req: Request, env: any) {}

// ----------------------------------------------------------------------------- campaigns
/**
 * POST /api/brands/:id/campaigns           (Campaign-v2-1: purpose, name, dates, platforms, who posts)
 * PATCH /api/campaigns/:id                 (Campaign-v2-2: success metrics; steps 4–6 MISSING: plan, people & budget, review)
 * POST /api/campaigns/:id/plan             → llm("planner.content_plan@v") → draft stubs (status 'draft') per item.
 * POST /api/campaigns/:id/launch           → status 'live'. Ambassador formats go live in grow.ts.
 * Rules: success metrics must name a data source. If a platform doesn't share a number, show "not available"
 *   (Campaign-v2-2 note). ⚠ X can be a platform for brand posts but NEVER a paid ambassador format
 *   (compendium §5; UI review #6). The API rejects formats[].channel='x' when payout>0.
 * Budget: budget_cap_usdc is enforced offchain. The "Cap above balance" error needs the brand wallet balance:
 *   GET /api/wallets/:address/usdc (grow.ts), which depends on G-WALLET.
 */
export async function campaigns(req: Request, env: any) {}
