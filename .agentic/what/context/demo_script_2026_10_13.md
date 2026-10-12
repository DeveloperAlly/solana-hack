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

**Voice-over:** 271 words over 3:00, about 110 words a minute, leaving room for the screen.

## 0. Who this is for

| Stakeholder | Role | What they need to see |
|---|---|---|
| Colosseum judges | Decide the win | A real product working on Solana, a real problem, and a founder who ships. |
| Founders and creators | The buyer | A brand team they can afford that sounds like them and never makes things up. |
| Fans, journalists, exchanges | Use Verify | A fast way to tell the real post from a fake. |
| Ally, recording | Presenter | What to click and what to say, beat by beat. |
| Build sessions | Make it work | Exactly what must work before the take. |

Every beat names who cares and why. A beat with no clear answer is cut: the Grow coming-soon screen is gone, and the Ledger is now the last line of the Verify beat.

## 1. Critical path

Each beat lists what it depends on (the must-haves in §3), not whether it works today: live status is only in STATE.md. Check it before recording.

| # | Time | Beat | Route | Depends on |
|---|---|---|---|---|
| 01 | 0:00–0:10 | Open on the live product | `/ (landing)` | NO DEPENDENCY |
| 02 | 0:10–0:16 | Email in, no wallet | `/sign-in` | EMAIL SIGN-IN |
| 03 | 0:16–0:36 | A fact stays only if it can be quoted | `/build/basics, then /build/sources` | P0: 009 · QUOTES |
| 04 | 0:36–0:52 | Short questions, a chosen voice, a strict gate | `/build/origin to /build/voice` | P0: 009 |
| 05 | 0:52–1:15 | The AI drafts; I decide | `/build/purpose (Gate 1)` | P0: AI MODEL |
| 06 | 1:15–1:35 | Kit v1 on Solana | `/build/kit` | DEVNET RPC |
| 07 | 1:35–2:20 | A post in our voice, and a claim it blocks | `/create` | P0: BLOCK TEST |
| 08 | 2:20–2:50 | Anyone can spot a fake | `/verify (public)` | DEVNET RPC |
| 09 | 2:50–3:00 | End on the promise | `end card (edited, not app copy)` | NO DEPENDENCY |

## 2. Beats

Each beat: what must come up on screen (quoted app copy), what to say, and the recording note. Wireframe names refer to the [wireframes](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).

### Beat 01 · 0:00–0:10 · Open on the live product

Route `/ (landing)` · depends on NO DEPENDENCY · placeholder: wireframe Landing-v2

**Must come up:**
- H1: "Build your voice. Launch your brand."
- Button: "Build my brand"
- Small print: "No wallet needed"
- Sample "Your brand kit" box: Purpose, Positioning, Voice

**Who cares, and why:** Judges, because they score working products over mock-ups, and this shows one in ten seconds.

**Say:** This is JamJam, live at jamjam.tech. I'll build JamJam's voice, launch its brand with a post, and prove that post on Solana. Waits are cut.

**Recording:** Start the recording on the landing page, signed out. Cursor on Build my brand.

### Beat 02 · 0:10–0:16 · Email in, no wallet

Route `/sign-in` · depends on EMAIL SIGN-IN · placeholder: wireframe Onboard-1-SignIn

**Must come up:**
- H1: "Sign in to launch your brand"
- "We email you a sign-in link. No password, no wallet."
- Cut: the sign-in email opened off camera
- Lands on /home: "Welcome to JamJam"

**Who cares, and why:** Judges, because only 13% of US adults find Web3 wallets intuitive, against 75% for payment apps ([Mercuryo and Protocol Theory survey](https://mercuryo.io/explore/learn/us-market-research), 2025), and this needs no wallet. Founders, because there is nothing to set up.

**Say:** I sign in with email. No password, no wallet.

**Recording:** Sign in with whichever method STATE.md shows as proven live (email link or code), and show only that one. Cut the inbox; allow 8 seconds.

### Beat 03 · 0:16–0:36 · A fact stays only if it can be quoted

Route `/build/basics, then /build/sources` · depends on P0: 009 · QUOTES · placeholder: wireframe J1-Read

**Must come up:**
- Basics: Brand name "JamJam", Website "jamjam.tech", "Save and continue"
- Your links: "Read this page" then "Reading the page…" (cut the wait)
- Alert: "Read it. {n} facts saved with quotes from the page."
- MUST: each fact shows its quote (whether this has shipped: STATE.md; if not, use the fallback)

**Who cares, and why:** Founders, because a blank page is the hardest part of branding and this skips it. Judges, because AI grounded in the brand's own words is what separates JamJam from every AI writer.

**Say:** I give it our name and our website. It reads the site and pulls out what we actually say about ourselves, each fact with the line it came from.

**Recording:** P0 build: show the stored quote under each fact. Website in Basics must be jamjam.tech or the facts are treated as third-party. FALLBACK if quotes don't ship: hold on the alert 'Read it. {n} facts saved with quotes from the page.' and say: JamJam reads the page and saves only facts it can quote from it.

### Beat 04 · 0:36–0:52 · Short questions, a chosen voice, a strict gate

Route `/build/origin to /build/voice` · depends on P0: 009 · placeholder: wireframe BB-6-Voice

**Must come up:**
- Alert: "Already found on your pages" with up to 3 facts
- Cut: remaining questions pre-answered
- Voice template: "Candid founder" (default)
- Claims gate: "Strict: every claim needs evidence"

**Who cares, and why:** Founders, because their fear with AI is sounding generic or saying something untrue, and this is where they rule out both.

**Say:** A few quick questions, and it already knows half the answers. I pick a voice, Candid founder, and set it to strict: no claim goes out without proof.

**Recording:** Pre-answer Origin, Why/how/what, Alternatives and Audience before recording; show one question screen only.

### Beat 05 · 0:52–1:15 · The AI drafts; I decide

Route `/build/purpose (Gate 1)` · depends on P0: AI MODEL · placeholder: wireframe BB-Gate1-Purpose

**Must come up:**
- H1: "Gate 1: purpose"
- "Draft it for me" then "Drafting… this takes up to a minute" (cut)
- "Where this came from": "Your answer: …" and "Source: … (page link)"
- "Approve purpose" then alert "Approved": "Recorded {date, time}."
- Cut: Gates 2 and 3 already approved

**Who cares, and why:** Founders, because they keep the final say and can see nothing was invented. Judges, because a person approving each step is what makes the proof mean something.

**Say:** Now it drafts our purpose, and shows me exactly where it got it from. Anything it had to guess is marked as a guess. I approve it, and that decision is recorded. Positioning and voice work the same way.

**Recording:** Needs OPENROUTER_API_KEY live (aiConfigured unconfirmed in STATE.md). Free model can return 'busy': retry, keep the best take.

### Beat 06 · 1:15–1:35 · Kit v1 on Solana

Route `/build/kit` · depends on DEVNET RPC · placeholder: wireframe J5-Approve-Kit

**Must come up:**
- H1: "JamJam kit", "Gates approved: 3 of 3"
- "Register kit v1" then "Registering on Solana…" (cut, up to 45 s)
- Alert title "Kit v1: registered", body sha256:…
- "View the transaction on Solana Explorer" opens the devnet transaction

**Who cares, and why:** Judges, because this is a real use of Solana, not a token bolted on. Founders, because their brand now sits on a record nobody can quietly change.

**Say:** That's our brand, approved. One click puts it on Solana: a fingerprint anyone can check, while the words stay private. Here's the transaction.

**Recording:** Explorer opens in a new tab (the app's external links always do). Cut to it, then cut back. Check the URL has cluster=devnet.

### Beat 07 · 1:35–2:20 · A post in our voice, and a claim it blocks

Route `/create` · depends on P0: BLOCK TEST · placeholder: wireframe Draft-Review

**Must come up:**
- "What is the post about?": JamJam launch · Channel: LinkedIn · "Draft a post"
- "LinkedIn · drafted", "Slop check: passed" (keep the camera off the self-graded voice score)
- "Beautify" then "Last change: beautify. Undo restores the previous text."
- Add "Used by 10,000 brands.", "Save edits", "Approve": "Blocked by your claims gate"
- Remove it, "Save edits", "Approve", "Copy text", "Register post", then "Registered"

**Who cares, and why:** Founders, because one false claim can sink a brand and JamJam stops it before it goes out. Judges, because they watch the AI being stopped from lying, live.

**Say:** Now a post. I ask for a LinkedIn launch post, and it writes it in our voice, with the AI clichés already stripped out. Beautify makes it read well on LinkedIn. Now watch: I add a claim we can't back up, used by ten thousand brands. JamJam blocks it. I take it out, approve, register, and it's on Solana.

**Recording:** Rehearse the block off camera first: the claims gate is an LLM call, so confirm it blocks that sentence under Strict. Keep the approved text unchanged for Verify.

### Beat 08 · 2:20–2:50 · Anyone can spot a fake

Route `/verify (public)` · depends on DEVNET RPC · placeholder: wireframe Verify-1-Match

**Must come up:**
- H1: "Check a post", paste the exact approved text, "Check"
- "Registered by JamJam"
- "Checked on Solana just now: the attestation exists, JamJam signed it, and it carries this fingerprint."
- Change one word, "Check": "Not an official post"
- Then /ledger: "Posts (n)" includes "JamJam · post on kit v1 · {date}"

**Who cares, and why:** Fans, journalists and exchanges, because fakes and scams cost billions and this lets anyone check a post themselves. Judges, because it is the payoff of putting proof on Solana.

**Say:** Now anyone can check it. Paste the post into Verify: it's the exact post we approved, confirmed on Solana. Change one word, and it's flagged as not official. That's how a fan spots a fake. And every post we register sits on a public record anyone can browse.

**Recording:** The result also says the brand name is self-declared (domain proof is next). Don't cover it; the VO stays true.

### Beat 09 · 2:50–3:00 · End on the promise

Route `end card (edited, not app copy)` · depends on NO DEPENDENCY · placeholder: wireframe Landing-v2

**Must come up:**
- End card: JamJam, "Every post provably yours.", jamjam.tech

**Who cares, and why:** Judges, because they score many demos and need one line to remember this one.

**Say:** JamJam: your brand team, in one app. Every post provably yours.

**Recording:** Hold the end card for the last line. Grow and other coming-soon screens are cut: no one watching gains anything from a screen that does nothing yet.

## 3. What must work before recording (for the build sessions)

| Priority | Need | Why, and the check |
|---|---|---|
| P0 | Migration 009 applied | Build is broken live until `spec/db/009_evidence_trust.sql` (on main since [PR #63](https://github.com/DeveloperAlly/solana-hack/pull/63); this branch predates it) is applied: ingest on main writes `sources.kind` (`web/worker/api.ts`), which 009 creates ([CPO audit](https://github.com/DeveloperAlly/solana-hack/pull/94), 2026-10-13). Apply it, then run the full path once. |
| P0 | AI model live | Every draft step returns 503 without `OPENROUTER_API_KEY` (`web/worker/llm.ts`); `aiConfigured` is not confirmed in STATE.md. Check `/api/health`. |
| P0 | Show the quote under each fact | Render the stored quote under each fact in Your links and "Where this came from"; the core promise (a fact stays only with its quote) depends on it. Whether it has shipped is in STATE.md; check before recording. Fallback VO if it does not ship: "JamJam reads the page and saves only facts it can quote from it." |
| P0 | Claims block rehearsed | Under Strict, adding "Used by 10,000 brands." must return "Blocked by your claims gate". The gate is an LLM call (`posts.ts` policyCheck); test it live first. |
| P0 | Facts count as owned | Website in Basics must match the ingested domain. Facts from other domains stay `proposed`, and no screen on main approves them (`PATCH /evidence/:id` exists, unused). |
| P1 | Drafter gets kept facts | The post prompt gets voice, messaging, positioning and purpose, not the evidence list (`posts.ts`), so a draft can carry a claim the gate then blocks. |
| P1 | Freeze main for the take | Before recording, check STATE.md for open PRs that change these screens. Record before they merge, or re-check this script's quoted copy after. |

## 4. Recording runbook

- **Gate:** rehearse the whole path once live on a separate rehearsal brand (a second sign-in), so JamJam's own kit is still v1 for the take; post the rehearsal's kit and post transactions on [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4) (STATE.md Next, item 3) before recording. The take then registers JamJam's kit v1 and first post; the Ledger also lists the rehearsal brand's rows.
- **Before:** pre-answer the question steps; approve Gates 2 and 3 in that run. Sign in by the method STATE.md shows as proven live (email link or code).
- **During:** cut every wait: the page read (12 s timeout, `ingest.ts`), drafting (up to about a minute), registration (confirmation poll up to 45 s, `registry.ts`). Keep the approved post text exactly as registered, because Verify hashes the text. Edited text hides Approve until "Save edits" is pressed. Explorer links open a new tab; cut to it and back.
- **Fallback:** the free model can answer "busy": wait and retry. If a registration outcome is unknown, use "Check registration". Keep a second full take.
- **After:** 3:00 or less, captions on, 1080p.

## 5. Every spoken word

**0:00** This is JamJam, live at jamjam.tech. I'll build JamJam's voice, launch its brand with a post, and prove that post on Solana. Waits are cut.

**0:10** I sign in with email. No password, no wallet.

**0:16** I give it our name and our website. It reads the site and pulls out what we actually say about ourselves, each fact with the line it came from.

**0:36** A few quick questions, and it already knows half the answers. I pick a voice, Candid founder, and set it to strict: no claim goes out without proof.

**0:52** Now it drafts our purpose, and shows me exactly where it got it from. Anything it had to guess is marked as a guess. I approve it, and that decision is recorded. Positioning and voice work the same way.

**1:15** That's our brand, approved. One click puts it on Solana: a fingerprint anyone can check, while the words stay private. Here's the transaction.

**1:35** Now a post. I ask for a LinkedIn launch post, and it writes it in our voice, with the AI clichés already stripped out. Beautify makes it read well on LinkedIn. Now watch: I add a claim we can't back up, used by ten thousand brands. JamJam blocks it. I take it out, approve, register, and it's on Solana.

**2:20** Now anyone can check it. Paste the post into Verify: it's the exact post we approved, confirmed on Solana. Change one word, and it's flagged as not official. That's how a fan spots a fake. And every post we register sits on a public record anyone can browse.

**2:50** JamJam: your brand team, in one app. Every post provably yours.
