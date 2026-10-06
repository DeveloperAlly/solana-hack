---
type: adr
status: accepted
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [adr, business-model, principles, product-map]
supersedes: adr_001_brand_voice_licensing
---
> **Status: accepted.** Brand superhub: the brand pays; partners and ambassadors are seats; USDC payouts; human review on everything.

# ADR-003: Brand superhub business model, principles and product map

Full detail and sources: [compendium 2026-10-06](../context/compendium_2026_10_06.md), sections 2, 3 and 5. This ADR summarises them.

## Context
ADR-002 set the purpose (build, run, prove). The licensing-centred model of ADR-001 had no evidence of outsiders paying a brand per piece, while brands do pay for voice tools and for ambassador programs ([compendium §2](../context/compendium_2026_10_06.md#2-business-model-decided), [research 04](../context/research/04_brand_hub_landscape.md)). Platform automation rules constrain engagement features ([compendium §3](../context/compendium_2026_10_06.md#3-principles-decided), [research 03](../context/research/03_platform_performance.md)).

## Decision
**Business model** ([§2](../context/compendium_2026_10_06.md#2-business-model-decided)):
- The brand pays a subscription for the hub.
- Partners, agencies and ambassadors are seats or invites on the brand's account, not paying customers.
- Ambassador payouts in USDC stay: per verified post, from a capped budget.
- Consent and provenance are features of what brands pay for, not a business on their own.
- Licensing is dropped as a headline flow (at most a roadmap line).

**Principles** ([§3](../context/compendium_2026_10_06.md#3-principles-decided)):
1. Human review on everything; nothing posts, replies, follows or sends without approval.
2. Every draft runs through a no-AI-slop pass before a human sees it.
3. Platform rules are respected per platform; engagement features are draft-and-approve.
4. AI personas are always labelled.
5. Claims carry evidence.
6. Demo content is SFW (Colosseum rules §12).

**Product map** ([§5](../context/compendium_2026_10_06.md#5-product-map-decided-structure-tags-drive-the-build)): navigation Brand / Create / Grow / Inbox / Analytics / Ledger-Verify, with every page tagged hackathon / experimental / coming soon / roadmap. The item-by-item list lives in the [backlog](../../how/backlog/backlog.md).

## Consequences
- The hackathon build centres on Build your brand, voices, claims, campaign builder, content dashboard, the reply queue, one ambassador payout, the official registry and verify page, and the ledger.
- Lead finder and the AI influencer are experimental; unified inbox and quests are coming soon; partner invites and analytics are roadmap.
- The PRD in [issue #2](https://github.com/DeveloperAlly/solana-hack/issues/2) must be rewritten to this model.

## Ratification
Ratified by Ally Haire in chat, 2026-10-06
