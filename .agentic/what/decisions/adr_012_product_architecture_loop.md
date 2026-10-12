---
type: adr
status: proposed
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [adr, product, information-architecture, navigation, ui]
supersedes: navigation line of ADR-003 (product map) and UI mission requirement R11
---
> **Status: proposed.** JamJam's UI is organised around one loop of six steps (Brand, Create, Distribute, Verify, Grow, Learn), opened by a Today queue of decisions, with one Brain that every step reads from and Learn writes back to.

# ADR-012: Product architecture, one loop around a Brain

## Context
- **Owner's model (2026-10-13, recorded in [issue #90](https://github.com/DeveloperAlly/solana-hack/issues/90)).** The complete system is a process:
  1. build your brand and voice;
  2. create content;
  3. distribute everywhere;
  4. verify anywhere (the ledger);
  5. grow your reach (ambassadors, influencers, campaigns);
  6. learn from what works.

  An intelligence system runs through building, creating, growing and learning.
- **Purpose and pitch.** ADR-002 sets the purpose: "build your brand, run it, prove it". ADR-007 sets the pitch differentiator: the full loop of build, run, prove and pay. ADR-003 sets the rule that a person reviews everything.
- **A review of the wireframe canvas (v20, 2026-10-13; [canvas link](../context/links.md)) found the system wasn't legible:**
  - The canvas has two different nav bars: Hub-Home and Analytics show Home, Inbox, Brand, Create, Grow, Analytics and Ledger; Claims, Brand-Switcher, Media-Composer and the other Coming soon boards show Home, Brand, Create, Grow, Inbox, Ledger and Settings.
  - Distribute is not a step anywhere. The calendar sits under Create, connections in Settings cover only X and LinkedIn, and the new Platforms page has no home.
  - Campaigns sit under Create, not Grow.
  - Learning appears only as "Suggested changes" on Analytics.
  - Nothing shows the intelligence as one system.
  - The landing page tells only the five onboarding steps.
- **Patterns from the market:**
  - Social suites organise by job, across publishing, engagement, analytics and listening (Sprout Social, Buffer; [AuthoredUp comparison](https://authoredup.com/blog/sproutsocial-vs-buffer)).
  - Content-operations models run create, then distribute, then measure ([Content Marketing Institute](https://contentmarketinginstitute.com/content-operations/master-content-operations)).
  - Sidebars suit products with many sections. Labels should follow user intent, not feature names. Contextual tabs belong inside a section, and on mobile a bottom tab bar holds at most five items ([SaaS UI navigation patterns](https://www.saasui.design/blog/saas-navigation-ux-patterns)).
  - None of the 59 competitors reviewed covers the whole loop of Build, Run, Prove and Pay; the most any covers is two legs ([research 10 §1, finding 1](../context/research/10_competitor_onboarding_pricing.md#1-summary); coverage by item in [§4](../context/research/10_competitor_onboarding_pricing.md#4-coverage-of-the-full-plan-who-does-each-item-today)). Provenance tools prove content but run none of the other steps (segment F in [§3](../context/research/10_competitor_onboarding_pricing.md#f-provenance-and-is-this-official-detail)).

## Decision
1. **Today is the front door.** The app opens on a queue of decisions, not a dashboard:
   - what the team did;
   - what needs you, as one approval queue (drafts, replies, ambassador posts, suggested rule changes);
   - what was learned;
   - what's next.

   Every item has a one-tap approve that works on a phone. Today also shows where the brand is in the loop (for example "Step 3 of 6").
2. **The navigation is the loop.** One sidebar, defined once in code (`web/src/config/nav.ts`), holds Today, then **Brand · Create · Distribute · Verify · Grow · Learn**, then the utilities Inbox and Settings. On mobile the tab bar shows Today, Create, Verify, Grow and More. Inside a step, sections use tabs.

   | Step | What lives here (existing boards → step) |
   |---|---|
   | **Brand** (the Brain) | Kit and gates (BB-*, Coverage-Map, Kit-Export, Kit-RegisterFailed), voices (Voice-Templates, Voice-Editor), Founder-Profile, Brand-Switcher, the **Brain** (new) |
   | **Create** | Content-Dashboard(+Empty), Draft-Review(+Beautified, PolishError), Media-Composer and Media-Review, Claims |
   | **Distribute** | Platforms and Platform-Detail (#82), Distribute-Adapt (new: write once, adapt per platform), Publish-Calendar, Settings-Connections (moved) |
   | **Verify** | Verify-Home (new), Ledger, Verify-1..5, Badge-Embed, Verify-Badge-Landing, Tip-Sheet and Tips-Received (#82), the public check page; public **Events-Board and Event-Rating (roadmap)** |
   | **Grow** | Grow-Home (new), Ambassadors (Amb-*, M-*, seats plus public campaigns), Campaign-v2-1..6 (moved from Create), **Events and Event-Detail (new)**, Influencer-Setup and Influencer-Queue, Partners, Leads, Engage-Queue and Engage-Rules, Referral, Invite-Team (#82) |
   | **Learn** | Analytics(+Empty), Outcome-Log, Learn-Rules (new: suggested rules) |
   | Utilities | Inbox (Inbox-All, NeedsReply, Connect), Settings (Settings-AI, GetKey, Plan, Pricing, Upgrade) |
3. **A Post shows the whole loop.** The Post is the core object. Every post card and the Post detail screen carry a six-step **lifecycle strip**:
   - drafted from kit vN in a voice;
   - approved by a named person;
   - published to N platforms;
   - verified on Solana;
   - amplified by N ambassadors;
   - results, and any learned rule.

   One shared component, `PostLifecycle`, renders it everywhere.
4. **One Brain is the intelligence system.** It lives under Brand and holds:
   - the kit;
   - voice;
   - audience;
   - proof sources;
   - **learned rules**.

   Create and Grow read it, and every draft has a **Why this?** listing the facts, voice and rules it used. This extends "every fact has a receipt" from the kit to every output. Learn proposes rules from results, and a person approves each one before it enters the Brain (ADR-003: a person reviews everything). A rule can be retired, and approvals bound to an older Brain go stale.
5. **Proof is ambient.** Verified state shows on every post, in Today, in the ledger and through the public badge. The badge links to Verify, which offers "Make yours on JamJam", so proof also drives distribution.
6. **Progressive disclosure.** On a first run, Brand, then the first post, then Verify are live. Distribute, Grow and Learn show teaching empty states until they apply. The Journey (J1 to J8) ends on Today, showing "3 of 6".
7. **Shells by role:**
   - owner or team: the full loop;
   - ambassador: brand seats plus public campaigns;
   - public: the landing page, Verify (check a post, badge landing, tips), the Ledger, the events board (Events-Board, Event-Rating), and the referral and team-invite landings.
8. **Events are part of Grow** (owner, 2026-10-13, [issue #90](https://github.com/DeveloperAlly/solana-hack/issues/90): "events are massive in crypto"). An event comes from a Luma calendar or is added by hand; it has a role (hosting, speaking, sponsoring, attending) that picks a content plan (announce, countdown, live, recap, follow up) made of ordinary drafts; it can belong to a campaign, lists the ambassadors attending, and its results feed Learn. Luma's public API lists a calendar's events and guests and has webhooks, scoped by an API key per calendar ([Luma API changelog](https://docs.luma.com/reference/changelog)); whether it needs a paid plan is unverified. A public **events board** (roadmap) lets people who attended rate an event on five questions; ratings are registered so they can't be quietly edited or removed, and organisers can reply.
9. **One story everywhere.** The landing page, the hub home, the canvas, the pitch deck and the README all name the six steps in the same order and with the same words.

## Runtime behind the UI (answers the CPO audit, [PR #86 comment](https://github.com/DeveloperAlly/solana-hack/pull/86#issuecomment-6126845806))
The data model is decided in [ADR-013](https://github.com/DeveloperAlly/solana-hack/pull/88) (brand memory, X18; learn loop, N5). This ADR fixes only what the UI depends on:
1. **The Brain as data.** It lives in Supabase Postgres, read and written only by the Worker (RLS on, no policies; [backend map](../context/backend_map.md)). It extends the existing evidence store and kit versions with a learned-rules table (rule text, scope, status suggested/active/retired, evidence ids, the Brain version it entered, approver). Every draft gets a provenance row: kit version, Brain version, evidence ids, rule ids, voice, prompt id and version, and model. "Why this?" renders that row and nothing else. The backlog already requires storing candidates, scores, exemplar ids, spec version, edits and learned rules ([backlog, Data row](../../how/backlog/backlog.md); T1b).
2. **Learned rules do not enter the registered kit (proposed; owner to confirm at ratification).** The registered kit stays what the owner approved at the three gates, so a kit version's proof means the same thing it means today: its fields are brand_id, hash, kit_version, approver and domain_verified (`web/src/lib/api.ts`). Learned rules change drafts, not the kit; each post's provenance row records the rule ids and Brain version it used, so a reader can still trace why a registered post says what it says. If the owner wants rules inside the proof, the alternative is to register the Brain version alongside the kit version, which needs a schema field and a new SAS schema version.
3. **Learn's signal source, in order of availability.** Publishing is copy and paste today, so there are no platform metrics. The first signal is edit-to-rule (backlog T1b, accepted 2026-10-12): every edit a person makes becomes a proposed rule. The second is what JamJam already sees: approvals, rejections with reasons, and outcomes logged by hand (Outcome-Log). Platform metrics (N1) arrive per platform as its adapter gains metrics read-back (ADR-013 decision 4), by demand. Learn-Rules shows each proposal's source, and says when the sample is too small.
4. **Relation to the workflow engine ([PR #70](https://github.com/DeveloperAlly/solana-hack/pull/70)).** Drafting, ingest and learn runs are durable runs on that engine; their prompts come from its prompt library, and the provenance row stores the prompt id and version the run pinned. The Brain is what those runs read; the engine is how they run.
5. **Supersedes.** This decision replaces the navigation in [ADR-003](./adr_003_superhub_business_model.md) (product map: Brand / Create / Grow / Inbox / Analytics / Ledger-Verify) and the UI mission's frozen requirement R11 ("Keep the top nav: Home / Inbox / Brand / Create / Grow / Analytics / Ledger"; [mission_ui_build](../../how/missions/mission_ui_build.md)). ADR-003's business model is unchanged.

## Consequences
- **New screens:** Today and M-Today (replacing Hub-Home), Post-Detail with `PostLifecycle` and Why this?, the Brain, Learn-Rules, Verify-Home, Grow-Home, Distribute-Adapt, Events, Event-Detail, and the public Events-Board and Event-Rating. The UI contracts and how they map to ADR-013's modules are in the [coordination comment on issue #90](https://github.com/DeveloperAlly/solana-hack/issues/90#issuecomment-6126672733).
- **Moved screens:** Campaigns to Grow; Publish-Calendar and Settings-Connections to Distribute.
- **Code:** each screen's registry entry gains a `step` field. A test asserts that every screen belongs to exactly one step and that every shell reads `config/nav.ts`.
- **The canvas is redrawn to the loop** (AGENTS.md rule 8): done in canvas v21, whose pages follow the six steps and whose app boards share one nav. The landing page copy and the deck are rewritten to the six steps.
- **Trade-off:** Create and Distribute stay separate steps. Buffer and Sprout merge them as "Publish". Keeping them apart makes "write once, it goes everywhere" visible as a promise. If usage shows people treat them as one job, they merge under Create.
- **Companion:** [ADR-013](https://github.com/DeveloperAlly/solana-hack/pull/88) decides the system architecture under this UI; the Brain here is its brand intelligence system (X18). The two are ratified together.

## Ratification
Pending owner ratification.
