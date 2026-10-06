---
type: compendium
status: active
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [compendium, decisions, product-map, business-model]
supersedes: [archive/prd_story_studio, archive/roadmap_story_studio, archive/influencer_scope, archive/ai_creator_angles]
---
> **Status: active.** Decision compendium for 2026-10-06 (v2: adds the dogfooding demo, the brand maturity split and polish actions). Ratified as [ADR-002](../decisions/adr_002_purpose_build_run_prove.md) and [ADR-003](../decisions/adr_003_superhub_business_model.md); the source for the PRD rewrite.

# Compendium 2026-10-06: Waterlily becomes a brand superhub

> **Supersedes:** the licensing-centred PRD v2.1 (issue #2), the story PRD ([archive/prd_story_studio.md](./archive/prd_story_studio.md)) and its [roadmap](./archive/roadmap_story_studio.md), [influencer scope](./archive/influencer_scope.md) and [AI creator angles](./archive/ai_creator_angles.md) as product direction (they stay as history).
> **Sources:** the founder's design-chat thread (2026-10-05/06), founder answers in chat, [ADR-002](../decisions/adr_002_purpose_build_run_prove.md), research [01–09](./research/README.md), and the [Brand Builder architecture](./brand_builder_architecture.md).

## 1. Purpose (decided)
**Waterlily: build your brand, run it, prove it.** A brand superhub. It is both the product vision and the hackathon build, scoped by the tags in §5.

## 2. Business model (decided)
- **The brand pays** a subscription for the hub.
- **Partners, agencies and ambassadors** get access to the brand's voice as **seats or invites** on the brand's account. They are not paying customers.
- **Ambassador payouts in USDC stay.** This is the one money flow brands already spend on, and where Solana does real work: cross-border payments, per verified post, from a capped budget.
- **Consent and provenance are features of what brands pay for, not the business on their own.**
- **Licensing ("pay to write in a brand's voice") is dropped as a headline flow** and becomes at most a roadmap line. Brands pay for voice tools, but nothing showed outsiders paying a brand per piece.
- **Pitch:** a brand hub that writes in your voice, runs your campaigns, pays your community per verified post, and proves what's official.

## 3. Principles (decided)
1. **Human review on everything.** Nothing posts, replies, follows or sends without a person approving it.
2. **Every draft runs through a no-AI-slop pass** before a human sees it.
3. **Platform rules are respected per platform.** X's rules don't govern the product, but engagement features are draft-and-approve. X bans bulk follow/unfollow, automated likes and untargeted auto-replies ([X automation rules](https://help.x.com/en/rules-and-policies/x-automation)). LinkedIn's automation stance is secondary-source only.
4. **AI personas are always labelled**, with a visible AI watermark.
5. **Claims carry evidence**, the founder's brand-database rule, registered onchain.
6. **Demo content is SFW.** Colosseum rules §12. "Flirty" exists as a template only.

## 4. Demo brands and demo story (decided)
- **Headline: Waterlily builds its own brand from scratch, live.**
  - Run Waterlily through the minimum viable intake.
  - Get kit v1 through the three gates.
  - Create voices.
  - Score and polish a launch post, then approve it.
  - Register it as official, then verify it.
  - Run one paid quest (a tutorial about Waterlily).
  - Waterlily's own launch metrics become traction.
- **Second zero-presence case: aDNA.** It has a strong written brand but no social presence. It shows the builder confirming rather than asking, and taking a brand onto social for the first time.
- **Semi-established case studies: film.fun and GamersLab.**
  - These are the ingest-led path.
  - film.fun has a live product, site and five networks.
  - **GamersLab is confirmed as [gamerslab.gg](https://www.gamerslab.gg/)** ([09](./research/09_demo_brands.md)). It is the brand the founder's lead finder was built for, so it can show both the Brand Builder (from its existing product brief) and **Find your customer**.
- **The founder's personal brand** stays as a user of the product, not a demo case.
- **Timing:** Waterlily's own kit v1 is due by Oct 9, leaving time to post, register and run a quest before the deadline.

## 5. Product map (decided structure; tags drive the build)
Navigation: **Brand / Create / Grow / Inbox / Analytics / Ledger-Verify**.

| Area | Page | What it does | Tag |
|---|---|---|---|
| Brand | **Build your brand** | Infer-first, interview-the-gaps builder producing a 17-section Brand Kit with evidence and three decision gates ([architecture](./brand_builder_architecture.md)) | Hackathon |
| Brand | **Voices (templates)** | Templates as presets over 9 measurable dimensions; multiple voices per kit ([06](./research/06_voice_templates.md)) | Hackathon |
| Brand | **Claims with evidence** | Each claim has evidence, an owner and an expiry, and can be registered onchain | Hackathon (thin) |
| Create | **Campaign builder v2** | Platform(s), purpose, success metrics, then a content plan | Hackathon |
| Create | **Content dashboard** | Posted, replies, and drafts awaiting approval; scheduling; per-platform scoring ([03](./research/03_platform_performance.md)) | Hackathon |
| Create | **Polish actions** | Review, Shorten, Clarify, **Beautify**, applied to any draft ([architecture §6](./brand_builder_architecture.md)) | Hackathon |
| Grow | **Engagement assist** | Reply queue in the brand voice with one-click approval; who-to-engage suggestions; suggested lists; scheduled posting; opt-in auto-replies only | Hackathon (reply queue) / roadmap |
| Grow | **Ambassadors and paid quests** | Curated ambassadors, verified posts, USDC payouts from a capped budget; quest mechanics from the Lilypad quest data model, off-X work ([05](./research/05_lilypad_quest_api.md)) | Hackathon (one payout) / quests: coming soon |
| Grow | **Find your customer** | GamersLab lead finder, generalised; no harvesting or sending ([07](./research/07_gamerslab_leadfinder.md)) | Experimental |
| Grow | **Create an influencer** | The founder's own AI persona; avatars by a collaborator; visible AI watermark; attested onchain | Experimental |
| Grow | **Partner invites** | Partners write in the brand voice as seats | Roadmap |
| Grow | **Rewards board** | Brands reward creators beyond paid ambassadors, from a capped USDC pool: bounties (fixed reward for set work), brand-picked rewards for good organic content, and a performance pool for verified results. Every payout is approved by a person and disclosed by the creator. **No rewards for X activity** (X's Jan 2026 ban on reward-for-posting apps; ADR-002). Performance pool needs fraud checks for fake views. No public money-linked engagement leaderboard. Platform rules for reading view counts and allowing paid rewards are not yet verified (added 2026-10-06) | Roadmap |
| Inbox | **Unified inbox** | Gmail-style "All inboxes" across messaging and social DMs (§7) | Coming soon |
| Inbox | **Needs reply** | Flags messages that need a response; drafts a reply for review | Coming soon |
| Analytics | **Analytics** | Performance per platform and per voice | Roadmap (UI shown) |
| Ledger-Verify | **Official registry + verify** | Identity, accounts, kit versions, content, claims and personas onchain; verify page and badge | Hackathon |
| Ledger-Verify | **Ledger** | Payouts and registrations | Hackathon |

Every page gets an artboard with empty, loading, success and error states and annotated interactions, and is tagged.

## 6. Voice templates (decided model; values to calibrate)
- **Existing tools:** they offer tone labels or rewrite verbs. None publishes measurable presets, mixes templates per post, or treats claims as part of the preset, and none offers "flirty" ([06](./research/06_voice_templates.md)).
- **Dimensions** (1–5):
  - formality
  - energy
  - humour
  - warmth
  - sentence length
  - jargon
  - emoji and punctuation
  - CTA intensity
  - claims strictness (a gate)
- **Starter templates:** Academic, Enterprise, Professional, Friendly, Plainspoken, Efficient, Candid/Founder, Playful, Flirty (suggestive, never explicit, behind a content-policy gate), Sales, Hype/Launch, Empathetic/Support.

## 7. Unified inbox (coming soon)
- **Channels by feasibility:**
  - Email, Telegram (MTProto client) and X DMs: feasible.
  - Discord: bots only.
  - Slack: official API.
  - WhatsApp: only the Business Platform is official, and personal-client automation breaks WhatsApp's terms ([CodeWords](https://www.codewords.ai/blog/whatsapp-business-api-vs-unofficial-api)).
  - LinkedIn messages: no member API.
  - Aggregators such as Unipile exist ([Unipile](https://www.unipile.com/communication-api/messaging-api/)).
- **Build order:**
  1. Email, Telegram and X
  2. WhatsApp Business
  3. Personal WhatsApp and LinkedIn by explicit opt-in to the ban risk

## 8. Reuse (decided)
- **Personal-brand process:** ideas summarised publicly, with no private data.
- **Brand database proof layer:** becomes onchain claims with evidence.
- **Lilypad quest API:** data model only.
- **GamersLab lead finder:** UI kit, scoring and budget patterns. Email harvesting, WHOIS lookup and guessed addresses are dropped.

## 9. Open items
- **Calibrate** the voice template values.
- **Verify** LinkedIn's automation policy from primary pages.
- **Fully read** the Lilypad quest repo (needs connector approval).
- **Rewrite** the PRD (issue #2, phase P0 of the [build plan](https://github.com/DeveloperAlly/solana-hack/issues/4)), the wireframes, the deck and the design prompts.
