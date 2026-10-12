---
type: script
status: draft
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [demo, script, colosseum]
---
> **Status: draft.** Script for the product demo video (3:00 or less). Slides with wireframe placeholders: [JamJam demo script](https://claude.ai/artifact/4SnEFbLLYvrfTiNPwEw3YZ). On-screen copy is quoted from the app on main @ ea9442f (`web/src/screens`, `web/worker`). Current build status lives only in [STATE.md](../../../STATE.md). The pitch has its own script: [pitch_script_2026_10_12.md](./pitch_script_2026_10_12.md).

# Demo script: JamJam, live

**What the demo proves:** a brand kit built from the brand's own site, where a fact is kept only with its quote; a post in that voice, with a false claim blocked by the claims gate; and public proof on Solana devnet that anyone can check.

**Demo brand:** JamJam builds its own brand (compendium §4, decided). One take, one critical path; every wait is cut.

**Voice-over:** 273 words over 3:00, about 110 words a minute, leaving room for the screen.

## 1. Critical path

| # | Time | Beat | Route | Status |
|---|---|---|---|---|
| 01 | 0:00–0:12 | Open on the live product | `/ (landing)` | BUILT |
| 02 | 0:12–0:18 | Email in, no wallet | `/sign-in` | BUILT · LINK |
| 03 | 0:18–0:38 | A fact stays only if it can be quoted | `/build/basics, then /build/sources` | NEEDS BUILD |
| 04 | 0:38–0:55 | Short questions, a chosen voice, a strict gate | `/build/origin to /build/voice` | BUILT |
| 05 | 0:55–1:20 | The AI drafts; I decide | `/build/purpose (Gate 1)` | BUILT · NEEDS AI KEY |
| 06 | 1:20–1:40 | Kit v1 on Solana | `/build/kit` | BUILT |
| 07 | 1:40–2:20 | A post in our voice, and a claim it blocks | `/create` | BUILT · TEST THE BLOCK |
| 08 | 2:20–2:40 | Anyone can check it | `/verify (public)` | BUILT |
| 09 | 2:40–2:50 | The public record | `/ledger (public)` | BUILT |
| 10 | 2:50–3:00 | What's next, then the line | `/grow (coming soon), then /` | BUILT |

## 2. Beats

Each beat: what must come up on screen (quoted app copy), what to say, and the recording note. Wireframe names refer to the [wireframes](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).

### Beat 01 · 0:00–0:12 · Open on the live product

Route `/ (landing)` · status BUILT · placeholder: wireframe Landing-v2

**Must come up:**
- H1: "Build your brand. Then start creating."
- Button: "Build my brand"
- Small print: "No wallet needed"
- Sample "Your brand kit" box: Purpose, Positioning, Voice

**Say:** This is JamJam, live at jamjam.tech. In three minutes I'll build JamJam's own brand, write a post in its voice, and prove that post on Solana.

**Recording:** Start the recording on the landing page, signed out. Cursor on Build my brand.

### Beat 02 · 0:12–0:18 · Email in, no wallet

Route `/sign-in` · status BUILT · LINK · placeholder: wireframe Onboard-1-SignIn

**Must come up:**
- H1: "Sign in to build your brand"
- "We email you a sign-in link. No password, no wallet."
- Cut: email link opened off camera
- Lands on /home: "Welcome to JamJam"

**Say:** I sign in with email. No password, no wallet.

**Recording:** Use the emailed link (proven live). Sign-in by code is not exercised live yet, so do not show the code field. Cut the inbox.

### Beat 03 · 0:18–0:38 · A fact stays only if it can be quoted

Route `/build/basics, then /build/sources` · status NEEDS BUILD · placeholder: wireframe J1-Read

**Must come up:**
- Basics: Brand name "JamJam", Website "jamjam.tech", "Save and continue"
- Your links: "Read this page" then "Reading the page…" (cut the wait)
- Alert: "Read it. {n} facts saved with quotes from the page."
- MUST: each fact shows its quote and page link (not shown today)

**Say:** I name the brand and give it our site. JamJam reads the page and keeps a fact only if it can quote the line it came from.

**Recording:** P0 build: show the stored quote and source link under each fact (data exists; the UI shows only the claim). Website in Basics must be jamjam.tech or the facts are treated as third-party.

### Beat 04 · 0:38–0:55 · Short questions, a chosen voice, a strict gate

Route `/build/origin to /build/voice` · status BUILT · placeholder: wireframe BB-6-Voice

**Must come up:**
- Alert: "Already found on your pages" with up to 3 facts
- Cut: remaining questions pre-answered
- Voice template: "Candid founder" (default)
- Claims gate: "Strict: every claim needs evidence"

**Say:** It asks short questions and shows what it already found. For voice I pick Candid founder, and I set the claims gate to strict: every claim needs evidence.

**Recording:** Pre-answer Origin, Why/how/what, Alternatives and Audience before recording; show one question screen only.

### Beat 05 · 0:55–1:20 · The AI drafts; I decide

Route `/build/purpose (Gate 1)` · status BUILT · NEEDS AI KEY · placeholder: wireframe BB-Gate1-Purpose

**Must come up:**
- H1: "Gate 1: purpose"
- "Draft it for me" then "Drafting… this takes up to a minute" (cut)
- "Where this came from": "Your answer: …" and "Source: … (page link)"
- "Approve purpose" then "Approved · Recorded {date, time}"
- Cut: Gates 2 and 3 already approved

**Say:** The AI drafts our purpose, and shows where each line came from: my answers and quotes from the site. This is a decision gate. I approve it, and the approval is recorded. Positioning and voice work the same way.

**Recording:** Needs OPENROUTER_API_KEY live (aiConfigured unconfirmed in STATE.md). Free model can return 'busy': retry, keep the best take.

### Beat 06 · 1:20–1:40 · Kit v1 on Solana

Route `/build/kit` · status BUILT · placeholder: wireframe J5-Approve-Kit

**Must come up:**
- H1: "JamJam kit", "Gates approved: 3 of 3"
- "Register kit v1" then "Registering on Solana…" (cut, up to 45 s)
- Alert: "Kit v1: registered" with sha256:…
- "View the transaction on Solana Explorer" opens the devnet transaction

**Say:** Three gates approved. I register kit v1. JamJam's Registrar signs it on Solana devnet. The fingerprint goes on-chain; the words stay private. Here is the transaction.

**Recording:** Open Explorer in the same tab (no new windows in the recording). Check the Explorer link uses cluster=devnet.

### Beat 07 · 1:40–2:20 · A post in our voice, and a claim it blocks

Route `/create` · status BUILT · TEST THE BLOCK · placeholder: wireframe Draft-Review

**Must come up:**
- "What is the post about?": JamJam launch · Channel: LinkedIn · "Draft a post"
- "LinkedIn · drafted", "Slop check: passed", "Voice fit: {0-100}"
- "Beautify" then "Last change: Beautify. Undo restores the previous text."
- Add "Used by 10,000 brands." then "Approve": "Blocked by your claims gate"
- Remove it, "Approve", "Copy text", "Register post", then "Registered"

**Say:** Now a post. I ask for a LinkedIn launch post. It drafts in the approved voice and passes the slop check before I see it. Beautify formats it for LinkedIn. Now I add a claim we can't back: used by ten thousand brands. Approve. Blocked by my claims gate. I take it out, approve, and register the post.

**Recording:** Rehearse the block off camera first: the claims gate is an LLM call, so confirm it blocks that sentence under Strict. Keep the approved text unchanged for Verify.

### Beat 08 · 2:20–2:40 · Anyone can check it

Route `/verify (public)` · status BUILT · placeholder: wireframe Verify-1-Match

**Must come up:**
- H1: "Check a post", paste the exact approved text, "Check"
- "Registered by JamJam"
- "Checked on Solana just now: the attestation exists, JamJam signed it, and it carries this fingerprint."
- Change one word, "Check": "Not an official post"

**Say:** Anyone can check it. I paste the post into the public Verify page. Registered by JamJam, checked on Solana just now. Change one word, and it's not an official post.

**Recording:** The result also says the brand name is self-declared (domain proof is next). Don't cover it; the VO stays true.

### Beat 09 · 2:40–2:50 · The public record

Route `/ledger (public)` · status BUILT · placeholder: wireframe Ledger

**Must come up:**
- H1: "Ledger"
- "Brand kits (1)": "JamJam · kit v1 · {date}" with hash and Explorer link
- "Posts (1)": "JamJam · post on kit v1 · {date}"

**Say:** The public ledger lists every registered kit and post, each with its transaction.

**Recording:** Record after the post is registered so both rows show.

### Beat 10 · 2:50–3:00 · What's next, then the line

Route `/grow (coming soon), then /` · status BUILT · placeholder: wireframe Grow-Home

**Must come up:**
- Grow: "Coming soon", "Run campaigns with ambassadors who write in your voice…"
- End card: JamJam, "Every post provably yours." jamjam.tech

**Say:** Distribution, ambassadors and analytics are next. JamJam: your brand team, in one app. Every post provably yours.

**Recording:** End on the landing page or a still end card.

## 3. What must work before recording (for the build sessions)

| Priority | Need | Why, and the check |
|---|---|---|
| P0 | AI model live | Every draft step returns 503 without `OPENROUTER_API_KEY` (`web/worker/llm.ts`); `aiConfigured` is not confirmed in STATE.md. Check `/api/health`. |
| P0 | Show the quote under each fact | Your links and "Where this came from" show only the claim text, so the core promise (a fact stays only with its quote) is not visible. The quote and page link are stored; render them. |
| P0 | Claims block rehearsed | Under Strict, adding "Used by 10,000 brands." must return "Blocked by your claims gate". The gate is an LLM call (`posts.ts` policyCheck); test it live first. |
| P0 | Facts count as owned | Website in Basics must match the ingested domain. Facts from other domains stay `proposed`, and no screen on main approves them (`PATCH /evidence/:id` exists, unused). |
| P1 | Drafter gets kept facts | The post prompt gets voice, messaging, positioning and purpose, not the evidence list (`posts.ts`), so a draft can carry a claim the gate then blocks. |
| P1 | Freeze main for the take | Open PRs #73, #75, #81 and #85 change these screens. Record before they merge, or re-check this script's quoted copy after. |

## 4. Recording runbook

- **Before:** run the whole path once off camera on jamjam.tech. Pre-answer the question steps; approve Gates 2 and 3 in that run. Sign in by the emailed link (sign-in by code is not exercised live).
- **During:** cut every wait: the page read (12 s timeout, `ingest.ts`), drafting (up to about a minute), registration (confirmation poll up to 45 s, `registry.ts`). Keep the approved post text exactly as registered, because Verify hashes the text.
- **Fallback:** the free model can answer "busy": wait and retry. If a registration outcome is unknown, use "Check registration". Keep a second full take.
- **After:** 3:00 or less, captions on, 1080p.

## 5. Every spoken word

**0:00** This is JamJam, live at jamjam.tech. In three minutes I'll build JamJam's own brand, write a post in its voice, and prove that post on Solana.

**0:12** I sign in with email. No password, no wallet.

**0:18** I name the brand and give it our site. JamJam reads the page and keeps a fact only if it can quote the line it came from.

**0:38** It asks short questions and shows what it already found. For voice I pick Candid founder, and I set the claims gate to strict: every claim needs evidence.

**0:55** The AI drafts our purpose, and shows where each line came from: my answers and quotes from the site. This is a decision gate. I approve it, and the approval is recorded. Positioning and voice work the same way.

**1:20** Three gates approved. I register kit v1. JamJam's Registrar signs it on Solana devnet. The fingerprint goes on-chain; the words stay private. Here is the transaction.

**1:40** Now a post. I ask for a LinkedIn launch post. It drafts in the approved voice and passes the slop check before I see it. Beautify formats it for LinkedIn. Now I add a claim we can't back: used by ten thousand brands. Approve. Blocked by my claims gate. I take it out, approve, and register the post.

**2:20** Anyone can check it. I paste the post into the public Verify page. Registered by JamJam, checked on Solana just now. Change one word, and it's not an official post.

**2:40** The public ledger lists every registered kit and post, each with its transaction.

**2:50** Distribution, ambassadors and analytics are next. JamJam: your brand team, in one app. Every post provably yours.
