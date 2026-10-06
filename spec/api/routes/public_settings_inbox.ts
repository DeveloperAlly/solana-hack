/**
 * Waterlily: public, settings and inbox API (BOILERPLATE, proposed 2026-10-06). Not runnable.
 * Screens: Main, Verify-1/2/3, Ledger (public); Settings (MISSING: publishing connections, AI model + bring-your-own key,
 * plan / seats / billing); Inbox-All, Inbox-NeedsReply, Inbox-Connect (COMING SOON).
 */
import { adminClient, fetchPages, sha256Hex, llm } from "../lib/clients";

// ----------------------------------------------------------------------------- public: verify + ledger
/**
 * POST /api/verify      In: {text} | {url}       Auth: none (public). Rate-limit per IP.
 * Screens: Main ("Is this official?"), Verify-1 (match), Verify-2 (not found), Verify-3 (edited from original).
 * Logic:
 *   1. If url: fetchPages([url]) (Exa /contents) → text. Failure → "couldn't read that page" (error state missing).
 *   2. hash = sha256Hex(normalise(text)) → registrations where hash = $1 and type in ('content','claim').
 *      Hit → Verify-1: brand, kit_version, approver, author, platform_url, campaign, tx explorer link, and the
 *      "unverified domain" flag if domain_verified_at_time = false.
 *   3. No exact hit → similarity search over approved drafts.body (⚠ G-MATCH: method TBD; pg_trgm or pgvector, unverified)
 *      → over the threshold: Verify-3 with a diff against original_body. Otherwise Verify-2 (neutral wording).
 * Kit, account and claim lookups (UI review #21): GET /api/verify/kit/:hash, /api/verify/account?platform=&handle=,
 *   /api/verify/claim/:hash. Same table, by type.
 * POST /api/verify/report {brandId, text|url} → a report for the brand owner (needs SMTP, G-AUTH-2; else an in-app notification).
 */
export async function verify(req: Request, env: any) {}

/**
 * GET /api/ledger?brand=&type=registration|payout&cursor=
 * Screens: Ledger (public). Out: registrations + payouts, each with an explorer link. Totals = sum of rows.
 * ⚠ The "license fees / splits / consent" rows in the current UI have NO backend: those entities are parked (UI review g15).
 * Sample figures in the UI must be labelled (first audit).
 */
export async function ledger(req: Request, env: any) {}

// ----------------------------------------------------------------------------- settings (screens MISSING)
/**
 * Publishing connections   Screens: Settings › Connections (missing), Onboard-3 "Connect for publishing", Amb-4.
 * GET  /api/connect/x/start      → builds the PKCE pair (S256), stores the verifier and state server-side, and
 *        redirects to https://x.com/i/oauth2/authorize?response_type=code&client_id=…&redirect_uri=…&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=…&code_challenge=…&code_challenge_method=S256
 * GET  /api/connect/x/callback   → POST https://api.x.com/2/oauth2/token (code, grant_type=authorization_code,
 *        redirect_uri, code_verifier; Basic auth for a confidential client) → encrypt the tokens → connections.
 *        The token lasts 2 h, so it is refreshed with the refresh_token (grant_type=refresh_token) before each publish.
 * GET  /api/connect/linkedin/start → https://www.linkedin.com/oauth/v2/authorization?response_type=code&scope=openid%20profile%20w_member_social&…
 * GET  /api/connect/linkedin/callback → POST https://www.linkedin.com/oauth/v2/accessToken → GET /v2/userinfo (sub)
 *        → connections (expires in 60 days; the user reconnects, no refresh token for non-partners).
 * DELETE /api/connections/:id
 * Token encryption: ⚠ GAP G-SECRETS. Encrypt with WebCrypto AES-GCM using a key held as a Worker secret.
 *   Rotation plan TBD. Tokens are never returned to the browser.
 */
export async function connections(req: Request, env: any) {}

/**
 * Wallet link (ADR-006)   Screens: Amb-2, M-2, Settings › Connections, the Dashboard "Approve and pay" prompt.
 * POST /api/wallets/link {address}            → returns {challengeId, message}: a one-time message (nonce, user id, address, expiry),
 *        stored in wallet_challenges (schema.sql) so any Worker instance can verify it; expires after 5 minutes.
 * POST /api/wallets/link {challengeId, address, signature} → loads exactly that wallet_challenges row (must belong to the
 *        caller, match the address, be unexpired and unconsumed), verifies the ed25519 signature of its message against
 *        the address, and consumes it atomically (UPDATE … SET consumed_at = now() WHERE id = :challengeId AND consumed_at
 *        IS NULL; zero rows updated → refused). Other open challenges for the same address are unaffected. Then upserts wallets(user_id, address, provider 'injected', verified_at); if the caller has no
 *        profiles.payout_wallet yet, sets it to this address.
 * PUT /api/me/payout-wallet {address}         → address must be a verified wallets row of the caller; sets profiles.payout_wallet
 *        (the one wallet payouts go to; Amb-5b shows it).
 * DELETE /api/wallets/:address                → removes the caller's wallet; refused while it is any brand's payout_wallet or
 *        the caller's profiles.payout_wallet.
 */
export async function walletLink(req: Request, env: any) {}

/**
 * Brand payout wallet (ADR-006)   Screens: Settings › Connections, the Dashboard "Approve and pay" prompt.
 * Auth: owner of :id (memberships.role 'owner').
 * PUT    /api/brands/:id/payout-wallet {address} → address must be a verified wallets row of the caller;
 *        sets brands.payout_wallet. Scoped to this brand only (multi-brand owners set one per brand).
 * DELETE /api/brands/:id/payout-wallet           → sets brands.payout_wallet to null (the next "Approve and pay" prompts again).
 */
export async function brandPayoutWallet(req: Request, env: any) {}

/**
 * AI model + bring-your-own key   Screens: Settings › AI (missing).
 * GET/PUT /api/brands/:id/ai-settings {provider:'openrouter'|'anthropic'|'openai', model?, key?}
 * Default: an OpenRouter ':free' model (chosen in P0; 50 req/day until the account has bought ≥10 credits, then 1000/day).
 * BYOK storage is the OPEN DECISION (P4): browser-only (the key never reaches us; background jobs can't use it)
 *   vs encrypted server-side (ai_settings.byok_key_enc, AES-GCM, G-SECRETS).
 * Validate a key with a 1-token test call to the provider.
 */
export async function aiSettings(req: Request, env: any) {}

/**
 * Plan, seats, billing   Screens: Settings › Plan (missing), Hub-Home ("Plan · 3 seats").
 * GET /api/brands/:id/plan → plan + seat count (memberships).
 * BOILERPLATE: no billing provider is chosen (GAP G-BILLING). Hackathon: a static 'trial' plan, labelled.
 * The subscription model is ADR-003. Paying in USDC via Solana Pay is an option for later.
 */
export async function plan(req: Request, env: any) {}

// ----------------------------------------------------------------------------- inbox (COMING SOON)
/**
 * Inbox-Connect / Inbox-All / Inbox-NeedsReply: UI shown, NOT built. Backend sketch only:
 *  - Sources (compendium §7): email first (forwarding or IMAP via a provider, TBD), then the Telegram bot,
 *    then X DMs (pay-per-use reads). WhatsApp Business Platform later. Personal WhatsApp/LinkedIn: opt-in only.
 *  - inbox_threads table, filled by connectors. needs_reply is flagged by llm("inbox.flag@v") (question, date or
 *    request detected). Reply drafts use the Replies voice. SEND IS ALWAYS HUMAN.
 *  - These screens need a "Coming soon" label (UI review #10).
 */
