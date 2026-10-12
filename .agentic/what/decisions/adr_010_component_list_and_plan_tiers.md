---
type: adr
status: accepted
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [adr, backlog, pricing, voice]
---
> **Status: accepted.** The backlog is the single component list; the new rows added on 2026-10-12 are accepted; the launch plan tiers are Free, Solo, Team and Add-on; voice starts from templates and climbs a measured ladder; 9 voice dimensions is canonical.

# ADR-010: One component list, launch plan tiers, voice ladder

## Context
- Components were decided across several docs and issues (compendium §5, ADR-003, the architecture, the backend map, `spec/api/`, PRD #2, issues #31 to #39, research 10) and a doc outside the repo, and decided components kept being missed ([issue #54](https://github.com/DeveloperAlly/solana-hack/issues/54)).
- JamJam has to launch as a paid product; competitors price per seat or by credits ([research 10](../context/research/10_competitor_onboarding_pricing.md) §3).
- Research 06 defines 12 voice templates on 9 dimensions, with claims strictness used as a gate ([research 06](../context/research/06_voice_templates.md)); retrieval beats fine-tuning while brands have little data ([architecture §6.2](../context/brand_builder_architecture.md)).

## Decision
1. **One list.** [backlog.md](../../how/backlog/backlog.md) is the single list of JamJam components, with status on main, plan tier, reuse, done check and source. The compendium §5 table stays as the 2026-10-06 record.
2. **New rows accepted.** Every backlog row tagged "accepted 2026-10-12" is accepted into scope; its phase is in backlog §15.
3. **Plan tiers.** Free (build the kit, Verify), Solo (one brand, Run and Prove), Team (seats, approvals by role, ambassadors), Add-on (paid by use: video, avatars, paid X posts). Prices are not set by this ADR.
4. **Voice ladder.** The proof of concept starts from voice templates; existing open-source template sets are adopted where licence and format fit, and only the gaps are authored. Each later rung (voice pack from the brand's own writing, retrieval and learned rules, then optional fine-tuning) is added only when the evaluation harness shows it beats the rung before.
5. **Voice dimensions.** 9 dimensions is canonical: 8 dials plus claims strictness, which works as a gate. The code already matches.

## Consequences
- New work is added to the backlog, not to a new list; a row's status changes in the same PR as the code.
- The proposed architecture sections (§6.1, §6.2, §7.1, §13) and backend map §10 are not ratified by this ADR; they await the owner.
- Pricing, billing provider and stablecoin subscriptions (research 10 N12 to N14, backend map G-BILLING) stay open.

## Ratification
Ratified by Ally Haire in a working session, 2026-10-12 (answers to the scope questions: all proposed rows accepted; plan tiers "Accept as proposed"; voice "should be a template first in poc ... then use a ladder to make it better and better"; voice dimensions "9 dimensions").
