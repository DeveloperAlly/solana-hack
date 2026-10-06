/**
 * Waterlily: Grow API (BOILERPLATE, proposed 2026-10-06). Not runnable.
 * Screens: Amb-1…5d, M-1…M-5 (ambassador), Dashboard / Dashboard-Empty (brand view of ambassadors),
 * Engage-Queue (reply queue, hackathon per the backlog), Leads (experimental), Influencer-Setup / Queue (experimental).
 * Roadmap one-liners at the end. Format: METHOD PATH · Screens · Auth · In → Out · Reads/Writes · External · Jobs · Errors.
 */
import { requireUser, adminClient, llm, fetchPages, sha256Hex, registerMemo, memoString, searchWeb } from "../lib/clients";

// ----------------------------------------------------------------------------- ambassador side
/**
 * GET /api/campaigns/open?channel=&sort=time_left
 * Screens: Amb-1, M-1, Amb-1b (empty). Public (no auth needed to browse).
 * Out: live campaigns with paid formats (never X), budget left = cap − sum(payouts confirmed + approved pending),
 *   slots left, and a 'budget_reached' flag.
 * ⚠ Ally Haire must be removed from these lists (UI review / first audit).
 * POST /api/campaigns/:id/notify → store a notify-me request (email needs SMTP, G-AUTH-2).
 */
export async function openCampaigns(req: Request, env: any) {}

/**
 * POST /api/campaigns/:id/join
 * Screens: Amb-2 ("Sign in with email to join"), M-2.
 * Auth: signed in (Supabase OTP). Writes memberships(role 'ambassador').
 * Payout needs a wallet: POST /api/wallets/link (public_settings_inbox.ts walletLink); injected wallet,
 *   signMessage challenge (ADR-006).
 */
export async function joinCampaign(req: Request, env: any) {}

/**
 * POST /api/campaigns/:id/drafts   In: {format, angle}
 * Screens: Amb-3 (Generate, Regenerate), M-3.
 * Same DraftWorkflow as create.ts createDraft, with author = ambassador and voice = the campaign voice.
 * Live meter: GET /api/drafts/:id/checks after each edit (rules: banned claims, avoid-list, disclosure present).
 *   The "on-brand %" uses the voice_fit judge, throttled. Publish is unlocked at ≥80% with 0 banned claims and the disclosure present.
 */
export async function ambassadorDraft(req: Request, env: any) {}

/**
 * POST /api/submissions        In: {draftId, route:'linkedin'|'url', url?}
 * Screens: Amb-4 (Post now via LinkedIn; Submit blog or tutorial URL), M-4.
 * ⚠ Remove "Connect X and post" and "Post to X" from paid flows (UI review #6, X developer policy:
 *   "shouldn't compensate people to take actions on X").
 * LinkedIn route: the ambassador's own connection → publishToLinkedIn → URL. Manual route: the pasted URL.
 * Jobs: enqueue("verify_submission", {submissionId}) → Amb-5a (progress via Realtime).
 */
export async function submit(req: Request, env: any) {}

/**
 * Job verify_submission (pipeline/worker.ts):
 *  1. fetchPages([url]) (Exa /contents) → page text. Failure → verify_status 'failed', detail 'unreadable'.
 *  2. Match: sha256(normalised extracted text) vs drafts.content_hash; if no exact match, a similarity score
 *     against the approved body (⚠ algorithm TBD: GAP G-MATCH; the threshold between "edited" and "no match" is open, Verify-3 note).
 *  3. Author check: the page author or handle matches the ambassador's linked account (where the platform exposes it).
 *  4. Disclosure check: "#ad" or the sponsor line is present.
 *  5. verified → submissions.verify_status 'verified' → shows in the brand's Dashboard "pending approval".
 *     Budget exhausted → 'budget_reached' (Amb-5d).
 */

// ----------------------------------------------------------------------------- brand side: approve + pay
/**
 * GET /api/brands/:id/ambassadors      Screens: Dashboard, Dashboard-Empty, Hub-Home KPI.
 * Out: pending verified submissions, live campaigns, the budget bar (spent / committed / remaining), recent payouts.
 * ⚠ Licensing wording ("licensed pieces", "license income") is removed: the API returns no such data.
 */
export async function brandAmbassadors(req: Request, env: any) {}

/**
 * POST /api/submissions/:id/approve
 * Screens: Dashboard ("Approve", and "Approve and pay" for owners). Auth: owner or approver (principle 1: no
 * auto-approve, UI review #12). Sets submissions.approved_by/at only. An approver's approval waits for an owner to pay.
 * POST /api/submissions/:id/reject {reason} → shown to the ambassador.
 *
 * POST /api/submissions/:id/pay     Auth: owner only, and brands.payout_wallet must be a verified wallets row of the
 *   caller (the caller has to sign with it). If it belongs to another owner: 409 {code: 'payout_wallet_not_yours'};
 *   the Dashboard says which owner can pay, or lets the caller set their own verified wallet as the payout wallet.
 * Refused unless the submission is approved and verified. "Approve and pay" = approve then pay in one owner action.
 * Idempotent: at most one live payout per submission (unique partial index on payouts(submission_id) where status in
 *   ('pending','sent','confirmed'), schema.sql). A retry or double click returns the existing pending payout and its
 *   unsigned transaction instead of building a second one; a confirmed payout is refused with 409 already_paid.
 *   Only after a payout is 'failed' (step 3) can a new one be created.
 * Hackathon payment flow (G-WALLET decision):
 *   0. If brands.payout_wallet is null, refuse with 409 {code: 'payout_wallet_missing'}; the Dashboard then prompts
 *      the owner to link a wallet and set it (walletLink, then brandPayoutWallet in public_settings_inbox.ts).
 *      If the ambassador's profiles.payout_wallet is null, refuse with 409 {code: 'recipient_wallet_missing'} and
 *      notify the ambassador to link one (Amb-5b).
 *   1. The server inserts payouts (from_address = brands.payout_wallet, to_address = the ambassador's
 *      profiles.payout_wallet at this moment) and builds an UNSIGNED v0 transaction to exactly that to_address:
 *      getCreateAssociatedTokenIdempotentInstruction (recipient ATA) +
 *      getTransferCheckedInstruction({source, mint: USDC devnet 4zMMC9…DncDU, destination, authority: brand wallet,
 *      amount, decimals: 6 (TO VERIFY)}) + getAddMemoInstruction("wl1|payout|<payoutId>") (the payout row, not the submission,
 *      so a replacement payout can never be confirmed by an earlier transaction). The server also stores the
 *      blockhash's lastValidBlockHeight on the payout.
 *      Fee payer = the brand wallet = brands.payout_wallet (ADR-006).
 *   2. The browser has the brand's payout wallet sign and send it (injected provider, ADR-006).
 *   3. POST /api/payouts/:id/confirm {signature} → refused if the signature is already on another payout
 *      (payouts.tx_signature is unique). The server fetches the transaction on RPC (getTransaction) and requires all of:
 *      it succeeded; signer and fee payer = payouts.from_address; exactly one transferChecked under the SPL Token
 *      program with mint = devnet USDC, source = the ATA of from_address, destination = the ATA of to_address,
 *      amount = payouts.amount_usdc in base units; and the memo is exactly "wl1|payout|<payoutId>" for this
 *      payout. Any mismatch → 'failed'. All pass → payouts.tx_signature set, status 'confirmed' →
 *      registrations(type 'content') for the ambassador post, with campaign_id.
 * Cap check: the server refuses to build if amount > remaining cap (offchain enforcement; escrow is roadmap).
 * Errors: transaction failed on chain → payouts 'failed'. Not found on RPC → stays 'sent' and is re-checked; it becomes
 *   'failed' only once the current block height passes the stored lastValidBlockHeight (the transaction can no longer
 *   land), so a delayed transaction is never replaced while it could still be confirmed. (Dashboard error state missing.)
 */
export async function approveAndPay(req: Request, env: any) {}

/**
 * GET /api/me/earnings           Screens: Amb-5b, M-5, header balance ("15 USDC").
 * Out: payouts to me, plus the on-chain USDC balance of my linked wallet (getTokenAccountsByOwner or ATA balance, RPC).
 * "Withdraw": ⚠ with a self-custody wallet there is nothing to withdraw (the funds are already in the user's wallet).
 *   The button only exists if an embedded or custodial provider is chosen (G-WALLET). Remove it otherwise.
 */
export async function earnings(req: Request, env: any) {}

// ----------------------------------------------------------------------------- engagement (reply queue: hackathon)
/**
 * GET /api/brands/:id/replies     Screens: Engage-Queue. Out: mentions and comments with drafted replies.
 * Source of mentions: ⚠ X mentions need X API reads (pay-per-use $0.005 per post read; owned-read pricing for own
 *   mentions TO VERIFY). LinkedIn comments are NOT available (r_member_social is closed).
 *   Hackathon: X mentions only, polled by cron (pipeline/worker.ts) with a capped daily budget.
 * Drafting: llm("writer.reply@v") with the Replies voice + the critic. Low confidence → "held for you to write".
 * POST /api/replies/:id/send → publishToX({text, reply.in_reply_to_tweet_id}) after human approval. No auto-replies,
 *   no likes or follows (X Automation Rules). Opt-in auto-replies are ROADMAP (Engage-Rules).
 */
export async function replies(req: Request, env: any) {}

// ----------------------------------------------------------------------------- experimental
/**
 * POST /api/brands/:id/leads/search   Screens: Leads (EXPERIMENTAL).
 * External: searchWeb({query from audience segments, category:"company"|"people"}). Exa `people` category:
 *   public profiles only. NO email harvesting, WHOIS or guessed addresses (research 07; Spam Act risk).
 * Writes: leads. "Draft outreach" → createDraft(channel 'email_draft'). It is never sent by the system.
 * "Export CSV" → GET /api/brands/:id/leads.csv.
 */
export async function leads(req: Request, env: any) {}

/**
 * POST /api/brands/:id/personas      Screens: Influencer-Setup (EXPERIMENTAL). Avatars via Storage signed upload.
 * Writes personas with disclosure locked on. registerMemo('persona'). Must be tied to a demo brand, not the founder (UI review #8).
 * GET /api/personas/:id/queue        Screens: Influencer-Queue. Drafts with author=persona.
 * Watermark check: ⚠ GAP G-WATERMARK. No image watermark/stamp service is chosen or verified. "Re-stamp image" has no backend.
 * Content must be SFW in the demo (UI review #7).
 */
export async function personas(req: Request, env: any) {}

// ----------------------------------------------------------------------------- roadmap (one line each)
// Engage-Rules (ROADMAP): rules and opt-in auto-replies tables; every send is still queued for a human by default.
// Partners (ROADMAP): POST /api/brands/:id/invites {email, role:'partner', voiceIds} → memberships. Email via SMTP (G-AUTH-2).
// Analytics (ROADMAP): metrics table filled by cron from X public_metrics (own posts) and YouTube videos.list statistics
//   (1 quota unit, API key). LinkedIn metrics need Community Management approval. TikTok Display API only for the user's own videos.
// Ambassador program open to all creators (ROADMAP): bounties, brand-picked rewards and a performance pool.
//   Metrics from YouTube or TikTok (with consent); never X. Needs fraud checks and escrow. No public money leaderboard.
