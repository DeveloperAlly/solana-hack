---
type: architecture
status: proposed
created: 2026-10-06
updated: 2026-10-12
last_edited_by: agent
tags: [architecture, backend, api, gaps]
---
> **Status: proposed.** This is the backend map for every wireframe screen: the endpoints, data sources, jobs and external APIs each one needs, plus the architecture gaps this exercise found. The boilerplate stubs (comments only, not runnable) are in [`spec/api/`](../../../spec/api/). The UI review it builds on is in [wireframe audit §v2](./wireframe_audit_2026_10_06.md#v2-2026-10-06-re-review). Every external API fact was checked against primary docs on 2026-10-06 (§9). Anything not checked is marked **TO VERIFY**.

# Backend map

## 1. Decisions taken in this pass
- **Purpose of the build (owner, 2026-10-06):** the founder wants to use JamJam herself. Winning the hackathon is a bonus, not the goal. So the full phased plan in issue #4 stays: there is no cut to a single demo loop, the ICP stays broad (any brand), and there's no outside-traction workstream. The demo runs on devnet only.
- **Registry (owner, 2026-10-06):** registrations use the **Solana Attestation Service (SAS)**, with the memo program as the fallback if the devnet spike that opens UI slice S0 fails (§7 G-SAS).
- **Search:** Exa is the default search provider, behind a swappable adapter (owner, 2026-10-06). It does competitor research at Gate 2, reads owned URLs during ingest, reads a URL pasted into Verify, and supplies lead signals.
- **Format:** a markdown map plus TypeScript stubs. No separate PRD; this feeds the P0 PRD rewrite and the P1 component map (owner, 2026-10-06).
- **Scope:** full boilerplate for hackathon, coming-soon and experimental screens. Roadmap screens get one line each. Parked and superseded screens are skipped (owner, 2026-10-06).

## 2. Runtime topology (proposed)
| Component | Runs on | Why / verified fact |
|---|---|---|
| Web app and API route handlers | Next.js on Cloudflare Workers via **vinext** (Cloudflare's current default for Next.js) | Bindings come from `import { env } from "cloudflare:workers"` |
| Pipeline Worker | A separate plain Worker holding queue consumers, cron and Workflows | vinext doesn't document exporting `queue()`, `scheduled()` or Workflow classes |
| Long jobs (ingest, drafting) | Cloudflare **Workflows**, one `step.do` per external call | Available on the Free plan. **10 ms CPU per step**, but waiting on `fetch()` doesn't count. 1 MiB result per step |
| Short jobs | Cloudflare **Queues** | Free plan: 10k ops a day, 24 h retention, 128 KB per message |
| Data | **Supabase** Postgres with RLS, Storage and Realtime | The secret key bypasses RLS, so writes go through route handlers. Realtime drives the progress screens |
| Auth | Supabase **email OTP** | ⚠ The built-in email service sends only 2 emails an hour, so custom SMTP is needed (G-AUTH-2) |
| LLM | **OpenRouter** gateway, default a `:free` model with a fallback in `models[]` | 20 requests a minute, and 50 a day until 10 credits are bought (then 1,000 a day). Use `data_collection:"deny"` |
| Search and reading pages | **Exa** `/search` and `/contents` via plain `fetch()` | It isn't verified that exa-js runs on Workers |
| Chain | Solana **devnet** through **@solana/kit**, SAS (memo fallback) and USDC devnet. RPC via Helius free | Public devnet RPC is limited per IP and "not intended for production" |
| Registrations | **SAS** attestations via `@solana/attestation` 2.1.0, issued by a server-side **Registrar** keypair that is the payer, credential authority and sole authorized signer. Memo fallback | Brands never sign. The subject's address or a random address is the attestation nonce. Rent is about 0.002–0.0035 SOL per attestation and can be reclaimed by closing it (computed from the account size, confirm at runtime) |
| Payouts | The **brand's wallet** signs a USDC `transferChecked` built by the server | Brand wallet is an injected wallet linked by `signMessage` ([ADR-006](../decisions/adr_006_wallet_identity_split.md)) |
| Publishing | X API v2 (OAuth 2.0 PKCE) and LinkedIn Share on LinkedIn (`w_member_social`), plus a copy-and-paste fallback | X charges **$0.015 a post, or $0.20 if the post has a URL**. LinkedIn tokens last 60 days with no refresh |

## 3. Data model additions (proposed; extends §3)
`spec/api/schema.sql` adds the entities the UI shows but §3 doesn't model (UI review g1–g15):
- **Accounts:** `profiles`, `memberships` (seats and roles), `wallets`, `wallet_challenges` (one-time signMessage challenges, ADR-006).
- **Content:** `drafts` (draft or post, slop fixes, scores, polish history, content hash), `connections` (encrypted OAuth tokens).
- **Ambassadors:** `campaigns`, `submissions`, `payouts`.
- **Settings:** `ai_settings`.
- **Experimental or later:** `personas`, `leads`, `inbox_threads`, `metrics`.
- **Progress:** `jobs`, which feeds the progress UIs over Realtime.
- **Changes to existing tables:**
  - `registrations` gains `kit_version`, `approver_id`, `author_id`, `platform_url`, `campaign_id` and `domain_verified_at_time`. Verify-1 shows these fields, so the table needs them.
  - `evidence.status` gains `legacy`.
  - `kit_sections.state` gains `stale`.
  - `audiences.real_people` gets a private flag. Real people are never named in prompts.

## 4. Screen → backend map
Key: stubs are in `spec/api/routes/<file>`. **E** = external call. **J** = job.

### Brand Builder (`brand_builder.ts`)
| Screen | Endpoints | Tables | External / jobs |
|---|---|---|---|
| Main | `POST /api/verify` (inline check); brand name carried to `POST /api/brands` | registrations | E: Exa `/contents` for a URL |
| Onboard-1-SignIn | Supabase `signInWithOtp` and `verifyOtp` (client), `POST /api/profile` | profiles | E: Supabase Auth with custom SMTP (G-AUTH-2). Sign-in creates no wallet ([ADR-006](../decisions/adr_006_wallet_identity_split.md)); the copy must not promise one |
| Onboard-2-Domain, Onboard-2b-DomainFailed | `POST /api/brands/:id/domain/token`, `POST /api/brands/:id/domain/check` | brands, registrations | E: DNS-over-HTTPS (**TO VERIFY**); on success the Registrar writes an identity attestation |
| BB-1-Basics | `POST /api/brands` | brands, memberships, evidence, sources | none |
| Onboard-3-Sources | `POST /api/brands/:id/sources`, `DELETE …/sources/:id`, link "Connect for publishing" to `GET /api/connect/x/start` | sources | E: Supabase Storage `createSignedUploadUrl` |
| Onboard-3b-Profiling, Ingest-Error | `POST /api/brands/:id/ingest`, `POST /api/sources/:id/retry`, Realtime on `jobs` and `sources` | jobs, sources, evidence | J: IngestWorkflow. E: Exa `/contents`, OpenRouter (extractor) |
| Coverage-Map | `GET /api/brands/:id/coverage` | evidence, kit_sections | Rules only (§12.3.1). ⚠ Move it to before the interview (UI review #1) |
| BB-2 to BB-6 | `GET …/interview/next`, `POST …/interview/answer`, `POST …/draft-section` (BB-4 options, BB-5 personas, BB-6 samples) | evidence, audiences | E: OpenRouter (drafter and critic); Exa `/search` at BB-4. ⚠ Voice recording needs speech-to-text (G-VOICE-INPUT) |
| Gate 1, Gate 2, Gate 3 | `POST …/draft-section` (variants), `POST …/gates/:gate/approve` | decisions, kit_sections, voices | E: OpenRouter |
| Brand-Build | `GET …/kit/current`, `PATCH …/sections/:section`, `POST …/draft-section`, `POST …/ingest` (re-read) | kit_versions, kit_sections, evidence | E: OpenRouter |
| Onboard-6-Published, Kit-RegisterFailed | `POST …/kit/approve`, `POST /api/registrations/:id/retry` | kit_versions, registrations | E: SAS attestation (memo fallback) by the Registrar via Helius RPC. Explorer link |
| Kit-Export | `GET …/kit/:version` (JSON); zip built in the browser | kit tables, evidence, voices | Zipping inside a 10 ms CPU limit is risky (G-ZIP) |
| Claims (screen missing) | `GET/POST/PATCH …/claims`, `GET …/claims/suggest` | claims, evidence, registrations | E: SAS attestation when a claim is approved |

### Create (`create.ts`)
| Screen | Endpoints | Tables | External / jobs |
|---|---|---|---|
| Voice-Templates | `GET /api/templates` | templates | Seeded data from research 06: 12 templates, 9 dimensions |
| Voice-Editor | `POST …/voices`, `PATCH /api/voices/:id`, `POST /api/voices/:id/preview` | voices | E: OpenRouter (preview). Safety classifier for Flirty (G-SAFETY) |
| Content-Dashboard (and its empty state), Hub-Home | `GET …/drafts?status=&channel=` | drafts | none |
| Create-NewDraft (screen missing) | `POST …/drafts` | drafts | J: DraftWorkflow (writer, slop pass, checks, scores) via OpenRouter |
| Draft-Review | `GET`/`PATCH /api/drafts/:id`, `POST …/polish`, `POST …/polish/undo`, `POST …/approve` | drafts | E: OpenRouter. "Best slot" uses a static default until analytics exist |
| Publish and Registered (screens missing) | `POST /api/drafts/:id/publish` (x, linkedin or manual) | drafts, connections, registrations | E: X `POST /2/tweets`; LinkedIn `/v2/ugcPosts`; SAS attestation (content) |
| Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing) | `POST …/campaigns`, `PATCH /api/campaigns/:id`, `POST …/plan`, `POST …/launch` | campaigns, drafts | E: OpenRouter (plan). The API rejects a paid X format |

### Grow (`grow.ts`)
| Screen | Endpoints | Tables | External / jobs |
|---|---|---|---|
| Amb-1, Amb-1b, M-1 | `GET /api/campaigns/open`, `POST …/notify` | campaigns, payouts | none |
| Amb-2, M-2 | `POST /api/campaigns/:id/join`, `POST /api/wallets/link` | memberships, wallets, wallet_challenges | Wallet sign-message challenge ([ADR-006](../decisions/adr_006_wallet_identity_split.md)) |
| Amb-3, M-3 | `POST /api/campaigns/:id/drafts`, `GET /api/drafts/:id/checks` | drafts | J: DraftWorkflow via OpenRouter |
| Amb-4, M-4 | `POST /api/submissions` (LinkedIn or pasted URL; **no X**) | submissions, connections | E: LinkedIn. J: `verify_submission` |
| Amb-5a, 5b, 5c, 5d, M-5 | Realtime on `submissions`; `GET /api/me/earnings`; `PUT /api/me/payout-wallet` (choose which linked wallet is paid) | submissions, payouts, profiles, wallets | E: Exa `/contents` (verify), RPC balance. No "Withdraw": payouts go straight to the ambassador's own wallet ([ADR-006](../decisions/adr_006_wallet_identity_split.md)) |
| Dashboard (and its empty state) | `GET …/ambassadors`, `POST /api/submissions/:id/approve` and `/reject` (owner or approver), `POST /api/submissions/:id/pay` (owner only), `POST /api/payouts/:id/confirm`, `PUT /api/brands/:id/payout-wallet` (prompted on the first "Approve and pay" when `brands.payout_wallet` is empty) | submissions, payouts, registrations, brands, wallets, wallet_challenges, profiles | E: USDC `transferChecked` plus a memo, signed by the brand wallet; RPC `getTransaction`. Brand payout wallet: a wallet the owner verified by `signMessage`, set per brand ([ADR-006](../decisions/adr_006_wallet_identity_split.md)) |
| Engage-Queue | `GET …/replies`, `POST /api/replies/:id/send` | drafts | E: X mention reads (pay-per-use) and X reply posts. Cron. No LinkedIn comments (`r_member_social` closed) |
| Leads (experimental) | `POST …/leads/search`, `GET …/leads.csv` | leads | E: Exa `/search` (company and people categories, public only) |
| Influencer-Setup, Influencer-Queue (experimental) | `POST …/personas`, `GET /api/personas/:id/queue` | personas, drafts, registrations | Storage, SAS attestation. Watermarking not chosen (G-WATERMARK) |

### Public, settings, inbox (`public_settings_inbox.ts`)
| Screen | Endpoints | Tables | External / jobs |
|---|---|---|---|
| Verify-1, Verify-2, Verify-3 | `POST /api/verify`, `GET /api/verify/{kit,account,claim}`, `POST /api/verify/report` | registrations, drafts | E: Exa `/contents`. "Edited" needs a similarity match (G-MATCH) |
| Ledger | `GET /api/ledger` | registrations, payouts | Explorer links |
| Settings › Connections (missing) | `GET /api/connect/{x,linkedin}/start` and `/callback`, `DELETE /api/connections/:id`; brand payout wallet (owner only, scoped to the active brand): `POST /api/wallets/link`, then `PUT /api/brands/:id/payout-wallet {address}`; `DELETE /api/brands/:id/payout-wallet` | connections, wallets, wallet_challenges, brands | E: X and LinkedIn OAuth. Encrypting tokens at rest (G-SECRETS) |
| Settings › AI (missing) | `GET/PUT …/ai-settings` | ai_settings | E: OpenRouter, Anthropic or OpenAI key test. Where bring-your-own keys are stored is still open (P4) |
| Settings › Plan (missing) | `GET …/plan` | brands, memberships | Billing provider not chosen (G-BILLING) |
| Inbox-All, Inbox-NeedsReply, Inbox-Connect (coming soon) | Sketch only | inbox_threads | Email, Telegram bot, X DMs. Sending is always done by a person |

### Roadmap (one line each)
- **Engage-Rules:** rules table; replies still queue for a person by default.
- **Partners:** invites become memberships with the partner role; email needs SMTP.
- **Analytics and Analytics-Empty:** a `metrics` cron reading X `public_metrics` for the brand's own posts and YouTube `videos.list` statistics. LinkedIn metrics need Community Management API approval.
- **Ambassador program open to all creators:** YouTube and TikTok (own videos, with consent) metrics; never X; needs escrow and fraud checks.

## 5. Pipeline stage → job coverage (§2 and §12.2)
| Stage | Where |
|---|---|
| 1 Intake | `POST /api/brands` |
| 2 Ingest (Ingestor) | IngestWorkflow "read" steps (Exa `/contents`, Storage) |
| 3 Evidence store (Extractor) | IngestWorkflow "extract" steps; `evidence` table |
| 4 Coverage map (Gap analyst) | `GET …/coverage` (rules) |
| 5 Guided interview (Interviewer) | `…/interview/next` and `…/answer` |
| 6 Section drafters and Critic | `POST …/draft-section`, DraftWorkflow |
| 7 Decision gates | `POST …/gates/:gate/approve` |
| 8 Brand Kit vN | `POST …/kit/approve` (canonical JSON, then SHA-256) |
| 9 Validation loop | Roadmap: the `metrics` cron feeds evidence |
| 10 Registry (Registrar) | `registerAttestation()` (SAS; `registerMemo()` is the fallback), used by identity, kit, claim, account, content and persona |
| Voice compiler | `POST …/voices` (rules table) |

## 6. Coverage check (run 2026-10-06, by script)
- **Screens:** 60 of 60 non-parked, non-superseded artboards are mapped in §4. 0 are unmapped.
- **Tables:** all 26 tables in `schema.sql` are used by at least one endpoint or job. 0 are orphaned.
- **Pipeline stages:** all 10 stages in §2, plus the voice compiler, have an endpoint or job (§5).
- **External services:** every one has a primary-doc link in §9 except the DNS-over-HTTPS lookup, which is flagged TO VERIFY.

## 7. Architecture gaps and decisions needed
| ID | Gap | Severity | Proposed resolution |
|---|---|---|---|
| **G-WALLET** (decided: [ADR-006](../decisions/adr_006_wallet_identity_split.md), 2026-10-06) | **Phantom Connect is not accepting new apps** ("New sign-ups for Phantom Connect SDK access … are paused"), and its providers are Google, Apple and injected only, with no email. §12.1 step 0 (email sign-in creates an embedded wallet) cannot be built as written. Twelve screens depend on it (UI review h) | **High** | Split identity from wallet. Supabase email OTP handles sign-in. The Registrar keypair signs all registrations, so no user wallet is needed for the core demo. A wallet is only needed for USDC payouts: the brand pays and the ambassador receives through an injected wallet (Phantom or another standard wallet) verified by `signMessage`. Evaluate other embedded-wallet providers in P0. **Update §12.1 step 0, Onboard-1, Amb-2 and M-2 copy.** Remove "Withdraw" unless a custodial or embedded provider is chosen |
| G-AUTH-2 | Supabase's built-in email service sends only 2 emails an hour | High | Choose an SMTP provider in P0 and set it up in Supabase Auth |
| G-INGEST-1 | Extracting PDF and DOCX text within 10 ms CPU per step is unverified | Med | Hackathon: URLs, Markdown and plain text first. PDF via Workers Paid (30 s CPU per step) or an extraction API, decided in P0 |
| G-MATCH | Verify "edited from original" needs a similarity method and threshold | Med | Hackathon: exact hash match plus a simple diff against the brand's own approved drafts. pg_trgm or pgvector later (**TO VERIFY**) |
| G-ZIP | Building the aDNA zip inside a request | Low | Build it in the browser from the kit JSON |
| G-VOICE-INPUT | BB-2 "Record voice" needs speech-to-text | Low | Hide it for the hackathon; text only |
| G-SAFETY | The Flirty template needs a content-policy classifier | Med | Demo is safe-for-work only; choose a classifier later. The template stays gated |
| G-WATERMARK | Persona image watermarking has no service | Low (experimental) | Label only; leave stamping to later |
| G-SECRETS | OAuth tokens and bring-your-own keys must be encrypted at rest | Med | WebCrypto AES-GCM with a Worker secret key; rotation plan in P1 |
| G-BILLING | No billing provider for the subscription | Low | Static "trial" plan, labelled, for the hackathon |
| G-X-COST | X charges $0.20 per post with a URL; reading mentions is also paid | Med | Cap daily X spend in cron; show the cost before publishing |
| G-LI-API | It is unverified whether a `w_member_social`-only app can call `/rest/posts`, and whether `userinfo.sub` equals the person ID | Med | Build on `/v2/ugcPosts` first; test both in P0 |
| G-MEMO-V4 | It is unverified whether memo program v4 (`Memo4c2p…`) is deployed on devnet | Med | Check with `getAccountInfo`; fall back to `LEGACY_MEMO_PROGRAM_ADDRESS_V3` |
| **G-SAS** (resolved 2026-10-08) | Settled by the devnet spike (`spike/`, run 4 of the devnet-spike workflow). (1) The SAS program `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` exists and is executable on devnet. (2) From Node, `@solana/attestation` 2.1.0 created credential `WATERLILY`, schema `WL-KIT` v1 and one attestation, then read it back: signer = Registrar, credential and schema match, all 5 fields decoded. (3) In local workerd (`wrangler dev`, `nodejs_compat`) the same SDK bundles and runs up to the network call, which fails on the RPC (G-RPC); a full in-Worker transaction is not yet proven. (4) A test mint (6 decimals) put 1000 tokens in the brand wallet. Evidence: `spike/out/results.json` (commits 372be23, 2546d76) | Done | Keep SAS; the memo fallback is not needed. Verify still checks `signer` = Registrar. See G-RPC |
| **G-RPC** (new 2026-10-08) | (1) The public devnet RPC returns HTTP 403 to `fetch` from workerd, with or without a User-Agent; from Node on the same runner it works. (2) The public RPC also returns 429 under light load. (3) The devnet faucet refuses GitHub Actions IPs (13 attempts, all 429 or internal error). Cause of (1) is unverified | High | Use a provider RPC (for example Helius free tier) for the Worker and set `RPC_URL` as a secret; fund devnet wallets from faucet.solana.com by hand |
| G-SUPA-PAUSE | Supabase Free pauses a project after a week of inactivity | Low | The daily cron runs one query |
| G-LLM-QUOTA | The free-model cap is 50 requests a day until 10 credits are bought | High (for the demo) | Buy 10 OpenRouter credits before Oct 9 |

## 8. UI changes this map requires (feed to the design chat)
- **Fix the demo flow:**
  - Move the coverage map to before the interview.
  - Add Create-NewDraft, the polish actions, Publish, and a Registered success screen.
  - Add the Claims screen.
  - Add the three Settings screens.
- **Remove paid X ambassador formats** (X Developer Policy: "shouldn't compensate people to take actions on X").
- **Copy changes:**
  - Sign-in no longer promises an automatic wallet.
  - No "Withdraw": payouts land in the ambassador's own wallet, so there is nothing to withdraw ([ADR-006](../decisions/adr_006_wallet_identity_split.md)).
  - Unverified brands can register kits and posts; they're flagged, not blocked.
  - Ledger and Verify show registrations and payouts only, with no licensing data.

## 9. External API facts (verified 2026-10-06, primary docs)
| Service | Verified | Source |
|---|---|---|
| OpenRouter | Endpoint, headers, `models[]` fallback, `response_format` json_schema, `provider.require_parameters` and `data_collection`, error codes | [overview](https://openrouter.ai/docs/api/reference/overview), [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks), [provider selection](https://openrouter.ai/docs/guides/routing/provider-selection), [errors](https://openrouter.ai/docs/api/reference/errors-and-debugging) |
| OpenRouter limits | `:free` IDs; 20 per minute; 50 a day, or 1,000 a day once 10 credits are bought | [limits](https://openrouter.ai/docs/api/reference/limits) |
| OpenRouter bring-your-own key | Set at account level, not per request; 5% fee | [BYOK](https://openrouter.ai/docs/guides/overview/auth/byok) |
| Anthropic and OpenAI direct | `/v1/messages` with `x-api-key` and `anthropic-version`; `/v1/chat/completions` with a Bearer token | [Anthropic](https://platform.claude.com/docs/en/api/messages), [OpenAI](https://developers.openai.com/api/reference/resources/chat) |
| Exa | `/search` (`type` auto, fast, instant, deep and variants; category; `contents`), `/contents`, `/answer`; pricing; rate limits | [search](https://exa.ai/docs/reference/search), [contents](https://exa.ai/docs/reference/get-contents), [pricing](https://exa.ai/pricing), [rate limits](https://exa.ai/docs/reference/rate-limits) |
| Cloudflare Workers, Queues, Workflows, cron | Free plan: 10 ms CPU (waiting on `fetch` excluded); Queues and Workflows on Free; their APIs | [limits](https://developers.cloudflare.com/workers/platform/limits/), [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/), [Queues API](https://developers.cloudflare.com/queues/configuration/javascript-apis/), [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/), [Workflows API](https://developers.cloudflare.com/workflows/build/workers-api/) |
| Next.js on Cloudflare | vinext is the recommended route | [guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/), [vinext](https://github.com/cloudflare/vinext) |
| Supabase | Publishable and secret keys; OTP; built-in email limit of 2 an hour; RLS; Storage signed uploads; Free tier limits and pausing; Realtime; pgvector | [API keys](https://supabase.com/docs/guides/api/api-keys), [OTP](https://supabase.com/docs/reference/javascript/auth-signinwithotp), [rate limits](https://supabase.com/docs/guides/auth/rate-limits), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [signed upload](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl), [pricing](https://supabase.com/pricing), [Realtime](https://supabase.com/docs/guides/realtime/postgres-changes) |
| Solana | @solana/kit transaction pattern; memo client and v4 address; USDC devnet mint and faucet; fee sponsorship and Kora; devnet RPC limits; Helius | [Kit](https://www.solanakit.com/docs/getting-started/send-transaction), [memo](https://www.solana-program.com/docs/memo), [USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses), [fee sponsorship](https://solana.com/developers/cookbook/transactions/fee-sponsorship), [clusters](https://solana.com/docs/references/clusters), [Helius](https://www.helius.dev/pricing) |
| Solana Attestation Service | Program, accounts (Credential, Schema, Attestation), instructions, SDK `@solana/attestation` 2.1.0 (`sas-lib` frozen at 1.0.10), verify recipe | [README](https://github.com/solana-foundation/solana-attestation-service), [announcement](https://solana.com/news/solana-attestation-service), [npm](https://www.npmjs.com/package/@solana/attestation), [devnet example](https://github.com/solana-foundation/solana-attestation-service/tree/master/examples/typescript/attestation-flow-guides) |
| Phantom | Connect SDK; Portal **closed to new apps**; providers Google, Apple and injected | [Phantom Connect](https://docs.phantom.com/phantom-connect), [browser SDK](https://docs.phantom.com/sdks/browser-sdk/index) |
| X | OAuth 2.0 PKCE; `POST /2/tweets` (`made_with_ai`, `paid_partnership`); `public_metrics`; pay-per-use pricing; policy against compensating X actions | [create post](https://docs.x.com/x-api/posts/create-post), [OAuth 2.0](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code), [pricing](https://docs.x.com/x-api/getting-started/pricing), [policy](https://docs.x.com/developer-terms/policy), [automation rules](https://help.x.com/en/rules-and-policies/x-automation) |
| LinkedIn | Self-serve `w_member_social`; OAuth; 60-day tokens; ugcPosts and the Posts API; organisation posting and metrics need approval | [getting access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access), [share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin), [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api) |
| YouTube and TikTok (roadmap) | `videos.list` statistics cost 1 unit; the TikTok Display API covers the user's own videos | [YouTube](https://developers.google.com/youtube/v3/docs/videos/list), [TikTok](https://developers.tiktok.com/doc/tiktok-api-v2-video-query) |

**TO VERIFY (not on an official page):**
- the DNS-over-HTTPS endpoint
- ~~SAS deployed on devnet; kit and attestation bundling in workerd~~ (checked 2026-10-08, G-SAS); the deployed SAS program version; a full transaction from inside a Worker (G-RPC)
- exa-js on Workers
- memo v4 deployed on devnet, and its size limit
- Ed25519 pkcs8 import in workerd
- the wrangler key for a cross-script Workflow binding
- LinkedIn `/rest/posts` with self-serve access, and `sub` as the person ID
- pricing for reading the brand's own X posts
- whether all free OpenRouter models log prompts
- USDC devnet decimals (assumed 6)
- the TikTok filter key name

## 10. Providers, models, packaging and settings [proposed 2026-10-12]
Moved here from the 2026-10-12 delivery plan so the repo holds it. Component IDs are the [backlog](../../how/backlog/backlog.md) IDs; measures run in the evaluation harness ([architecture §13](./brand_builder_architecture.md#13-evaluation-harness-proposed-2026-10-12)). Sources: [architecture §13.5](./brand_builder_architecture.md#135-sources-for-61-62-71-and-13).

### 10.1 Decisions awaiting the owner
1. **Models for brand data.** Free models are fine for development and CI, but only one free text model offers zero data retention, so brand content runs on the owner workstation or on paid models with zero retention: Claude Haiku 5.5 ($0.10 / $0.50 per million tokens) for extraction, judging and polish, and Sonnet 5.5 ($2 / $10) for drafting in the brand's voice. At 30 posts a brand a month that is about $7 a month at 10 brands and $73 at 100, paid by each brand once it brings its own key (S2). Alternative: everything on Haiku (about $0.75 at 10 brands).
2. **Workstation as a provider (X3).** Issue JamJam a service identity on the workstation gateway and wire its writing route to the orchestrator (tracked in the workstation's own private repo).
3. **Runtime claims checker (C1, G2).** The Worker cannot host the small checker models, so the default is an LLM judge from a different model family, calibrated on fixtures. Alternatives: run the checker on the workstation, or on a small CPU host whose cost is not verified.
4. **Owner labelling time (X12).** About 2 hours for gold facts, 100 to 200 judge labels per dimension, and a 40-pair blind voice test. Without these the judge cannot be trusted and the voice claim cannot be made.
5. **Repo stays public** (CI scoring is free on a public repo; a private repo gets a minutes quota).
6. **LinkedIn Company Page access.** Apply for the vetted Community Management API if Company Page publishing is wanted; it needs a legal entity and a screencast.

### 10.2 Gateway and workflow
| Component | On main today | Best-output option (alternatives considered) | Measured by |
|---|---|---|---|
| **Model gateway and pool** (X1, X2, X3; #39) | One gateway, `openrouter/auto` (`llm.ts`) | A task-to-model map (extract, draft, judge, polish) chosen by harness score, with providers tried in order: the brand's own key, then the owner workstation (for your own brands), then JamJam's OpenRouter account using OpenRouter's built-in fallback list, which moves on after any error and bills the model that answered. This replaces most of the hand-built pool in #39. Routers are harness candidates, not infrastructure (see Reuse, providers and packaging) | Forced 429 answered by the next model; a model swap ships only after the harness passes |
| **Workflow engine** (X4; #32) | Request-scoped calls | Durable runs with step retries and saved progress | A run survives a forced step failure; progress survives reload |

### 10.3 Reuse, providers and packaging

Build only what nothing else does well; reuse or plug in everything else.

**The owner workstation is a model provider.** The workstation already runs an authenticated gateway with an OpenAI-compatible `/v1/chat/completions` route, separate service identities behind private HTTPS, a 14B writing model on one 16 GB GPU, a prompt library, and an owner-scored writing benchmark. JamJam calls it like any other provider: no per-call cost, and brand data stays on your machine; OpenRouter takes over when the box is busy or offline. It also changes the ladder: the shared anti-slop writer and per-brand adapters can be trained on your box (QLoRA on a 7–14B model should fit a 16 GB A4000; to be measured), so those rungs need no paid GPU time. The benchmark is reused for JamJam's blind voice tests rather than building a second one. Limits: one request at a time today; JamJam needs its own service identity; the writing route must be wired to the orchestrator first (its README says it is fail-closed until then).


**Routers are candidates, not infrastructure.** JamJam's tasks are fixed and every output passes gates, so the router is the task-to-model map chosen by harness scores. Off-the-shelf routers are scored in the harness like any model:

| Router | What it does | Fit |
|---|---|---|
| Jev Router on OpenRouter (`typesafe/jev-router`) | Picks a model and reasoning effort per request from task difficulty and a cost tier; candidate models can be restricted | Harness candidate per task. Its page doesn't state structured-output or zero-retention support, so it stays off brand data until confirmed |
| NVIDIA LLM Router v2 | Classifies intent with a small model and returns the recommended model name only; intent mode needs a 16 GB GPU | Rejected: experimental, deprecated in favour of NeMo Switchyard, and would occupy a whole A4000 |
| OpenRouter fallback list (`models`) | Tries models in order on any error, including rate limits; bills the model that answered | Adopted for failover |

**Packaged as reusable modules.** Today the logic sits inside the Worker files (`llm.ts`, `ingest.ts`, `kit.ts`, `posts.ts`). Each component becomes a package in the repo with a typed contract and no Cloudflare or Supabase code inside; the Worker only wires them together. That keeps them testable in the harness and reusable in other products (the slop scorer and voice evaluation also serve the owner's own writing on the workstation).

| Module | Contract | Reuses |
|---|---|---|
| Provider client | chat(task, messages, schema) → result, model used, cost | OpenRouter fallbacks; OpenAI-compatible endpoints (the workstation gateway, the brand's key, Workers AI) |
| Normaliser `norm_v1` | text → normalised text, hash | Unicode NFKC |
| Evidence extraction | sources → facts with exact quotes and offsets | LangExtract's alignment method |
| Slop scorer | text, brand baseline → score, flagged spans | EQ-Bench slop-score (MIT) |
| Claims checker | draft, facts → claims with verdicts | MiniCheck and HHEM in CI; LLM judge at runtime |
| Voice | brand posts → spec; brief → retrieved exemplars | pgvector |
| Eval harness | fixtures, component → scores, gate result | promptfoo (MIT) |
| Registrar client | record → attestation address, tx | `@solana/attestation` |
| Payout builder | approved payout → unsigned tx; tx → confirmed or rejected | `@solana-program/token` |
| Verify matcher | pasted text → label, diff, matched record | pg_trgm |

### 10.4 Settings › AI: key storage (S2, S3; answers mission Q4)
| Area | Tasks | Done when |
|---|---|---|
| Settings › AI | Connect with OpenRouter (OAuth, one button; paste a key as fallback); model sources in order: the brand's own key, JamJam's default, any OpenAI-compatible endpoint (how the owner workstation plugs in); keys encrypted at rest with AES-GCM under a per-brand key derived from a versioned master secret held only in the Worker, never returned to the browser (last four characters and a Test button shown); calls and estimated spend this month (D54) | A new brand connects its own key in under a minute; a stored key can't be read back through any API; the test button reports a bad key |

### 10.5 Publishing order (P2, P3, P3a)
Official APIs in order of cost and access: Bluesky (free, open), LinkedIn as a member (self-serve), X (pay per use; links kept out of post bodies, where the price jumps), Threads (app review), LinkedIn Company Pages (vetted access, legal entity). Each goes live with its own success-rate check, and the published text must hash to the approved hash 100% of the time.
