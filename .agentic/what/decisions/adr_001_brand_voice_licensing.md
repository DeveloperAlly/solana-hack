---
type: adr
status: superseded
created: 2026-10-05
updated: 2026-10-06
last_edited_by: agent
tags: [adr, product-direction, licensing, ambassadors]
supersedes: adr_000_story_studio
superseded_by: [adr_002_purpose_build_run_prove, adr_003_superhub_business_model]
---
> **Status: superseded** by [ADR-002](./adr_002_purpose_build_run_prove.md) and [ADR-003](./adr_003_superhub_business_model.md). Waterlily for Brands with licensing and ambassador payouts (PRD v2.1).

# ADR-001: Waterlily for Brands (voice licensing and ambassador payouts)

## Context
Story Studio (ADR-000) was narrowed to authors. A brand-focused version offered a larger B2B market and a clearer use of Solana for payments ([SWOT](../context/swot.md)).

## Decision
**Waterlily for Brands:** a brand registers a consented voice pack. Partners pay a licence fee to generate content in that voice (Paid / Charity / Split / Free modes), and brands run sponsored campaigns that pay ambassadors in USDC per verified post, with content fingerprints recorded onchain. Recorded as PRD v2.1 in [issue #2](https://github.com/DeveloperAlly/solana-hack/issues/2); wireframe and deck prompts in [design prompts v1, archived](../context/archive/design_prompts_v1.md).

## Consequences
- The SWOT flagged X's Jan 2026 InfoFi ban as the biggest risk to paying for X posts, and recommended curated, off-X, disclosed payouts ([SWOT](../context/swot.md)).
- Research found no evidence that outsiders pay a brand per piece to write in its voice, so licensing was dropped as a headline flow ([compendium §2](../context/compendium_2026_10_06.md#2-business-model-decided)).
- Replaced by ADR-002 (purpose) and ADR-003 (business model and product map). USDC ambassador payouts carry over.

## Ratification
Recorded retrospectively on 2026-10-06 from PRD v2.1 (issue #2), before the ADR process existed. Superseded; no ratification needed.
