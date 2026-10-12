---
type: adr
status: proposed
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [adr, product, information-architecture, navigation, ui]
---
> **Status: proposed.** JamJam's UI is organised around one loop of six steps (Brand, Create, Distribute, Verify, Grow, Learn), opened by a Today queue of decisions, with one Brain that every step reads from and Learn writes back to.

# ADR-012: Product architecture, one loop around a Brain

## Context
- **Owner's model (2026-10-13).** The complete system is a process:
  1. build your brand and voice;
  2. create content;
  3. distribute everywhere;
  4. verify anywhere (the ledger);
  5. grow your reach (ambassadors, influencers, campaigns);
  6. learn from what works.

  An intelligence system runs through building, creating, growing and learning.
- **Purpose and pitch.** ADR-002 sets the purpose: "build your brand, run it, prove it". ADR-007 sets the pitch differentiator: the full loop of build, run, prove and pay. ADR-003 sets the rule that a person reviews everything.
- **The audit (2026-10-13) found the system wasn't legible:**
  - The canvas has two different nav bars: one with Home, Inbox, Brand, Create, Grow, Analytics and Ledger; one with Home, Brand, Create, Grow, Inbox, Ledger and Settings.
  - Distribute is not a step anywhere. The calendar sits under Create, connections in Settings cover only X and LinkedIn, and the new Platforms page has no home.
  - Campaigns sit under Create, not Grow.
  - Learning appears only as "Suggested changes" on Analytics.
  - Nothing shows the intelligence as one system.
  - The landing page tells only the five onboarding steps.
- **Patterns from the market:**
  - Social suites organise by job, across publishing, engagement, analytics and listening (Sprout Social, Buffer; [AuthoredUp comparison](https://authoredup.com/blog/sproutsocial-vs-buffer)).
  - Content-operations models run create, then distribute, then measure ([Content Marketing Institute](https://contentmarketinginstitute.com/content-operations/master-content-operations)).
  - Sidebars suit products with many sections. Labels should follow user intent, not feature names. Contextual tabs belong inside a section, and on mobile a bottom tab bar holds at most five items ([SaaS UI navigation patterns](https://www.saasui.design/blog/saas-navigation-ux-patterns)).
  - None of these tools shows one unit of work moving through the whole loop, and none proves authorship (research 10 §6).

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
   | **Distribute** | Platforms and Platform-Detail (#82), Publish-Calendar, Settings-Connections (moved), publishing queue |
   | **Verify** | Ledger, Verify-1..5, Badge-Embed and Verify-Badge-Landing (#82), the public check page |
   | **Grow** | Ambassadors (Amb-*, M-*, seats plus public campaigns), Campaign-v2-1..6 (moved from Create), Influencer-Setup and Influencer-Queue, Partners, Leads, Engage-Queue and Engage-Rules, Referral, Tips, Invite-Team (#82) |
   | **Learn** | Analytics(+Empty), Outcome-Log, learned-rule suggestions (new) |
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
   - public: Verify, Ledger and the landing page.
8. **One story everywhere.** The landing page, the hub home, the canvas, the pitch deck and the README all name the six steps in the same order and with the same words.

## Consequences
- **New screens:** Today (reworking Hub-Home), Post-Detail with `PostLifecycle`, the Brain with learned-rule approvals, and Why this? on drafts.
- **Moved screens:** Campaigns to Grow; Publish-Calendar and Settings-Connections to Distribute.
- **Code:** each screen's registry entry gains a `step` field. A test asserts that every screen belongs to exactly one step and that every shell reads `config/nav.ts`.
- **The canvas is redrawn to the loop** (AGENTS rule 8). The landing page copy and the deck are rewritten to the six steps.
- **Trade-off:** Create and Distribute stay separate steps. Buffer and Sprout merge them as "Publish". Keeping them apart makes "write once, it goes everywhere" visible as a promise. If usage shows people treat them as one job, they merge under Create.
