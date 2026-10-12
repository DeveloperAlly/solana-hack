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

**Demo brand:** JamJam builds its own brand (compendium §4, decided). One critical path; every wait is cut, and the voice-over says so.

**Voice-over:** 262 words over 3:00, about 110 words a minute, leaving room for the screen.

## 1. Critical path

Each beat lists what it depends on (the must-haves in §3), not whether it works today: live status is only in STATE.md. Check it before recording.

| # | Time | Beat | Route | Depends on |
|---|---|---|---|---|
| 01 | 0:00–0:12 | Open on the live product | `/ (landing)` | NO DEPENDENCY |
| 02 | 0:12–0:18 | Email in, no wallet | `/sign-in` | EMAIL LINK |
| 03 | 0:18–0:38 | A fact stays only if it can be quoted | `/build/basics, then /build/sources` | P0: 009 · QUOTES |
| 04 | 0:38–0:55 | Short questions, a chosen voice, a strict gate | `/build/origin to /build/voice` | P0: 009 |
| 05 | 0:55–1:20 | The AI drafts; I decide | `/build/purpose (Gate 1)` | P0: AI MODEL |
| 06 | 1:20–1:40 | Kit v1 on Solana | `/build/kit` | DEVNET RPC |
| 07 | 1:40–2:20 | A post in our voice, and a claim it blocks | `/create` | P0: BLOCK TEST |
| 08 | 2:20–2:40 | Anyone can check it | `/verify (public)` | DEVNET RPC |
| 09 | 2:40–2:50 | The public record | `/ledger (public)` | AFTER BEATS 06-07 |
| 10 | 2:50–3:00 | What's next, then the line | `/grow (coming soon), then /` | NO DEPENDENCY |

## 2. Beats

Each beat: what must come up on screen (quoted app copy), what to say, and the recording note. Wireframe names refer to the [wireframes](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).

### Beat 01 · 0:00–0:12 · Open on the live product

Route `/ (landing)` · depends on NO DEPENDENCY · placeholder: wireframe Landing-v2

**Must come up:**
- H1: "Build your brand. Then start creating."
- Button: "Build my brand"
- Small print: "No wallet needed"
- Sample "Your brand kit" box: Purpose, Positioning, Voice

**Say:** This is JamJam, live at jamjam.tech. I'll build JamJam's own brand, write a post in its voice, and prove that post on Solana. Waits are cut.

**Recording:** Start the recording on the landing page, signed out. Cursor on Build my brand.

### Beat 02 · 0:12–0:18 · Email in, no wallet

Route `/sign-in` · depends on EMAIL LINK · placeholder: wireframe Onboard-1-SignIn

**Must come up:**
- H1: "Sign in to build your brand"
- "We email you a sign-in link. No password, no wallet."
- Cut: email link opened off camera
- Lands on /home: "Welcome to JamJam"

**Say:** I sign in with email. No password, no wallet.

**Recording:** Use the emailed link (proven live). Sign-in by code is not exercised live yet, so do not show the code field. Cut the inbox; allow 8 seconds.

### Beat 03 · 0:18–0:38 · A fact stays only if it can be quoted

Route `/build/basics, then /build/sources` · depends on P0: 009 · QUOTES · placeholder: wireframe J1-Read

**Must come up:**
- Basics: Brand name "JamJam", Website "jamjam.tech", "Save and continue"
- Your links: "Read this page" then "Reading the page…" (cut the wait)
- Alert: "Read it. {n} facts saved with quotes from the page."
- MUST: each fact shows its quote (whether this has shipped: STATE.md; if not, use the fallback)

**Say:** I give it our name and our website. It reads the site and pulls out what we actually say about ourselves, each fact with the line it came from.

**Recording:** P0 build: show the stored quote under each fact. Website in Basics must be jamjam.tech or the facts are treated as third-party. FALLBACK if quotes don't ship: hold on the alert 'Read it. {n} facts saved with quotes from the page.' and say: JamJam reads the page and saves only facts it can quote from it.

### Beat 04 · 0:38–0:55 · Short questions, a chosen voice, a strict gate

Route `/build/origin to /build/voice` · depends on P0: 009 · placeholder: wireframe BB-6-Voice

**Must come up:**
- Alert: "Already found on your pages" with up to 3 facts
- Cut: remaining questions pre-answered
- Voice template: "Candid founder" (default)
- Claims gate: "Strict: every claim needs evidence"

**Say:** A few quick questions, and it already knows half the answers. I pick a voice, Candid founder, and set it to strict: no claim goes out without proof.

**Recording:** Pre-answer Origin, Why/how/what, Alternatives and Audience before recording; show one question screen only.

### Beat 05 · 0:55–1:20 · The AI drafts; I decide

Route `/build/purpose (Gate 1)` · depends on P0: AI MODEL · placeholder: wireframe BB-Gate1-Purpose

**Must come up:**
- H1: "Gate 1: purpose"
- "Draft it for me" then "Drafting… this takes up to a minute" (cut)
- "Where this came from": "Your answer: …" and "Source: … (page link)"
- "Approve purpose" then alert "Approved": "Recorded {date, time}."
- Cut: Gates 2 and 3 already approved

**Say:** Now it drafts our purpose, and shows me exactly where it got it from. Nothing is invented. I approve it, and that decision is recorded. Positioning and voice work the same way.

**Recording:** Needs OPENROUTER_API_KEY live (aiConfigured unconfirmed in STATE.md). Free model can return 'busy': retry, keep the best take.

### Beat 06 · 1:20–1:40 · Kit v1 on Solana

Route `/build/kit` · depends on DEVNET RPC · placeholder: wireframe J5-Approve-Kit

**Must come up:**
- H1: "JamJam kit", "Gates approved: 3 of 3"
- "Register kit v1" then "Registering on Solana…" (cut, up to 45 s)
- Alert title "Kit v1: registered", body sha256:…
- "View the transaction on Solana Explorer" opens the devnet transaction

**Say:** That's our brand, approved. One click puts it on Solana: a fingerprint anyone can check, while the words stay private. Here's the transaction.

**Recording:** Explorer opens in a new tab (the app's external links always do). Cut to it, then cut back. Check the URL has cluster=devnet.

### Beat 07 · 1:40–2:20 · A post in our voice, and a claim it blocks

Route `/create` · depends on P0: BLOCK TEST · placeholder: wireframe Draft-Review

**Must come up:**
- "What is the post about?": JamJam launch · Channel: LinkedIn · "Draft a post"
- "LinkedIn · drafted", "Slop check: passed" (keep the camera off the self-graded voice score)
- "Beautify" then "Last change: beautify. Undo restores the previous text."
- Add "Used by 10,000 brands.", "Save edits", "Approve": "Blocked by your claims gate"
- Remove it, "Save edits", "Approve", "Copy text", "Register post", then "Registered"

**Say:** Now a post. I ask for a LinkedIn launch post, and it writes it in our voice, with the AI clichés already stripped out. Beautify makes it read well on LinkedIn. Now watch: I add a claim we can't back up, used by ten thousand brands. JamJam blocks it. I take it out, approve, register, and it's on Solana.

**Recording:** Rehearse the block off camera first: the claims gate is an LLM call, so confirm it blocks that sentence under Strict. Keep the approved text unchanged for Verify.

### Beat 08 · 2:20–2:40 · Anyone can check it

Route `/verify (public)` · depends on DEVNET RPC · placeholder: wireframe Verify-1-Match

**Must come up:**
- H1: "Check a post", paste the exact approved text, "Check"
- "Registered by JamJam"
- "Checked on Solana just now: the attestation exists, JamJam signed it, and it carries this fingerprint."
- Change one word, "Check": "Not an official post"

**Say:** Now anyone can check it. Paste the post into Verify: it's ours, confirmed on Solana. Change one word, and it's flagged as not official. That's how a fan spots a fake.

**Recording:** The result also says the brand name is self-declared (domain proof is next). Don't cover it; the VO stays true.

### Beat 09 · 2:40–2:50 · The public record

Route `/ledger (public)` · depends on AFTER BEATS 06-07 · placeholder: wireframe Ledger

**Must come up:**
- H1: "Ledger"
- "Brand kits (n)" includes "JamJam · kit v1 · {date}" with hash and Explorer link
- "Posts (n)" includes "JamJam · post on kit v1 · {date}" (rehearsal rows from the rehearsal brand may also show)

**Say:** And here's the public record of everything we've approved.

**Recording:** Record after the post is registered. Counts include the rehearsal brand; point at JamJam's rows.

### Beat 10 · 2:50–3:00 · What's next, then the line

Route `/grow (coming soon), then /` · depends on NO DEPENDENCY · placeholder: wireframe Grow-Home

**Must come up:**
- Grow: "Coming soon", "Run campaigns with ambassadors who write in your voice…"
- Edited end card (not app copy): JamJam, "Every post provably yours." jamjam.tech

**Say:** Next, publishing everywhere and ambassadors. JamJam: your brand team, in one app. Every post provably yours.

**Recording:** End on the landing page or a still end card.

## 3. What must work before recording (for the build sessions)

| Priority | Need | Why, and the check |
|---|---|---|
| P0 | Migration 009 applied | Build is broken live until `spec/db/009_evidence_trust.sql` (on main since [PR #63](https://github.com/DeveloperAlly/solana-hack/pull/63); this branch predates it) is applied: ingest on main writes `sources.kind` (`web/worker/api.ts`), which 009 creates ([CPO audit](https://github.com/DeveloperAlly/solana-hack/pull/94), 2026-10-13). Apply it, then run the full path once. |
| P0 | AI model live | Every draft step returns 503 without `OPENROUTER_API_KEY` (`web/worker/llm.ts`); `aiConfigured` is not confirmed in STATE.md. Check `/api/health`. |
| P0 | Show the quote under each fact | Render the stored quote under each fact in Your links and "Where this came from"; the core promise (a fact stays only with its quote) depends on it. Whether it has shipped is in STATE.md; check before recording. Fallback VO if it does not ship: "JamJam reads the page and saves only facts it can quote from it." |
| P0 | Claims block rehearsed | Under Strict, adding "Used by 10,000 brands." must return "Blocked by your claims gate". The gate is an LLM call (`posts.ts` policyCheck); test it live first. |
| P0 | Facts count as owned | Website in Basics must match the ingested domain. Facts from other domains stay `proposed`, and no screen on main approves them (`PATCH /evidence/:id` exists, unused). |
| P1 | Drafter gets kept facts | The post prompt gets voice, messaging, positioning and purpose, not the evidence list (`posts.ts`), so a draft can carry a claim the gate then blocks. |
| P1 | Freeze main for the take | Open PRs #73, #75, #81 and #85 change these screens. Record before they merge, or re-check this script's quoted copy after. |

## 4. Recording runbook

- **Gate:** rehearse the whole path once live on a separate rehearsal brand (a second sign-in), so JamJam's own kit is still v1 for the take; post the rehearsal's kit and post transactions on [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4) (STATE.md Next, item 3) before recording. The take then registers JamJam's kit v1 and first post; the Ledger also lists the rehearsal brand's rows.
- **Before:** pre-answer the question steps; approve Gates 2 and 3 in that run. Sign in by the emailed link (sign-in by code is not exercised live).
- **During:** cut every wait: the page read (12 s timeout, `ingest.ts`), drafting (up to about a minute), registration (confirmation poll up to 45 s, `registry.ts`). Keep the approved post text exactly as registered, because Verify hashes the text. Edited text hides Approve until "Save edits" is pressed. Explorer links open a new tab; cut to it and back.
- **Fallback:** the free model can answer "busy": wait and retry. If a registration outcome is unknown, use "Check registration". Keep a second full take.
- **After:** 3:00 or less, captions on, 1080p.

## 5. Every spoken word

**0:00** This is JamJam, live at jamjam.tech. I'll build JamJam's own brand, write a post in its voice, and prove that post on Solana. Waits are cut.

**0:12** I sign in with email. No password, no wallet.

**0:18** I give it our name and our website. It reads the site and pulls out what we actually say about ourselves, each fact with the line it came from.

**0:38** A few quick questions, and it already knows half the answers. I pick a voice, Candid founder, and set it to strict: no claim goes out without proof.

**0:55** Now it drafts our purpose, and shows me exactly where it got it from. Nothing is invented. I approve it, and that decision is recorded. Positioning and voice work the same way.

**1:20** That's our brand, approved. One click puts it on Solana: a fingerprint anyone can check, while the words stay private. Here's the transaction.

**1:40** Now a post. I ask for a LinkedIn launch post, and it writes it in our voice, with the AI clichés already stripped out. Beautify makes it read well on LinkedIn. Now watch: I add a claim we can't back up, used by ten thousand brands. JamJam blocks it. I take it out, approve, register, and it's on Solana.

**2:20** Now anyone can check it. Paste the post into Verify: it's ours, confirmed on Solana. Change one word, and it's flagged as not official. That's how a fan spots a fake.

**2:40** And here's the public record of everything we've approved.

**2:50** Next, publishing everywhere and ambassadors. JamJam: your brand team, in one app. Every post provably yours.
