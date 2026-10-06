---
type: mission
status: proposed
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [mission, ui, build, components, design-tokens, proof-driven-delivery]
---
> **Status: proposed.** Plan to build the Waterlily UI in React, slice by slice along the critical path, each slice proven on the deployed site. Live progress goes in [STATE.md](../../../STATE.md), not here.

# Mission: UI build

**Parent:** [hackathon submission](./mission_hackathon_submission.md), phase D (build). This is the **UI track of the build plan in [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4)**, which stays the canonical checklist and the tracking issue. Issue #4 owns the system side (agents, LLM gateway, connectors, registrar); this mission owns the screens and components those phases need.
**Approach:** [ADR-005](../../what/decisions/adr_005_ui_component_system.md) (proposed).
**Component list:** [component inventory](../../what/context/component_inventory.md) (proposed); §8 maps every screen to its components and its slice.
**Reference design:** the wireframe canvas ([links](../../what/context/links.md)). The canvas is the spec; a slice is built only from screens that are drawn and signed off.
**Deadline:** Oct 12, 11:59pm PT ([mission](./mission_hackathon_submission.md)). Waterlily's own kit v1 is due by Oct 9 ([STATE](../../../STATE.md)).

## 1. How the work runs
The method is proof-driven delivery: done means every requirement has a proof on the deployed site, not that code exists.
- **Timed chunks.** Every slice is split into chunks of 5 minutes or less. Each chunk names its visible output, pass criteria, maximum tool calls and fallback. The riskiest chunk goes first.
- **Real clock.** Each status message opens with `[T+mm:ss | chunk n/N: name | budget left mm:ss]`, computed from a real time source.
- **PASS or FAILED.** A chunk without its named output is FAILED, never "in progress". A chunk that hits its time or call limit stops, reports its exact state and proposes the next move.
- **Proof on the live site.** Each slice's done-when check (§4) runs against the deployed URL, with raw output and a timestamp posted to [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4).
- **Critical path first, in batches** (owner, 2026-10-06): batch A is S0–S4, batch B is S5–S6, batch C is S7–S8. The owner signs off each batch on the deployed site before the next batch starts.
- **Components are built when a screen first needs them** (owner, 2026-10-06), not as a library up front. The inventory is the checklist that keeps them DRY; each component's first slice is listed in [inventory §1b](../../what/context/component_inventory.md#1b-first-slice-per-component).
- **Sample data is always labelled** (R13). From S1 on, fixture values carry a `sample` flag in M7, and screens render flagged values in [brackets] or with a "Sample data" chip; S8 checks every route.
- **No durations without measurements.** Chunk timings come from measured S0 chunks. Dates below are deadlines from issue #4, not estimates.

## 2. Frozen requirements (owner's words)
Numbered, verbatim, with sources. The owner confirms this list is complete before S0 runs. Owner chat requests are recorded in [PR #5](https://github.com/DeveloperAlly/solana-hack/pull/5).

**From the owner (chat, 2026-10-06):**
| # | Requirement | Source |
|---|---|---|
| R1 | "Its essential you first break it down into repeatable, reusable DRY components." | Owner chat, PR #5 |
| R2 | "I want to see the full component items before we start building." | Owner chat, PR #5 (met by the [inventory](../../what/context/component_inventory.md)) |
| R3 | "It should be built in react." | Owner chat, PR #5 |
| R4 | "It should allow us to easily CREATE / CHANGE the style elements (eg colours etc.)" | Owner chat, PR #5 |
| R5 | "Landing page should be based on what the clearest value prop is -> build your brand and start creating content. Land -> build brand -> branding" | Owner chat, 2026-10-06 |
| R6 | "yes buld components as needed" | Owner chat, 2026-10-06 |
| R7 | "start on critical path screens first and do in batches" | Owner chat, 2026-10-06 |
| R8 | "all items should require human review" | Owner chat, 2026-10-06 ([ADR-003](../../what/decisions/adr_003_superhub_business_model.md) principle 1) |
| R9 | "all posts will be run through no-ai-slop skills before a human sees them." | Owner chat, 2026-10-06 ([ADR-003](../../what/decisions/adr_003_superhub_business_model.md) principle 2) |

**From the canvas rework brief (owner, 2026-10-06):**
| # | Requirement | Source |
|---|---|---|
| R10 | "Keep the existing look: ink-only greyscale, system-ui, the shared classes (.nav .box .btn .btn2 .chip .in .tbl), 44px touch targets, and real buttons, links and labels." | Canvas brief, Rules |
| R11 | "Keep the top nav: Home / Inbox / Brand / Create / Grow / Analytics / Ledger, plus the brand switcher." | Canvas brief, Rules |
| R12 | "The brand switcher lists: Waterlily, aDNA, film.fun, GamersLab." | Canvas brief, Rules |
| R13 | "Don't invent stats or claims. Put sample figures in [brackets] or mark them with a "Sample data" chip." | Canvas brief, Rules |
| R14 | "Brand Builder intake, about 15 minutes of owner time, with a progress indicator and skip / save and resume on every step" (6 steps, 3 gates, as listed in the brief) | Canvas brief, Add |
| R15 | "every hub screen needs empty, loading, success and error states" | Canvas brief, Add |
| R16 | "No active screen mentions licensing." | Canvas brief, Done when |
| R17 | "landing → sign in → intake 1–6 with gates → coverage map → kit v1 registered → new draft → polish → approve → verify" | Canvas brief, Done when (Play walkthrough) |

**From issue #4 (definition of done and acceptance):**
| # | Requirement | Source |
|---|---|---|
| R18 | "A new brand can go from intake to an approved kit v1 with a hash registered on Solana devnet, in **15 minutes of owner time or less**" | [Issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4), definition of done |
| R19 | "Waterlily's own kit v1 is built with the product, and one launch post goes through polish, approval, registration and verify." | Issue #4, definition of done |
| R20 | "A semi-established brand (film.fun) gets no question that its ingested sources already answer." | Issue #4, P2 acceptance |
| R21 | "Every polish action is reversible." | Issue #4, P4 acceptance |
| R22 | "Tokens are never exposed to the browser beyond the OAuth flow." | Issue #4, P5 acceptance |
| R23 | "Verify returns the correct result for one registered post and one altered post." / "Every transaction links to an explorer." | Issue #4, P6 acceptance |
| R24 | "The full demo story runs without manual database edits." | Issue #4, P7 acceptance |

**Non-functional (from the repo):**
| # | Requirement | Source |
|---|---|---|
| R25 | Deadline Oct 12, 11:59pm PT; Waterlily kit v1 by Oct 9 | [STATE](../../../STATE.md) |
| R26 | Sign in: "Email and a 6-digit code (Supabase OTP)." The embedded wallet is not available: "Phantom Connect isn't accepting new apps"; registrations are signed by the server Registrar and a wallet is linked only for payouts ([ADR-006](../../what/decisions/adr_006_wallet_identity_split.md)) | [Architecture §12.1](../../what/context/brand_builder_architecture.md#121-user-flow), step 0; [backend map §7](../../what/context/backend_map.md#7-architecture-gaps-and-decisions-needed) |
| R27 | "Only hashes and ids go onchain. Content stays offchain." Registration on Solana devnet | [Architecture §7](../../what/context/brand_builder_architecture.md#7-proof-layer-what-gets-registered-when), §12.1 step 7 |
| R28 | "Public-repo firewall. Never reference private repositories, private vaults, local paths, personal data or secrets." | [AGENTS.md](../../../AGENTS.md) rule 5 |
| R29 | "Demo content is SFW" | [ADR-003](../../what/decisions/adr_003_superhub_business_model.md) principle 6 |
| R30 | Hosting: "Cloudflare Workers on **waterlily.ai** (fallback waterlily.world)"; storage: "Supabase for the evidence, kit and voice tables" (both still to verify in P0) **Superseded 2026-10-06 for hosting:** the app runs on the apex of jamjam.tech ([owner answers](https://github.com/DeveloperAlly/solana-hack/issues/4#issuecomment-6014295120); deploy config `web/wrangler.jsonc` arrives with [PR #6](https://github.com/DeveloperAlly/solana-hack/pull/6)). Storage unchanged | [Issue #2](https://github.com/DeveloperAlly/solana-hack/issues/2) PRD v2.1; [architecture §12.4](../../what/context/brand_builder_architecture.md#124-infrastructure-open-settled-in-p0-and-p1-of-issue-4) |
| R31 | Default model is an OpenRouter free model, plus bring-your-own Claude or OpenAI key | Architecture §12.4; issue #4 P4 |

### Open questions (owner to resolve before the slice that needs them)
| # | Question | Conflict found | Needed by |
|---|---|---|---|
| Q1 | Where does the coverage map sit? | Architecture §12.1 puts it at step 4, before the interview; the canvas draws it after intake | S3 |
| Q2 | Is one paid quest in the demo, or are quests coming soon? | ADR-002 hackathon cut, compendium §4 and issue #4 P7 include one paid quest; ADR-003, the backlog and the canvas brief tag quests "coming soon" A paid quest reverses ADR-003's "coming soon" scope, so that choice is recorded as a proposed ADR-003 amendment and ratified before S7 uses it | S7 |
| Q3 | App framework | **Resolved 2026-10-06:** "Vite is fine" (owner chat). Vite + React SPA on Cloudflare, no vinext spike; recorded in [ADR-005](../../what/decisions/adr_005_ui_component_system.md) | Done |
| Q4 | Bring-your-own keys: browser only, or encrypted on the server? | Open decision in issue #4 P4 | S8 |
| Q5 | Where do live checks run, and who adds the credentials? | The agent workspace cannot reach Cloudflare, Supabase or Solana devnet ([raw output in issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4#issuecomment-6012997589)). Proposal: deploy and run Playwright checks from GitHub Actions; the owner adds the deploy and database secrets to the repo's Actions secrets. Which accounts and secrets exist is tracked in [STATE.md](../../../STATE.md) | S0 |
| Q6 | One walkthrough brand or two? | The canvas intake uses Waterlily and the hub screens use aDNA | S1 |
| Q7 | Can a slice pass on mock data while its issue #4 service is not live? | Slices S2–S7 depend on P4–P6 services, starting with P4 ingest in S2. Proposal: such a slice is marked **PASS (mock)** and re-proven on live data before its batch is signed off | S2 |
| Q8 | Where does the evidence file live? | The method asks for a dated evidence file in the repo; no evidence folder exists yet. Proposal: `.agentic/how/evidence/`, created in S0 | S0 |

## 3. Batches and canvas readiness
A batch starts only when its canvas screens are drawn and signed off; which are done is tracked in [STATE.md](../../../STATE.md).

| Batch | Slices | Deadline | Canvas screens needed | Canvas rework batch |
|---|---|---|---|---|
| A | S0–S4 | Oct 9 (kit v1) | Landing; sign in and domain; intake 1–6 and gates; ingest; coverage map; kit v1 and its failure; Brand-Build; export | 1, plus the landing |
| B | S5–S6 | Oct 10 | Voices; Draft-Review with polish; Settings: publishing; Verify; Ledger; Claims | 2–4 |
| C | S7–S8 | Oct 11 | Campaign v2; ambassadors; reply queue; Hub-Home; every coming soon, experimental and roadmap screen; states | 5 (states and tags); ambassador and campaign screens exist from earlier canvas pages |

## 4. Slices
Each slice is deployed, then its done-when check runs on the deployed URL. The components each slice builds first are listed once, in [inventory §1b](../../what/context/component_inventory.md#1b-first-slice-per-component).

| Slice | Screens (canvas names) | Done when (on the deployed site) | Depends on |
|---|---|---|---|
| **S0 Preflight** (riskiest first) | none | (1) a blank app is deployed and loads from a GitHub Actions Playwright run; (2) email sign-in with a 6-digit code works, in a browser with no wallet extension installed, and no seed or recovery phrase is shown at any step (R26); the devnet registration in (3) is signed by the server Registrar ([ADR-006](../../what/decisions/adr_006_wallet_identity_split.md)); (3) the G-SAS spike runs first and selects SAS or the memo fallback ([backend map §7](../../what/context/backend_map.md#7-architecture-gaps-and-decisions-needed)); one devnet registration is then written through the selected registry (a SAS attestation if SAS is selected, a memo only if the fallback is) and its explorer link resolves; (4) changing one token value changes the page; (5) the app builds and deploys with Vite (Q3) | Q5 deploy and database secrets; a funded devnet Registrar key in the platform secret store; Q8; deploy and database credentials from the owner |
| **S1 Land and sign in** | Main; Onboard-1-SignIn; Onboard-2-Domain; Onboard-2b-DomainFailed | "Build my brand" reaches intake step 1; skipping the domain shows the Unverified flag; a wrong code shows its error | S0 |
| **S2 Basics and ingest** | BB-1-Basics; Onboard-3-Sources; Onboard-3b-Profiling; Ingest-Error | Basics survive a reload; one real URL is read with progress per source; a failing URL shows Retry and Skip | S1; issue #4 P4 ingest (else PASS (mock), Q7) |
| **S3 Interview, gates, coverage** | BB-2 to BB-6; BB-Gate1/2/3; Coverage-Map | Every step can be skipped and resumed; each gate records who, when and why; the coverage map shows E / I / M per section, with sources; a film.fun run (its public site ingested) gets no interview question for a section its sources marked Evidenced (R20) | S2; issue #4 P4 drafters; Q1 |
| **S4 Kit v1** | Onboard-6-Published; Kit-RegisterFailed; Brand-Build; Kit-Export | **Waterlily's kit v1 is approved, its hash is registered on devnet, the explorer link resolves, and the aDNA zip downloads; owner time from intake step 1 to registration is measured end to end (active time on screen, excluding waits for ingest and drafting) and is 15 minutes or less** (R18); the decoded devnet transaction contains only the hash, version and ids, and no kit text (R27) | S3; issue #4 P6 registrar |
| **S5 Create** | Voice-Templates; Voice-Editor; Draft-Review; Content-Dashboard / Empty | Waterlily's launch post, drafted from the Waterlily kit v1 registered in S4, is written in a voice, passes the slop check, shows voice-fit and platform scores, and every polish action undoes (R21, R19); a Playwright check shows the draft text is not rendered on Draft-Review, Content-Dashboard or any other route until the slop check has completed, and a failing check keeps it hidden (R9, cross-cutting) | Batch A signed off; canvas batch 2; issue #4 P3, P4 |
| **S6 Prove** | Settings: publishing; Verify-1/2/3; Ledger; Claims / Empty; official registry | Waterlily's approved launch post from S5 is published or pasted back by URL and its hash registered against the S4 kit version; Verify says official for it and flags an edited copy (R19, R23); the ledger groups registrations by type; the decoded content-registration transaction contains only the hash, kit version and ids, and no post text; one approved claim is registered from Claims, a pending and an expired claim cannot be registered (no usable action, API refused, no chain request), and its decoded transaction likewise holds only hashes and ids, with no claim or evidence text (R27). **Approval proof (R8):** a draft that has not been approved cannot be published: the publish and send actions are absent or disabled for it in the UI, and a direct API call to publish it is refused with no connector request made. **Security proof (R22):** on the deployed site, after connecting each configured provider in turn (X and LinkedIn), a Playwright check finds no OAuth access or refresh token in localStorage, sessionStorage, the full Playwright cookie jar (HttpOnly cookies included), the shipped bundle or any API response the browser receives; a request with a revoked connection is refused | S5; canvas batches 3–4; issue #4 P5, P6 |
| **S7 Grow** | Campaign v2 steps; Dashboard (Ambassadors) / Empty; Amb-*; M-*; Engage-Queue; Hub-Home | A campaign is created through all six Campaign v2 steps, saved after each step, and launched; one ambassador post on it, generated on Amb-3-Generate, is not rendered until its slop check has completed (and stays hidden if the check fails, R9), then is approved on the Dashboard before any post-on-behalf publish (an unapproved ambassador post cannot reach the connector: R8, cross-cutting), then is verified and paid in USDC on devnet, with an explorer link; the reply queue approves one reply, and an unapproved reply has no usable send action in the UI and a direct API call to send it is refused with no connector request made (R8). **If Q2 includes a paid quest:** the Quests screen (D53, paid variant) moves into S7 and one quest (a tutorial about Waterlily) is approved and paid in USDC on devnet; otherwise Quests stays a COMING SOON screen in S8 | Batch B signed off; Campaign v2 steps 2, 4, 5 and 6 drawn and signed off in canvas batch 5; Q2; issue #4 P6 payout |
| **S8 Everything else** | Inbox-*; Engage-Rules; Partners; Leads; Influencer-*; Analytics / Empty; Quests; Settings: AI model, plan and seats; every remaining state | Every canvas page renders with its tag and four states (R15); no active screen mentions licensing (R16); a recorded SFW review of every demo fixture and every post, reply and quest text generated during the batch proofs, each run through the content-policy check (D3) with zero failures, is posted to issue #4 (R29); every figure that comes from fixtures renders in [brackets] or next to a "Sample data" chip, checked by a Playwright scan of every route that flags any fixture value shown bare (R13); a theme change is one file edit (R4) | Canvas batch 5; Q4 |

**Cross-cutting proofs.** These apply to every path of the given kind, not only the example named in a slice row. Each slice that adds such a path adds that path to the check, and the slice does not pass until it does.
| Rule | Applies to | Proof on the deployed site |
|---|---|---|
| R8 human approval | Every publish, send, post-on-behalf and register path: posts, replies, ambassador posts, outreach, claims, quests | For an item that is not approved (draft, pending, expired), the UI shows no usable action, a direct API call is refused, and no connector or chain request is made |
| R9 slop check first | Every generated text: drafts, replies, ambassador posts, influencer posts | The text is absent from every user-visible route (review screens, dashboards, queues, lists) until its slop check has passed, and stays absent if it fails |
| R22 tokens stay server-side | Every configured OAuth connector (X and LinkedIn each tested separately) | No access or refresh token in localStorage, sessionStorage, the full cookie jar (HttpOnly included), the bundle or any API response; a revoked connection is refused |
| R27 only hashes onchain | Every registration type (identity, account, kit, claim, content, persona) | The decoded transaction holds only hashes, versions and ids, with no source text |
| R13 sample data labelled | Every route | Fixture values render in [brackets] or with a "Sample data" chip |

**Critical-path proof (end of batch B):** the R17 walkthrough runs on the deployed site from landing to verify, recorded by an Actions Playwright run. It starts from a declared clean state (a new account and a brand with no records), and the run asserts that every record it needs (brand, sources, evidence, decisions, kit version, registration, post, content registration) was created by the walkthrough itself, with no seeding or manual database edits (R24).

## 5. Component definition of done
Built in the slice where a screen first needs it, in the same change:
1. Uses semantic tokens only (CI check).
2. Has a workbench entry at `/system` with every variant and state it supports so far.
3. Keyboard operable, visible focus, labelled; axe reports 0 violations.
4. Typed props; one render test per variant, plus one interaction test if interactive.
5. A later slice that needs a new variant adds it as a prop, never a copy ([inventory §10](../../what/context/component_inventory.md#10-dry-rules)).

## 6. Proposed code layout
```
web/
  src/
    tokens/        primitives.json, semantic.json, themes/*.json, build output (CSS variables, TS names)
    ui/
      primitives/  P*
      composites/  C*
      shells/      L*
      domain/      D*, grouped by area (approval, brand, voices, campaigns, proof, inbox, experimental, analytics)
    config/        M1–M5
    data/          M6 types, M7 adapters (mock, live), fixtures
    lib/           M8 formatters
    screens/       one folder per area; composition only, no stylesheets
    system/        workbench and theme editor (/system)
```

## 7. Success metrics
| Metric | Target | How measured |
|---|---|---|
| Critical path | R17 walkthrough passes on the deployed site | Actions Playwright run, end of batch B |
| Kit v1 | Waterlily kit v1 registered on devnet by Oct 9 | Explorer link in issue #4 |
| Change a colour | 1 edit in one token file | Workbench theme editor, S0 and S8 |
| Raw style values outside `tokens/` | 0 | CI check |
| Stylesheets in `screens/` | 0 | CI check |
| Contrast | Text 4.5:1; large text and UI components 3:1 ([WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum), [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)) | Workbench and CI |
| Accessibility | 0 axe violations on every built screen | CI |
| Licensing | 0 active screens mention licensing | Text check in CI |
| Mock to live | 0 screen edits when a live adapter replaces a mock | Diff of `screens/` |
| Deployed equals repo | Deployed bundle hash matches the build from the merged commit | Check after each deploy |
