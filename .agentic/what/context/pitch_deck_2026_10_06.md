---
type: deck
status: draft
created: 2026-10-06
updated: 2026-10-12
last_edited_by: agent
tags: [deck, pitch, colosseum]
---
> **Status: draft.** Pitch deck for the Colosseum submission. Built from the [VC and judge review](./vc_judge_review_2026_10_06.md), [research 10](./research/10_competitor_onboarding_pricing.md) and the owner's review of 2026-10-12. Every spoken word, with its timing, is in the [pitch script](./pitch_script_2026_10_12.md). Placeholders in [brackets] still need real values.

# Pitch deck v4: JamJam, build your brand, run it, prove it

**Editable deck:** [JamJam: build, run, prove](https://claude.ai/artifact/4QPRrRAXx8VF4PsKf5qZ8d) (Slides artifact, owner access). This file mirrors its text and speaker notes so the repo holds the pitch. The deck is the source of truth for layout; update both when the words change.

**Look:** wireframe, matching the site's `wireframe` theme ([`web/src/tokens/themes/wireframe.json`](../../../web/src/tokens/themes/wireframe.json)): white `#ffffff`, ink `#1a1a1a`, greys `#595959` / `#8a8a8a` / `#bdbdbd`, no colour. Arial (body and display, standing in for the site's system font), IBM Plex Mono (labels). Each slide sits in an outlined artboard frame with its frame name above; solid outlines for real things, dashed for placeholders, crossed boxes for screenshots to come; black fill marks the onchain steps and JamJam's own row ([ADR-009](../decisions/adr_009_rename_jamjam.md)).

**Story:** every founder needs a brand team and few can afford one. JamJam is the brand team in one app: it builds the brand from the founder's own site, runs content in that voice, proves what's official and pays the community. The pitch sells the product as it will be built (backlog phases 1 to 5, [PR #55](https://github.com/DeveloperAlly/solana-hack/pull/55)); the demo video shows what runs today. Teardown and answers: [pitch VC teardown](../../../audits/2026-10-12_pitch-vc-teardown.md).

## Slides
Speaker notes are the [pitch script](./pitch_script_2026_10_12.md), word for word.

| # | Slide | On screen | Sources |
|---|---|---|---|
| 1 | Cover | JamJam. "Your brand team, in one app." Build your brand. Run it. Prove it. Brand kit v1 card | |
| 2 | Problem | "Every founder needs a brand team. Few can afford one." Agency · DIY · AI writer ("I end up changing 90% of what is generated") | The headline is the pitch's positioning premise (owner-approved, 2026-10-12), not a measured fact; agency cost is not sourced. Support: solo founders stitch point tools at $10–65 each because no product does the brand team's job ([research 04](./research/04_brand_hub_landscape.md) §5a–b, §6). Quote: Blaze review on [Capterra](https://www.capterra.com/p/10013921/Blaze/reviews/), via research 04 §3 |
| 3 | Solution | "JamJam does the brand team's job." Strategy without the agency · content that sounds like you and never lies for you · everywhere, provably yours · a community that sells for you (ambassadors post from the kit as seats; the brand approves; every post is verified as the brand's) | [ADR-002](../decisions/adr_002_purpose_build_run_prove.md), [ADR-003](../decisions/adr_003_superhub_business_model.md) |
| 4 | How it works | "It reads before it asks." A found fact with its quote from jamjam.tech; found: confirm · missing: we ask · you sign off | [Brand Builder architecture](./brand_builder_architecture.md) |
| 5 | Why now | "AI made content free. Trust is now the scarce thing." $3.5B US imposter losses (2025) · ~$1B from business impersonators · Jan 2026: X barred apps that reward people for posting | [FTC](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-data-show-people-reported-losing-3-point-5-billion-imposter-scams-2025), [X developer policy](https://docs.x.com/developer-terms/policy) |
| 6 | Why Solana | "We don't need a blockchain to write posts. We need one where trust and money move." Trust: verified official accounts and content from the brand and its ambassadors, once the brand proves it owns its domain and accounts (account verify is designed: wireframe Verify-4); verified AI persona · Money: USDC tips; rewards for real content, disclosed and approved, off X · Monetise your voice: AI agents license your voice and brand per call, paid to you on Solana; stablecoin plans | [Solana Attestation Service](https://solana.com/news/solana-attestation-service); [compendium §2, §5](./compendium_2026_10_06.md); [SWOT](./swot.md) (x402 agent licensing) |
| 7 | Go to market | "Launch where proof matters most: crypto. Then every founder." +1,400% crypto impersonation · $20–49/mo already paid for one AI writing tool · 3–4 tools stitched today. Customer zero: the founder, starting with JamJam and aDNA | [Chainalysis](https://www.chainalysis.com/blog/crypto-scams-2026/), [research 10](./research/10_competitor_onboarding_pricing.md) §6, [research 04](./research/04_brand_hub_landscape.md) §5–6 |
| 8 | Competition | "Four tools that don't talk. Or one." Pressmaster, Google Pomelli, Sprout Social and Buffer, Galxe, Superteam Earn and Zealy, Encypher and Adobe Content Credentials on build, run, prove, pay | [Research 10](./research/10_competitor_onboarding_pricing.md) §3 |
| 9 | Business model | "Free to start. Paid every month after." Free $0 · Solo $39/mo · Team $199/mo (seats and approvals) · 3% on tips and rewards paid through JamJam (launch prices; owner to confirm). Flywheel: free kit; verified posts carry a check-it badge back to JamJam; refer a friend and you both get 2 months free ([go-to-market](./gtm_2026_10_12.md) §5) | Tiers: ADR-010 ([PR #55](https://github.com/DeveloperAlly/solana-hack/pull/55)); bands: [research 10](./research/10_competitor_onboarding_pricing.md) §6 |
| 10 | Roadmap | "From your brand kit to your whole brand team." Now: your brand kit, every fact sourced · Next: content you approve unedited · Then: publish everywhere; tips and fan rewards · Later: monetise your voice (AI agents pay per call to use your voice and brand) | Backlog phases 1 to 5 ([PR #55](https://github.com/DeveloperAlly/solana-hack/pull/55)); tips and fan rewards: [#76](https://github.com/DeveloperAlly/solana-hack/issues/76); agents licensing the kit: [#77](https://github.com/DeveloperAlly/solana-hack/issues/77) |
| 11 | Team and ask | "Built by a founder who has shipped this before." Lilypad · original Waterlily.ai · IBM and Filecoin Foundation. Ask: founders who want their brand run for them | [Crowdfund Insider](https://www.crowdfundinsider.com/2024/08/227734-ally-haire-from-lilypad-shares-perspective-on-significance-of-open-source-ai-and-importance-of-accessing-compute-power/), [SiliconANGLE](https://siliconangle.com/2023/04/27/new-waterlily-service-offers-ai-image-generation-pays-royalties-artists/), [go-to-market §9](./gtm_2026_10_12.md#9-team) |

## Before recording
- [ ] Owner: confirm the launch prices on slide 9 and the ask on slide 11.
- [ ] Re-check the Superteam Earn sponsor count on the day.
- [ ] The demo video is separate and recorded on jamjam.tech ([#60](https://github.com/DeveloperAlly/solana-hack/issues/60)).
