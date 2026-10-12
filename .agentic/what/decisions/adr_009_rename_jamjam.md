---
type: adr
status: accepted
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [adr, naming, brand]
---
> **Status: accepted.** The product is renamed JamJam, after its live domain jamjam.tech, and its brand look is wireframe black and white.

# ADR-009: Rename to JamJam; wireframe brand

## Context
- The app already runs on jamjam.tech, which superseded the waterlily.ai hosting ([STATE.md](../../../STATE.md), hosting decision; [PR #6](https://github.com/DeveloperAlly/solana-hack/pull/6)).
- waterlily.ai returned HTTP 402 when researched ([research 09](../context/research/09_demo_brands.md)), and two reviewers flagged the deck's waterlily.ai call to action as sending judges away from the live demo ([PR #8](https://github.com/DeveloperAlly/solana-hack/pull/8)).
- The site ships a greyscale `wireframe` theme ([`web/src/tokens/themes/wireframe.json`](../../../web/src/tokens/themes/wireframe.json)).

## Decision
1. **Name:** the product is JamJam; its address is jamjam.tech.
2. **Look:** the brand is wireframe style, black and white, matching the site's `wireframe` theme. The pitch deck follows it.
3. **Lineage:** the original Waterlily.ai (2023) stays as the founder's credential; it is history, not the product name.

## Consequences
- [Pitch deck v2](../context/pitch_deck_2026_10_06.md) and its editable copy are renamed and restyled.
- Docs and the README were renamed in [PR #20](https://github.com/DeveloperAlly/solana-hack/pull/20). On-chain and infrastructure names keep the old name on purpose (the SAS credential `WATERLILY`, the `WL-*` schemas, the Cloudflare Worker `waterlily`); see [STATE.md](../../../STATE.md).

## Ratification
Ratified by Ally Haire in chat, 2026-10-12 ("I'm renaming this project to JamJam -> its hosted on jamjam.tech").
