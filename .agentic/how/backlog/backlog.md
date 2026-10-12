---
type: backlog
status: active
created: 2026-10-06
updated: 2026-10-12
last_edited_by: agent
tags: [backlog, product-map, component-inventory]
---
> **Status: active. This file is the one list of every JamJam component.** It replaces the 21-row product map that stood here (every one of those rows is kept below, with its old tag). It gathers, in one place, components that were decided in separate docs and issues: [compendium §5](../../what/context/compendium_2026_10_06.md#5-product-map-decided-structure-tags-drive-the-build), [ADR-003](../../what/decisions/adr_003_superhub_business_model.md), the [Brand Builder architecture](../../what/context/brand_builder_architecture.md), the [backend map](../../what/context/backend_map.md) and [`spec/api/`](../../../spec/api/README.md), PRD [#2](https://github.com/DeveloperAlly/solana-hack/issues/2), master list [#38](https://github.com/DeveloperAlly/solana-hack/issues/38) and its slices (#31 to #39), [research 10](../../what/context/research/10_competitor_onboarding_pricing.md) N1 to N14, the code on main (9da167b), and the owner's prior content-platform design ("prior platform design" below: private notes, not linked under the public-repo rule in AGENTS.md). Rows tagged **accepted 2026-10-12** were new in this pass and were accepted by the owner that day ([ADR-010](../../what/decisions/adr_010_component_list_and_plan_tiers.md)). Nothing here changes a decision; where two sources disagree, both are named.

# Backlog: every component

## How to read this

**Status** (what is true on main today, checked 2026-10-12):
- **live:** shown working on jamjam.tech with evidence linked in [STATE.md](../../../STATE.md).
- **built:** code on main with tests, not yet shown working end to end on the live app (STATE: 0 brands, kits and posts so far).
- **partial:** some of it is built; the row says what is missing.
- **spec:** designed in a doc or stub, no code.
- **accepted 2026-10-12** (in the Tag column): new in this pass and accepted by the owner on 2026-10-12.

**Tag** (the build tag from compendium §5, unchanged): hackathon, hackathon (thin), coming soon, experimental, roadmap.

**Sources added 2026-10-12:** media evidence is [research 11](../../what/context/research/11_media_formats.md) (formats, competitor media, platform AI rules) and [research 11 detail](../../what/context/research/11_media_detail/generation_stack.md) (generation stack, licences, evaluation, provenance). Component design, the voice ladder and the evaluation harness are in [architecture §6.1, §6.2, §7.1 and §13](../../what/context/brand_builder_architecture.md); providers, models, packaging and settings are in [backend map §10](../../what/context/backend_map.md). Those moved from the Claude doc "JamJam delivery plan", which now points here. "Owner, session" means said in a working session, with no public record.

**Plan** ([ADR-010](../../what/decisions/adr_010_component_list_and_plan_tiers.md), prices still blank; for launch as a paid product; research 10 §3 has the competitor prices, e.g. Pressmaster Starter $29/user/mo): **Free** (build the kit, Verify), **Solo** (one brand, Run and Prove), **Team** (seats, approvals by role, ambassadors), **Add-on** (paid by use: video, avatars, paid X posting).

## 1. The bar a paying user has to clear (accepted 2026-10-12)

A user who hits friction in onboarding leaves; a user whose first posts are not usable does not pay. These are the launch checks. Each is measured, not asserted.

| # | Check | Target | Where it is already set |
|---|---|---|---|
| U1 | Time from sign-in to an approved kit v1, for a brand with a website | under 5 minutes of owner time | #34 acceptance |
| U2 | Interview fields prefilled from the brand's own sources | at least 70% for a brand with a site | #34 acceptance |
| U3 | Invented facts in the kit | 0 on the fixture set; every fact carries a quote that passes the check | #31, #34; architecture §1 |
| U4 | First drafts publishable without edit | at least 50% | prior platform design |
| U5 | Owner time to approve one post | under 60 seconds | prior platform design|
| U6 | Blind voice test: the owner cannot reliably tell drafts from her own posts | pass | prior platform design|
| U7 | Claims that reach a published post without evidence | 0 | ADR-003 claims gate; prior platform design |
| U8 | Formats offered beyond text | carousel, image card, short video, at launch | §6 below; [research 11](../../what/context/research/11_media_formats.md) |
| U9 | Steps from "I want to pay" to paid | one page, no sales call | G-BILLING; research 10 N12 to N14 |
| U10 | Wallet or seed phrase needed to use any core feature | never | ADR-006 |
| U11 | First-run usability: 5 people try onboarding unaided | at least 4 of 5 finish | architecture §6.1 |

## 2. Onboarding and account

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| A1 | Email sign-in (link and code) | No password, no wallet | partial: link sign-in live; code path built (accepts 6 to 10 digits since #27), not yet exercised live | hackathon | Free | Supabase Auth, Resend SMTP | Code sign-in proven live | ADR-006, STATE blockers |
| A2 | Landing, How it works | One value prop, "build your brand, then start creating" | built | hackathon | Free | | Playwright and axe pass (they do) | R5, `Landing.tsx` |
| A3a | Hub Home: next action; kit, gates, sections and evidence status | Knows where the brand stands | built (`hub/Home.tsx`) | hackathon | Free | | | component inventory §8 |
| A3b | Brand switcher (several brands per account) | Agencies and founders with two brands | spec (code uses the first brand only: `useBrand.ts`, `Build.tsx`, `Create.tsx`) | | Solo | | | component inventory D48; mission R11, R12 |
| A3c | Linked founder profile: its own kit, a shared story bank with the company, founder-profile ingest, perception audit | Founder and company brands that stay consistent | spec (proposed in architecture §12.1 step 2a, awaiting owner) | | Solo | | | architecture §3, §12.1 step 2a; ADR-002; research 01 §5 |
| A3 | Hub shell and nav (Home, Brand, Create, Grow, Inbox, Analytics, Ledger, Settings) | One place for everything; honest "coming soon" tags | built | hackathon | Free | `config/routes.ts` drives nav | | `routes.ts`, #15 |
| A4 | Post-kit setup checklist (connect channel, first post, invite partner) | Knows the next step after the kit | spec | accepted 2026-10-12 | Free | | Shown on Home after kit v1 | research 10 N3 |
| A5 | Readiness score for the brand profile | Sees how complete the brand is | spec | | Free | Coverage map data (B4) | | #37 |
| A6 | Team seats and roles (owner, approver, editor, partner, ambassador) | Others can help without owning the brand | spec | roadmap | Team | `memberships` table in `spec/api/schema.sql` | Role checks on every route | ADR-003, `requireRole` stub |
| A7 | Shareable no-login interview links | A co-founder or customer adds stories and evidence | spec | accepted 2026-10-12 | Solo | | | research 10 N1 |

## 3. Brand: Build your brand

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| B1 | Basics intake (name, type, description, goal, channel, links) | 2-minute start | built | hackathon | Free | | Brand type saved on edit; channel as a fixed select | architecture §5, #37 |
| B2 | Start from what you have: site plus subpages, links, paste, PDF, DOCX | Does not have to retype what exists | partial: single URL ingest built (`ingest.ts`); the rest is #33 | hackathon | Free | Exa contents; Workers AI `toMarkdown` for PDF and DOCX; one adapter per source type | adna.network and a sample PDF end to end | #33, G-INGEST-1 |
| B2a | Reading sources: progress per source, Retry or Skip, safe to leave, email when done | Never stuck watching a spinner | spec | hackathon | Free | Workflow engine (X4); Resend | | architecture §12.1 step 3 |
| B3a | Conflict queue: facts from different sources that contradict go to the owner; the system never picks | No silent wrong facts | spec | accepted 2026-10-12 | Free | | | prior platform design|
| B3 | Evidence store with quote check | Every fact traceable to a quote on its source | built (`quote.ts`, `sources.source_text`, migration 008) | hackathon | Free | Shared normaliser | 0 invented facts on fixtures | #31, architecture §3 |
| B4 | Coverage map (Evidenced, Inferred, Missing per section) | "Here is what we found, N questions left" | spec | hackathon | Free | | All 17 sections shown | architecture §12.1 step 4; research 10 B3 (open market gap) |
| B5 | Prefill the interview from evidence | Confirms instead of answering | spec | hackathon | Free | | U1, U2, U3 | #34 |
| B6 | Guided interview (gaps only), skippable and resumable | Only asked what is missing | partial: 6 steps built (`kit.ts` STEPS); gap-only logic is B5 | hackathon | Free | | | architecture §4, §5 |
| B7 | Web research on the brand and competitors | Three competitor candidates with sources at positioning | spec | hackathon | Free | Exa adapter (`searchWeb` stub) | Web facts labelled apart from owned facts; cost per brand recorded | #35 |
| B8 | Section drafters plus critic | Drafts with citations | partial: 6 of 17 sections drafted (origin, purpose, positioning, audience, voice, messaging) | hackathon | Free | LLM gateway (P1) | 17 of 17 drafted or deliberately deferred | `kit.ts` SECTIONS, architecture §4 |
| B8a | Quick review: beliefs, values card sort, messaging pillars, vocabulary drafted for fast edits | The rest of the kit without a long interview | spec | hackathon | Free | | | architecture §12.1 step 6; wireframe audit #15 |
| B9 | Three decision gates (purpose, positioning, voice) | The owner decides the brand; AI proposes | built | hackathon | Free | | | architecture §2 step 7; owner rule: brand authorship is the owner's |
| B10 | Kit v1, canonical hash, versioning | A fixed brand record | built (`canonical()`, kits table); rename marks sections stale in open PR #41 | hackathon | Free | | | #31, #40, #41 |
| B11 | Per-field "polish with AI" | Fix one field without redoing the step | spec | | Solo | Prompt library (P3) | Prompts tested on fixtures first | #37 |
| B12 | Voice input for the interview (speech to text) | Talks instead of types; competitors interview by voice | spec | coming soon | Solo | Workers AI Whisper ($0.0005/min, research 11 detail); faster-whisper on a self-hosted runner | | G-VOICE-INPUT; research 10 (Pressmaster, Supergrow voice interviews) |
| B13 | Connected history import: X archive, LinkedIn export, parsed in the browser | Voice learned from real posts; personal data never leaves the browser | spec | coming soon | Solo | | | #37, architecture §12.1 step 2 |
| B14 | PPTX parsing | Decks count as sources | spec | | Solo | | | #37 |
| B15 | Domain verification by DNS TXT | Unverified brands are flagged | spec | | Free | `lookupTxt` stub | | architecture §12.1 step 2, `WL-KIT.domain_verified` |
| B16 | Validation loop (interviews, post performance feed the kit) | The kit gets better from results | spec | coming soon | Solo | Analytics (§9) | | architecture §2 step 9; prior platform design |
| B17 | aDNA export of the kit | Kit usable by any agent or tool | partial: one Markdown file download built (`hub/Brand.tsx`); zip per section not built | hackathon (thin) | Free | | | architecture §8, G-ZIP |

## 4. Brand: kit content (the 17 sections)

Built today: 6 (origin, purpose, positioning, audience, voice, messaging). Specified in [architecture §4](../../what/context/brand_builder_architecture.md#4-input-spec-per-brand-kit-section): identity, purpose, beliefs, values (card sort), positioning, value props, audience, messaging, voice attributes, tone presets, vocabulary, claims, **visual kit (13)**, **audio kit (14)**, behaviour scenarios, examples (on and off brand), governance. Done when 17 of 17 are drafted or shown as deferred with a reason.

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| K1 | Visual kit: logo, colours, type, read from the site's CSS and OG images | Every image and slide is on brand without a designer | spec | coming soon | Solo | Brand tokens feed the renderer (M1) | Colours and fonts extracted from the brand's own site | architecture §4 row 13; research 11 and its detail |
| K2 | Audio kit: sonic logo, voice persona | Audio and video sound like the brand | spec | coming soon | Add-on | | | architecture §4 row 14 |
| K4 | Boilerplate: bios, elevator pitch, media kit | Ready answers for every profile and press ask | spec | accepted 2026-10-12 | Solo | | | prior platform design; research 01 step 8 |
| K5 | Proof assets: case studies (template) and testimonials | Evidence a buyer believes | spec | accepted 2026-10-12 | Solo | | | prior platform design|
| K6 | Drift score against the kit baseline | Sees when posts wander off brand | spec | | Solo | | | research 02 §5 item 7, §6 item 17 |
| K7 | Pillars: every post tagged to one pillar, ideas bound to pillars, cadence ramp per channel | A balanced mix, not random posts | spec | accepted 2026-10-12 | Solo | | | prior platform design|
| K3 | Channel specs with slot templates and reject rules | LinkedIn and X posts are not the same text | partial: X weighted 280-character limit enforced (`posts.ts` `xWeightedLength`); other specs not built | accepted 2026-10-12 | Solo | Research 03; prior platform design| One spec per channel; a draft breaking a reject rule is refused | prior platform design|

## 5. Voices, claims and gates

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| V1 | Voice templates (proof-of-concept rung of the voice ladder): 12 templates on 9 dimensions (8 dials plus claims strictness, which works as a gate; research 06), per-channel overrides; adopt open-source template sets where licence and format fit, author only the gaps | Picks a voice, sets dials, sets claims level | partial: 12 templates, 8 dials and claims level (the 9 dimensions) and one optional sample built (#17); per-channel overrides not built | hackathon | Free | AIWG voice-framework (MIT): profile format and 5 seed templates; Grain (MIT): graded prompt directives and channel overrides; Vale rule packs (MIT) and 18F/GOV.UK rules for linting. Author the other 7 templates and every humour, emoji, CTA and claims value | | research 06 (reusable template sources, 2026-10-12); ADR-010 |
| V2 | Several voices per kit; voice editor with preview | Founder voice and brand voice side by side | spec | | Solo | `voices` table, `POST /voices/:id/preview` stub | | compendium §6, backend map |
| V1a | Voice by example: pick 1 of 3 paragraphs, twice, then 3 sliders | Chooses by reading, not by adjectives | spec (no slice yet) | hackathon | Free | | | architecture §5 step 6; #4 P2, P3 |
| V1b | Template mixing per post (e.g. 70/30) | Blends two voices | spec | accepted 2026-10-12 | Solo | Port of AIWG `voice_blender.py` (MIT) | | research 06 gaps |
| V3 | Content-policy check on every approval (sexual content and minors blocked for all; explicit language blocked for Flirty) | Safe output by default | built as an LLM check (`posts.ts` CATEGORIES, `policyCheck`); a dedicated classifier is still open | | Solo | | | G-SAFETY |
| V4 | Voice pack (ladder rung 1) from the brand's own authored samples, each with a source path | Voice comes from real writing, not a template guess | spec | accepted 2026-10-12 | Solo | Import (B13) supplies samples; quote check (B3) proves each one; AIWG voice analyser and coroboros `measure_corpus.py` (MIT) to measure the corpus | Every sample resolves verbatim to its source; owner confirms before drafts use it | prior platform design|
| V5 | Voice fine-tune (LoRA) as an opt-in upgrade, only if the eval shows it beats the voice pack | Higher voice fidelity for brands with a large corpus | spec | accepted 2026-10-12 | Add-on | Self-hosted or hosted training; open trainers, no custom trainer | Blind test beats V4 on the same fixtures | architecture §6.2 |
| C1 | Claims with evidence, owner and expiry | Nothing unprovable gets posted | partial: claims strictness levels and per-post policy check built (`policyCheck`); claim table, owner and expiry not built | hackathon (thin) | Solo | | U7 | compendium §5, `posts.ts` |
| C2 | Strict claims level with its own prompt | Strict means strict | spec | | Solo | | | #37 |
| C3 | Auto-inserted, locked disclosure on sponsored posts | Compliance without remembering | spec | roadmap | Team | | | PRD #2 |
| G1 | No-AI-slop pass on every draft | Drafts do not read as AI | built (`SLOP_RULES`, `slopCheck`) | hackathon | Free | Align with `no-ai-slop` (petergyang upstream, licence UNVERIFIED) and the R1 to R13 `lint-voice` rules, one list | Gate seen refusing a real bad draft | ADR-003; prior platform design |
| G2 | Gates are refusals, not warnings: claim resolves to evidence, authored by the brand, in scope, surface voice, does not contradict purpose or values (brand gate) | The machine refuses what the owner would refuse, and names why | partial: slop and claims checks built; brand gate (contradicts purpose, values, promise) not built; content-policy check is V3 | | Solo | | Each gate seen refusing a real draft | prior platform design |
| G3 | Human approval on every post | Nothing goes out unseen | built (`approvePost`) | hackathon | Free | | U5 | ADR-003 principle 1, R8 |
| G4 | Independent review: a different model family, fresh context, verdict computed from findings | Checks that do not grade their own work | spec | accepted 2026-10-12 | Solo | an existing independent reviewer agent pattern | | prior platform design |

## 6. Create: text and media

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| T1 | Brief to draft in the brand voice, with voice-fit and platform scores | A first post in a minute | partial: drafting built (`draftPost`); scores come from the same model call that writes the draft | hackathon | Free | | U4 | architecture §12.1 step 9 |
| T1a | Measured voice-fit and platform scorers (research 06 metrics, research 03 checklist), and claims shown on the draft before approval | Scores that mean something; sees each claim's evidence | spec | accepted 2026-10-12 | Solo | Eval harness (X12) | Scorer agrees with owner ratings | research 10 §10.5 (b), (c) |
| T1b | Learned rules from edits: each edit becomes a readable rule the brand can keep or delete, retrieved on the next draft; best of 3 candidates per draft | Fewer edits over time; sees why drafts change | spec | accepted 2026-10-12 | Solo | CIPHER method | Edit distance falls over a brand's first 20 posts | architecture §6.1, §6.2 |
| T2 | Polish actions: Review, Shorten, Clarify, Beautify, Beautify accessible, with undo | Fixes a draft in one click | built (`polishPost`, `undoPost`) | hackathon | Free | | | #16, architecture §6 |
| T3 | Edit limits and messages (4,000 characters, source flag on undo) | Clear errors | spec | | Free | | | #37 |
| T4 | Campaign builder v2 (platforms, purpose, metrics, plan; 6 steps) | A plan, not one post | spec | hackathon | Solo | `POST /campaigns`, `/plan` stubs | | compendium §5 |
| T5 | Content dashboard (posted, replies, awaiting approval, scheduled, per-platform score) | One view of everything in flight | spec | hackathon | Solo | | | compendium §5 |
| T6 | Long-form: blog, tutorial, docs | Developer brands' best format (68% learn from docs, research 11) | spec | | Solo | `blog-harness` skill pattern | | PRD #2 hero format; research 11 |
| T7 | Repurpose one long piece into channel posts | One idea, many posts | spec | accepted 2026-10-12 | Solo |  | | prior platform design |
| T8 | Thesis pipeline: research, discourse sweep, value points, drafts, blog outline, adversarial review | Thought leadership with evidence behind it | spec | accepted 2026-10-12 | Solo | the owner's existing thesis workflow, formalised once | One idea run end to end | prior platform design|
| T9 | Idea backlog | Never starts from a blank page | spec | accepted 2026-10-12 | Solo | Import from Notion boards where they exist | | prior platform design|
| T10 | Weekly 10-minute "jam" that produces a set number of approved posts | A habit, not a chore | spec | accepted 2026-10-12 | Solo | | | research 10 N2 |
| M1 | Template renderer: carousels (PDF for LinkedIn, image sets elsewhere), image cards (stat, quote, code, screenshot, diagram), OG images | The best-performing format (LinkedIn documents ~21.8% median engagement, research 11), on brand by construction | spec | accepted 2026-10-12 | Solo | Satori and resvg (`cf-workers-og`) in the Worker; Browser Run fallback; the owner's existing 1080x1350 portrait renderer and social tiles as a starting template | Text, contrast (4.5:1) and colour (ΔE00) checks pass by construction | research 11 and its detail; prior platform design |
| M2 | Diagrams | Explainers developer audiences trust | spec | accepted 2026-10-12 | Solo | Mermaid, D2, Graphviz renderers (in-Worker support UNVERIFIED) | | research 11 detail |
| M3 | Short 9:16 video from slides or a real recording, captions burned in | Reach format, without filming | spec | accepted 2026-10-12 | Solo | Remotion on a self-hosted container runner or Cloudflare Containers (free at 3 people or fewer); ffmpeg | | research 11 and its detail |
| M4 | Clips cut from long recordings | Talks and demos reused | spec | accepted 2026-10-12 | Add-on | Self-hosted container runner; Whisper | | research 11 |
| M5 | Generated images composited into templates (model never draws text, logo or colours) | Visuals without stock photos | spec | accepted 2026-10-12 | Solo | FLUX.2 klein 4B on a self-hosted provider (Apache-2.0); Workers AI klein 4B hosted fallback (~$0.0012 per image). Not klein 9B or dev (non-commercial) | Similarity to brand references, aesthetic score, logo detection pass | research 11 detail |
| M6 | Generated video | Motion for launches | spec | accepted 2026-10-12 | Add-on | Hosted: Veo 3.1 Lite, Kling, Runway (per-second pricing, research 11 detail); local video not assumed | | research 11 detail |
| M7 | Audio: stock voice, two-voice podcast from a checked script | Podcast without a studio | spec | accepted 2026-10-12 | Add-on | Kokoro-82M (Apache-2.0); Podcastfy approach; not XTTS-v2 or F5 (non-commercial) | Whisper round trip WER and speech-quality scores pass | research 11 detail |
| M8 | Avatars and voice clones of a person who verified themselves, with consent record and label | Founder video without filming | spec | experimental | Add-on | MuseTalk, LatentSync local; HeyGen hosted | Consent stored; label shown | compendium "Create an influencer"; research 11 detail; EU AI Act Art. 50 from 2 Aug 2026 |
| M9 | Claims gate and approval on every slide, chart and number | No competitor checks facts inside media (research 11) | spec | accepted 2026-10-12 | Solo | Same gates as text (G1 to G3) | | research 11 |
| M10 | Alt text and captions on every asset | Accessible and searchable | spec | accepted 2026-10-12 | Free | | | research 11 |

## 7. Publish and schedule

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| P1 | Copy, publish yourself, paste the link back | Works on any network today | built | hackathon | Free | | | Settings, `registerPost` |
| P2 | X publishing with OAuth (tokens encrypted on the server), cost shown before posting | One click to X | spec | coming soon | Solo, X cost as Add-on | `publishToX` stub; G-SECRETS (AES-GCM) | Daily X spend capped | backend map, G-X-COST |
| P3 | LinkedIn publishing (profile; PDF documents for carousels) | One click to LinkedIn | spec | coming soon | Solo | `publishToLinkedIn` stub; documents API (100 MB, 300 pages, research 11 detail) | | backend map, G-LI-API |
| P3a | Bluesky, Threads and LinkedIn Company Page publishing | More channels in order of cost and access | spec | accepted 2026-10-12 | Solo | Official APIs (Bluesky free; Threads app review; Company Pages vetted, legal entity) | Each channel has its own success-rate check | backend map §10.5 |
| P4 | Scheduling and a calendar (one writable copy of the schedule) | Today's posts already decided | spec | roadmap | Solo | | | compendium §5; prior platform design|
| P5 | AI-disclosure flags pre-filled per platform at publish | Platform rules met without thinking | spec | accepted 2026-10-12 | Solo | | | research 11 (Meta, TikTok, YouTube, LinkedIn, X labels) |
| P5a | Failed-publish alerts; canonical vs derivative marked on cross-posts | Knows when a post did not go out | spec | accepted 2026-10-12 | Solo | | | prior platform design|
| P5b | Profile and presence consistency: bios, handles, links, visuals checked for drift; profile checklist | Every profile tells the same story | spec | accepted 2026-10-12 | Solo | Boilerplate (K4) | | prior platform design|
| P6 | Browser extension | Check and post from where the user already is | spec | roadmap | | | | PRD #2 |

## 8. Grow and Inbox

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| R1 | Engagement assist: reply queue in the brand voice, one-click approval | Replies without writing them | spec | hackathon | Solo | reply detection by polling (pattern proven in an existing automation) | | compendium §5 |
| R2 | Who to engage, suggested lists, scheduled posting, opt-in auto-replies | | spec | roadmap | Solo | | | compendium §5 |
| R3 | Ambassadors: curated, verified posts, one USDC payout from a capped budget | Pays advocates with a public record | spec (cut by ADR-008, proposed) | hackathon (one payout) | Team | Lilypad quest data model | | ADR-003, research 05 |
| R3a | Ambassador portal: browse open campaigns, notify me, join with a signMessage wallet link, draft with self-checks, submit (LinkedIn or URL, no X), payout status, earnings, payout wallet | Ambassadors can do the work without the brand chasing them | spec | coming soon | Team (free seat) | `grow.ts` stubs | | backend map §4 Grow; component inventory Amb-1 to Amb-5, M-1 to M-5 |
| R3b | Submission check job: fetch the page, hash or similarity match, author check, disclosure check, budget reached | Pays only for real, disclosed work | spec | | Team | | | `grow.ts` |
| R3c | Approve kept separate from pay: owner or approver approves, only the owner pays; idempotent pay and confirm | No accidental or double payouts | spec | | Team | | | ADR-006; backend map |
| R4 | Paid quests (off X) | | spec | coming soon | Team | research 05 | | compendium §5 |
| R5 | Open creator program: bounties, brand-picked rewards, performance pool; no X activity rewards | | spec | roadmap | Team | | Fraud checks before the performance pool | compendium §5 |
| R6 | Ambassador ops: welcome brief, rejection reason and resubmit, usage-rights term, rate card, fee wording | | spec | accepted 2026-10-12 | Team | | | research 10 N8 to N11, N14 |
| R7 | Find your customer (lead finder): public signals only, no harvesting or sending | | spec | experimental | Solo | GamersLab lead finder | | research 07 |
| R7a | Listening: mentions and conversations about the brand and its topics | Knows what people say before replying | spec | | Solo | | | ADR-002 ("listening and leads"); prior platform design|
| R8 | Create an influencer: founder persona, collaborator avatars, visible watermark, attested | | spec | experimental | Add-on | M8 | | compendium §5, G-WATERMARK |
| R9 | Partner invites (partners write in the brand voice as seats) | | spec | roadmap | Team | A6 | | compendium §5 |
| R10 | Owned audience list: email capture, consent record, sender | An audience the brand owns, not rents | spec | accepted 2026-10-12 | Solo | Resend (already the sender) | | prior platform design|
| I1 | Unified inbox (email, Telegram, X, then WhatsApp Business, opt-in) and Needs reply | Nothing missed | spec | coming soon | Team | | | compendium §5, §7 |

## 9. Analytics and measurement

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| N1 | Analytics per platform and per voice | Knows what works | spec | roadmap | Solo | X own-post metrics first | | compendium §5 |
| N2 | Metric rules: rates over impressions, never raw counts; snapshots appended, never overwritten; drafts and deleted posts kept; first 90 days shown as calibration | Numbers that do not mislead | spec | accepted 2026-10-12 | Solo | | Every displayed metric has unit, denominator and confounders | prior platform design|
| N3 | Outcome log and attribution: front-door UTM link per channel, "how did you find us", 20-second manual log, UNATTRIBUTABLE as a normal value | Measures leads and deals, not likes | spec | accepted 2026-10-12 | Solo | | A test click and a test inbound both land | prior platform design|
| N3a | Inbound qualified against the ICP: response time, outcome through to close; no third-party personal data stored | Knows which inbound is worth it and whether it closed | spec | accepted 2026-10-12 | Solo | | | prior platform design |
| N4 | "What is where" view of the brand's own material (sources, verified vs unverified, what is missing) | One screen instead of a list | spec | accepted 2026-10-12 | Solo | Coverage map (B4) data | | prior platform design|

## 10. Ledger, Verify and the registry

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| L1 | Registrar-signed SAS attestation of kit versions (hashes and ids only) | Public, checkable brand record; no wallet | partial: the Registrar-signed SAS attestation path is proven on devnet by the registry self-test; registering a real kit v1 has not yet been run live (STATE: 0 kits) | hackathon | Free | `@solana/attestation` 2.1.0 | | G-SAS, issue #4 |
| L2 | Post registration and reconcile | Each approved post is on the record | built (`registerPost`, `reconcilePost`) | hackathon | Solo | | | #13 |
| L3 | Public Verify page (exact match) | Anyone can check a post | built | hackathon | Free | | /verify matches the launch post | #36 |
| L3a | Verify a kit version, an account or a claim; report impersonation | Anyone can check more than posts | spec | hackathon | Free | | | backend map (`/api/verify/{kit,account,claim}`, `/api/verify/report`); wireframe audit #21 |
| L3b | Register a post written outside JamJam (paste in) | Existing official posts join the record | spec (from superseded PRD; confirm still wanted) | | Solo | | | PRD #2 Flow 0 |
| L4 | Public Ledger | Registrations and payouts in one list | partial: kits and posts listed (0 entries live); payouts not built | hackathon | Free | | /ledger lists JamJam kit v1 and one post | #36 |
| L5 | "Edited from original" fuzzy match with a diff | Copies that were changed still verify | spec | | Free | pg_trgm or pgvector | | G-MATCH, PRD #2 |
| L6 | Verify badge on every piece | Readers see it is official | spec | | Solo | | | PRD #2 |
| L7 | Registry of identity, accounts, claims, personas | Official accounts in one place | spec | hackathon | Solo | `WL-*` schemas | | compendium §5 |
| L8 | Retracted state (SAS revocation); per-item version history page | Withdrawn posts show as withdrawn | spec | accepted 2026-10-12 | Free | | | research 10 N4, N5 |
| L9 | Media provenance: C2PA manifest at approval, perceptual hash, `WL-ASSET` schema | Images and video verify even after platforms re-encode them | spec | accepted 2026-10-12 | Solo | `c2patool` in a container runner; trust-list certificate price UNVERIFIED | Verify finds a re-encoded image | research 11 detail |
| L10 | C2PA text label; allowlist export for takedown vendors | Works with standard tools | spec | roadmap | Team | `c2pa-text` libraries | | research 10 N6, N7 |
| L11 | Compliance record (who approved what, when, disclosures) | Evidence for regulators; EU AI Act human-review exemption | spec | | Team | Approval records already stored | | PRD #2; research 11 |
| L12 | Agents paying per call (x402) | | spec | roadmap | | | | PRD #2 |

## 11. Settings and billing

| ID | Component | What the user gets | Status | Tag | Plan | Reuse, not rebuild | Done when | Source |
|---|---|---|---|---|---|---|---|---|
| S1 | Settings page: publishing, AI model, proof, plan, account | Sees honestly what is on | built (status rows only) | hackathon | Free | | | `Settings.tsx` |
| S2 | Bring your own model: OpenRouter sign-in (OAuth PKCE), Anthropic or OpenAI key, stored encrypted | Uses their own account and limits | spec | coming soon | Free and Solo | OpenRouter OAuth PKCE; G-SECRETS; `ai_settings` table | Key never returned to the browser | #37, Q4, `PUT /ai-settings` stub |
| S3 | "Get a key" page with a direct sign-up link | Getting a key takes a minute | spec | accepted 2026-10-12 | Free | OpenRouter OAuth gives the key back without copy and paste | | owner, 2026-10-12 session |
| S4 | Connections (X, LinkedIn) | | spec | coming soon | Solo | | | backend map |
| S5 | Payout wallet (owner only; signMessage) | Only needed to pay ambassadors | spec | coming soon | Team | | | ADR-006 |
| S6 | Plan and billing; pricing page; trial without card auto-charge; pay in stablecoins option; payout fee as a second revenue line | Pays in one page | spec | | Free to Team | Billing provider not chosen | U9 | G-BILLING, research 10 N12 to N14, deck slide 10 |

## 12. Shared modules (built once, reused across JamJam and other products)

Every module has one interface, its own tests, and no JamJam-specific names inside it.

| ID | Module | What it does | Status | Reuse, not rebuild | Source |
|---|---|---|---|---|---|
| X1 | LLM gateway | One call path for every prompt; logs model and tokens, never content | partial (`llm.ts`, `openrouter/auto`) | OpenRouter | `llm.ts`, `clients.ts` |
| X2 | Model pool with ranking and failover | Free models scored per task on fixtures; `models` array failover; no code change to add or retire | spec | OpenRouter `/models` and `models` fallback; Jev router as an option (restrictable; data handling UNVERIFIED); NVIDIA router not used (experimental, deprecated) | #39; backend map §10 |
| X3 | Self-hosted provider | Any self-hosted, OpenAI-compatible GPU endpoint as one more provider behind X1 | spec | OpenAI-compatible API, no custom protocol | backend map §10 |
| X4 | Workflow engine with run tracking and resumable progress | Long jobs survive reloads and failures | spec | Cloudflare Workflows | #32 |
| X5 | Prompt library, versioned in a table | Prompts change without a deploy; each run records its prompt version | spec | | #32 |
| X6 | Source adapters (URL, paste, PDF, DOCX, PPTX, X, LinkedIn) | One file plus a test per source type | partial (URL) | Exa, Workers AI `toMarkdown` | #33 |
| X7 | Quote normaliser and check | | built (`quote.ts`) | | #31 |
| X8 | Slop and style rules, one list | | partial | `no-ai-slop`, `lint-voice` R1 to R13 | G1 |
| X9 | Registry client (SAS) | | built (`registry.ts`) | | G-SAS |
| X10 | Media renderer | Templates to PNG, PDF, MP4 | spec | Satori, resvg, Remotion, ffmpeg | M1, M3 |
| X11 | Secrets vault | Tokens and keys encrypted at rest | spec | WebCrypto AES-GCM | G-SECRETS |
| X12 | Evaluation harness | Fixtures, golden sets per surface built from real posts, rubric (voice, claim safety, format, purpose fit), thresholds set before generation, judge calibrated against the owner | spec | | architecture §13; prior platform design|
| X13 | Design tokens and UI primitives | One file changes the look | built | | ADR-005 |
| X14 | Prompt versions and traces | Prompts versioned and keyed by hash; traces to a free observability tier; each kit and post links to the prompts that made it | spec (accepted 2026-10-12) | | architecture §6.1; backend map §10 |
| X15 | Security | Database grants tightened behind the Worker, deny tests in CI, rate limits per brand | spec (accepted 2026-10-12) | | backend map §10 |
| X16 | Retrieval | Embeddings for approved posts and site excerpts; retrieval under 200 ms | spec (accepted 2026-10-12) | pgvector | architecture §6.2 |
| X17 | Payout builder and Verify matcher | Server-built USDC transfer confirmed against the record; edited-copy matching with a diff | spec (accepted 2026-10-12) | `@solana-program/token`; pg_trgm | architecture §7.1; backend map §10.3 |

## 13. Product rules that apply to every component

From the prior platform design and ADR-003; each becomes a check, not a sentence.
- Nothing is published without a person approving it (R8; ADR-003 principle 1).
- A fact from a source is kept only when its quote is on that source (#31).
- Every record starts unverified; only the owner promotes it. No agent sets verified on its own output (prior platform design).
- What may be used is derived from two fields, who wrote it and how confidential it is; private material is never gathered (prior platform design).
- Sample data is always labelled as sample (mission R13).
- Ambassadors are never paid for posts on X (X bans reward-for-posting apps; compendium §5, ADR-002), so X is never a paid submission route.
- Real people named in an audience are kept private and never put in prompts (backend map §3).
- A gate is trusted only after it has been seen refusing a real bad case; a check over an empty set is reported as empty, not passing (prior platform design).

## 14. Parked or superseded

- Licensing flows (Flow 1 in PRD #2): parked (wireframes decision, STATE).
- Rewards for X activity: out (X's Jan 2026 ban; ADR-002).
- A "trained twin" that publishes without review (Pressmaster's direction): out (ADR-003 principle 1).

## 15. Build order

The hackathon slices are tracked in [#38](https://github.com/DeveloperAlly/solana-hack/issues/38). The full product runs in five phases, in order, because each phase's output is the next one's input: onboarding produces the evidence and voice that creation needs, and creation produces the approved posts that publishing, payouts and tuning need. Every task takes its quality bar from [architecture §6.1 and §13](../../what/context/brand_builder_architecture.md). Product copy and marketing stay crypto-silent; the first market is a go-to-market choice, not a product feature. Moved here from the 2026-10-12 delivery plan.

### Phase 1: Onboarding nailed

Components: A1 to A7, B1 to B17, V1, V1a, S1 to S3, X1 to X7, X11, X12, X14 (X9 and X13 are built).

Goal: a brand goes from its URL and documents to an approved, attested kit in under 10 minutes, with no invented facts.

| Area | Tasks | Done when |
|---|---|---|
| UI | Confirm-mode interview with prefilled cards; coverage badge per field (D51); evidence drawer showing the quote and its page for every fact; voice by example; kit review with section gates and stale flags | 5-person usability run: ≥ 4 of 5 finish unaided |
| Workflows | Durable ingest run: crawl key pages, convert documents, extract per chunk, verify quotes, merge, compute coverage; resumable with progress | A run survives a forced failure at any step |
| Prompts | Chunk extraction to schema JSON with quotes; field classifier (Evidence, Inferred, Missing); gap-question writer; per-section kit drafter with fact ids; kit critique | F2 and F3 gates pass |
| Models | Strict JSON-schema model for extraction and classification (a small, cheap model with zero data retention); stronger model only for kit drafting | Model chosen by harness score per task |
| Data | Evidence store: sources, chunks, facts with quotes, field status, answers, kit versions with fact ids per sentence | Every kit sentence resolves to a fact or an answer |
| Evals | F1 to F3 built and in CI | Gates run on every prompt PR |
| Infra | Versioned prompts in Postgres keyed by hash; traces to a free observability tier; shared normaliser `norm_v1` | Each kit links to the exact prompts that drafted it |
| Settings › AI | Connect with OpenRouter (OAuth, one button; paste a key as fallback); model sources in order: the brand's own key, JamJam's default, any OpenAI-compatible endpoint (how a self-hosted provider plugs in); keys encrypted at rest with AES-GCM under a per-brand key derived from a versioned master secret held only in the Worker, never returned to the browser (last four characters and a Test button shown); calls and estimated spend this month (D54) | A new brand connects its own key in under a minute; a stored key can't be read back through any API; the test button reports a bad key |

### Phase 2: Content creation nailed

Components: T1 to T10, G1 to G4, C1 to C3, V2 to V4, K1, K3 to K7, M1 to M3, M9, M10, X8, X10, X16.

Goal: drafts a brand approves without editing, with no slop and no unsupported claims.

| Area | Tasks | Done when |
|---|---|---|
| UI | Checks panel on every draft (D3): voice, slop, claims with their facts, platform checklist; learned-rules list the brand can keep or delete; reject with a reason code | A draft with an unsupported claim shows it before Approve |
| Workflows | Draft run: retrieve exemplars, generate 3, filter on slop and claims, rank, present; edit-to-rule learning on approve | Run returns in under 30 seconds at p90 |
| Prompts | Voice-spec extractor (claims with quotes from the brand's posts); drafter with retrieved exemplars, spec and rules; claim extractor; edit-to-rule; pairwise judge | Draft win rate ≥ 60% against today's prompt |
| Models | Drafting model chosen by harness; judge model never the drafting model; deterministic slop detector in code | Slop gate 0; claims recall ≥ 95% |
| Data | Store all candidates and scores, retrieved exemplar ids, spec version, edits as original and final, reject reasons, learned rules, training-consent flags | Every approved post can be traced to its candidates and scores |
| Evals | F4 to F6; judge calibrated on 100–200 owner labels per dimension | Judge agreement published with each run |
| Infra | Embeddings for approved posts and site excerpts (Postgres vectors); rate limits per brand | Retrieval under 200 ms |
| Media | Template renderer for carousels (PDF for LinkedIn), image cards and diagrams from kit tokens; short video from slides; claims gate and approval on every slide; alt text and captions (M1 to M3, M9, M10; research 11) | Text, contrast and colour checks pass by construction; every number on a slide resolves to evidence |

### Phase 3: Publish and operate

Components: P1 to P6, R1, R2, R7, R7a, R8, I1, N1 to N4, L1 to L11, S4, X15.

Goal: approved posts go out from JamJam and every one is verifiable.

| Area | Tasks | Done when |
|---|---|---|
| UI | Connect accounts; schedule; post-publish Verify link; reply queue; unified inbox; analytics | Published text hashes to the approved hash 100% |
| Workflows | Publish run with retries; register post on approval; poll engagement | No post publishes without an approval record |
| Integrations | Order by cost and access: Bluesky (free, open), LinkedIn as a member (self-serve), X (pay per use; keep links out of post bodies, where the price jumps), Threads (app review), LinkedIn Company Pages (vetted access, legal entity) | Each live with its own success-rate check |
| Proof | Post schema on SAS; Verify cascade with diff and "claims changed" flag; retraction by close plus record | F7 gates pass |
| Security | OAuth tokens encrypted at rest per brand; database grants tightened behind the Worker; deny tests | Security tests in CI |
| Settings › Connections | Connect and remove each publishing account with its status; copy-and-paste-back fallback per channel (D52); OAuth tokens encrypted at rest the same way as model keys | Each channel connects, publishes and disconnects cleanly; an expired token shows as expired before a publish fails |

### Phase 4: Pay

Components: R3 to R6, R9, R10, S5, X17.

Goal: a brand pays ambassadors for approved work from its own wallet, with a record anyone can check.

| Area | Tasks | Done when |
|---|---|---|
| UI | Campaigns with caps; ambassador seats; disclosure inserted automatically; payout approval separate from content approval (ADR-006) | Disclosure present on 100% of ambassador posts |
| Workflows | Wallet link by signed message; server-built USDC transfer signed by the brand's wallet; server confirmation against the record | F8 gates pass |
| Later | Capped budgets by delegation (needs a custody and compliance decision first) | Decision recorded |
| Settings › Connections | Brand payout wallet, owner only, linked by signed message (ADR-006) | Only an owner can set or change the wallet; a change is recorded |

### Phase 5: Commercial and scale

Components: S6, A6, K2, M4 to M8, L12; V5 and the shared writer model when the harness shows they beat retrieval.

| Area | Tasks | Done when |
|---|---|---|
| Billing | Subscription billing for brands (card billing; USDC through card processors isn't available to an Australian entity today, so stablecoin subscriptions (research 10 N13) need another route, and payouts stay on-chain) | First paid brand |
| Models | One shared anti-slop writer model trained on pooled approved and rejected drafts (with consent); per-brand adapters piloted for brands with deep histories, A/B against retrieval | Pilot beats retrieval on approval without edit |
| Evals | Brand-style reranker trained on approve and reject labels replaces the generic style score | Reranker beats the judge on owner agreement |
| Infra | Move to paid Workers tier before the free CPU-per-step limit binds; observability tier sized to volume | No run fails on platform limits |
| Settings › Plan | Plan, seats (partners, agencies, ambassadors) and billing summary (D55) | A brand can upgrade, add a seat and see its bill without contacting you |

## 16. Every row of the previous product map, and where it is now

The 21 rows this file held until 2026-10-12, so none is lost:

| Previous row (tag) | Now |
|---|---|
| Build your brand: intake, URL/upload ingest, evidence store, coverage map, interview, drafters, 3 gates, kit v1 + hash (hackathon) | B1 to B10 |
| Build your brand: connected social-account ingest, validation loop, audio kit, behaviour scenarios (coming soon) | B13, B16, K2; behaviour scenarios are kit section 15 (§4) |
| Voices (templates) (hackathon) | V1 |
| Claims with evidence (hackathon thin) | C1 |
| aDNA export of the Brand Kit (hackathon thin) | B17 |
| Campaign builder v2 (hackathon) | T4 |
| Content dashboard (hackathon) | T5 |
| Polish actions: Review, Shorten, Clarify, Beautify with accessible mode (hackathon) | T2 |
| Engagement assist: reply queue (hackathon) | R1 |
| Engagement assist: who-to-engage, suggested lists, scheduled posting, opt-in auto-replies (roadmap) | R2 |
| Ambassadors and paid quests: one USDC payout (hackathon) | R3 |
| Ambassadors and paid quests: quests (coming soon) | R4 |
| Find your customer (experimental) | R7 |
| Create an influencer (experimental) | R8 |
| Partner invites (roadmap) | R9 |
| Ambassador program open to all creators (roadmap) | R5 |
| Unified inbox (coming soon) | I1 |
| Needs reply (coming soon) | I1 |
| Analytics, UI shown (roadmap) | N1 |
| Official registry + verify (hackathon) | L3, L7 |
| Ledger (hackathon) | L4 |
