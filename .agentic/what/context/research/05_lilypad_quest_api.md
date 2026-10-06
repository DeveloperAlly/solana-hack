---
type: research
status: active
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [research, quests, lilypad, reuse]
---
> **Status: active.** Research input (2026-10-06) for ambassadors and quests; partial review, see the access limitation below.

# Lilypad quest API: review and fit for Waterlily

**Access limitation:** the repo couldn't be read directly. The `Lilypad-Tech` org has OAuth App access restrictions, so the GitHub connector returned 403. This review comes from GitHub code-search fragments and commit search (all 69 commits), so it's partial. To allow a full read, approve the GitHub MCP app for the Lilypad-Tech org, or add the repo to the session.

## 1. What it does
- **Purpose:** the backend for the "Lilypad Questing Platform", a gamified campaign engine (`README.md`).
- **Stack:** Node/TypeScript, Apollo Server 3, GraphQL, Supabase; Jest and supertest for tests.
- **Entry points:** `api/graphql.ts` (prod, with Playground and introspection on) and `api/graphql-local.ts` (port 8000).
- **Schema** (`src/schema/typeDefs.ts`):
  - Mutations: `addUser(wallet)`, `addIdentity`, `submitTask(taskId, userId, proof: JSON)`, `grantReward`, `submitReferral`.
  - Queries: `user`, `tasks(campaignId)`, `campaigns`, `leaderboard`, `rewards`, `referrals`.
  - `IdentityProvider` JSON for github, discord, reddit, email, youtube, twitter.
- **Tables:** users, identities, campaigns, tasks, user_tasks, leaderboard_snapshots, rewards, referrals, bounties. There are no migrations in the repo.
- **Unrelated extra:** the repo also contains a Lilypad model-marketplace catalogue (added June 2025).
- **Auth: effectively none.** The Apollo context only holds `supabase`. There is no API-key, JWT or wallet-signature check.
- **Wallets:** EVM-style strings, unverified; no Solana support. No code calls the X, Discord or GitHub APIs or any chain.

## 2. Maturity
- **Activity:** 69 commits, 5 May to 23 Jul 2025; dormant for about 14 months.
- **Tests:** integration tests that hit a live Supabase instance.
- **Deployment:** a Dockerfile targeting Cloud Run; no CI.
- **Environment variables** (names only): `SUPABASE_URL`, `SUPABASE_KEY`, `ANURA_KEY`, `ANURA_BASE_URL`.
- **Licence:** ISC in `package.json`; no LICENSE file.
- **Secrets:** none found by search; a full read or secret scan is needed to confirm.

## 3. Verification and rewards
- **Verification: none automated.** `submitTask` stores whatever proof the client sends, with `status: "submitted"`.
- **Completion:** no mutation sets `status` to complete (presumably an admin does it in Supabase).
- **Points:** computed as the sum of completed task points.
- **Rewards:** `grantReward` is an unauthenticated record, with no token, USDC or onchain payout.

## 4. Fit for Waterlily
- **Reuse as a reference:**
  - campaign / task / user_task model
  - points as a sum of completed tasks
  - leaderboard pagination
  - identity JSON pattern
  - referral table
- **Needs:**
  - Solana sign-in-with-wallet and roles
  - `brand_id` scoping with row-level security
  - a review flow (submitted → approved or rejected)
  - per-channel verifiers (LinkedIn manual or URL check, blog fetch, Discord role check)
  - a USDC payout ledger with idempotent SPL transfers
  - links to provenance attestations
  - versioned migrations
  - an Apollo upgrade (Apollo Server 3 is end-of-life)
- **X-incentive risk (flagged).** The README's quest catalogue rewards X activity ("Points for: Like, RT, QT, Reply", "Bounty for Lilypad RTs"; test fixture "Tweet About Us"). That conflicts with X's developer policy ("shouldn't compensate people to take actions on X") and the Jan 2026 InfoFi ban. The risk sits in the quest design, not the code. Waterlily quests should reward off-X work.

## 5. Effort for a minimal brand quest (manual review, admin-paid USDC, Solana login, no X quests)

| Work | Hours |
|---|---|
| Fork and clean up, migrations, brand_id, RLS | 6–10 |
| Solana sign-in and roles | 8–12 |
| Quest CRUD and review flow | 8–12 |
| Proof checks | 4–8 |
| USDC payout ledger and transfers | 10–16 |
| UI wiring | 12–20 |
| Tests and deployment | 6–10 |
| **Total** | **~54–88h** |

**Bottom line:** a thin, unauthenticated CRUD scaffold. Use it as a **data-model reference** and build a minimal quest feature fresh inside Waterlily's stack. A hackathon-sized quest (one brand, manual approval, one USDC payout) is far smaller than the estimate above, because it skips hardening.

**Sources:** github.com/Lilypad-Tech/lilypad-quest-api (code search and commits); X automation rules https://help.x.com/en/rules-and-policies/x-automation ; X developer policy https://docs.x.com/developer-terms/policy ; InfoFi ban https://x.com/nikitabier/status/2011825522817270230
