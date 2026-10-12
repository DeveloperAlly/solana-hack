---
type: adr
status: proposed
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [adr, pricing, referrals, promotions, gtm]
---
> **Status: proposed, awaiting the owner's ratification.** Until the owner ratifies it, the deck, pitch script and go-to-market plan present these offers as proposed, not as terms.

# ADR-014: Referral offer and launch promotions

The number 14 avoids ADR-012 and ADR-013, which were drafted on [#86](https://github.com/DeveloperAlly/solana-hack/pull/86) and [#88](https://github.com/DeveloperAlly/solana-hack/pull/88). Their current state is in [STATE.md](../../../STATE.md).

## Context
- The pitch deck (slide 10), the [go-to-market plan](../context/gtm_2026_10_12.md) §4 and §5, and backlog row S6a describe a refer-a-friend offer and other launch promotions.
- [ADR-010](./adr_010_component_list_and_plan_tiers.md) sets the plan tiers (Free, Solo, Team, Add-on) but leaves prices and offers open.
- The owner's slide 8 title names "Referral & rewards programs for growth". The specific terms below were drafted by an agent. AGENTS.md reserves decisions like these for the owner.

## Decision (proposed)
1. **Refer a friend.** When a referred founder subscribes to Solo or Team, the referrer and the referred founder each get 2 months free on their plan. Credits are applied by hand from a referral code given at sign-up, until backlog S6a (a referral link, attribution and automatic credits) ships.
2. **Founding 100 brands.** The first 100 paying brands keep the launch price for 12 months.
3. **Colosseum teams.** Team is free for 3 months.
4. **Verified-ambassador launch.** The first brands get ambassador seats free while they set up their program.
5. **Not offered.** Lifetime deals.

## Consequences
- If ratified: backlog S6a moves from proposed to accepted, and the deck and go-to-market plan drop the "proposed" label.
- If rejected or changed: slide 10's flywheel line, the go-to-market plan §4 and §5, and backlog S6a change to match.
- Prices stay open under ADR-010 either way.

## Ratification
Pending owner ratification.
