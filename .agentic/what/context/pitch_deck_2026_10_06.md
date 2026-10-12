---
type: deck
status: draft
created: 2026-10-06
updated: 2026-10-12
last_edited_by: agent
tags: [deck, pitch, colosseum]
---
> **Status: draft.** Pitch deck v3 for the Colosseum submission: 10 slides, about 2:56 spoken. Built from the [VC and judge review](./vc_judge_review_2026_10_06.md), [research 10](./research/10_competitor_onboarding_pricing.md) and the owner's review of 2026-10-12. Every spoken word is in the [pitch script](./pitch_script_2026_10_12.md). Placeholders in [brackets] still need real values.

# Pitch deck v3: JamJam, build your brand, run it, prove it

**Editable deck:** [JamJam: build, run, prove](https://claude.ai/artifact/4QPRrRAXx8VF4PsKf5qZ8d) (Slides artifact, owner access). This file mirrors its text and speaker notes so the repo holds the pitch. The deck is the source of truth for layout; update both when the words change.

**Look:** wireframe, matching the site's `wireframe` theme ([`web/src/tokens/themes/wireframe.json`](../../../web/src/tokens/themes/wireframe.json)): white `#ffffff`, ink `#1a1a1a`, greys `#595959` / `#8a8a8a` / `#bdbdbd`, no colour. Arial (body and display, standing in for the site's system font), IBM Plex Mono (labels). Each slide sits in an outlined artboard frame with its frame name above; solid outlines for real things, dashed for placeholders, crossed boxes for screenshots to come; black fill marks the onchain steps and JamJam's own row ([ADR-009](../decisions/adr_009_rename_jamjam.md)).

**Story:** AI made it free to sound like any brand, and ambassador programs run on trust nobody can check. JamJam runs the whole ambassador program: build the kit, create approved posts, record them on Solana so anyone can check what's official, then pay ambassadors in USDC per verified piece. No one else runs all four ([research 10](./research/10_competitor_onboarding_pricing.md)). The sale leads with crypto and developer brands ([ADR-007](../decisions/adr_007_pitch_positioning.md)).

## Slides
Speaker notes are the [pitch script](./pitch_script_2026_10_12.md), word for word.

| # | Slide | On screen | Sources |
|---|---|---|---|
| 1 | Cover | JamJam. Build your brand. Run it. Prove it. "The official record for brand content, on Solana." Verify card: "Is this official?" jamjam.tech | |
| 2 | Problem: impersonation | "AI made it free to sound like any brand." $3.5B US imposter-scam losses reported in 2025 · ~$1B from business impersonators · +1,400% crypto impersonation scams | [FTC](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-data-show-people-reported-losing-3-point-5-billion-imposter-scams-2025), [Chainalysis](https://www.chainalysis.com/blog/crypto-scams-2026/) |
| 3 | Problem: ambassador programs | "Ambassador programs run on trust nobody can check." You're liable for every post · Real and fake look the same · Jan 2026: pay-per-post broke (X cut off apps that pay for posting; Kaito shut its leaderboards) | [FTC Endorsement Guides](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking), [X automation rules](https://help.x.com/en/rules-and-policies/x-automation), [KuCoin News](https://www.kucoin.com/news/flash/kaito-to-shut-down-yaps-and-incentive-rankings-launch-kaito-studio) |
| 4 | Product | "Brand kit to paid ambassador, in one place." 1 Build (live) · 2 Approve (live) · 3 Create (live) · 4 Prove, recorded on Solana (live, devnet) · 5 Pay, USDC per verified piece (designed) | Live: [STATE.md](../../../STATE.md); designed: [wireframes](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn) |
| 5 | Check a post | "Paste any post. Get a straight answer." Official · approved from brand kit v1 · checked against its record on Solana, not our database (simplified product screen) | Verify reads the attestation back from Solana before it says Official: [`posts.ts`](../../../web/worker/posts.ts) `verifyText` |
| 6 | Why Solana | "Real brands, paying real people, in stablecoins." Payments: new USDC volume · Trust: a public record of "official" · Adoption: businesses on Solana, no crypto skills | [Solana ecosystem roundup, June 2026](https://solana.com/news/solana-ecosystem-roundup-june-2026), [Solana Attestation Service](https://solana.com/news/solana-attestation-service) |
| 7 | First customers | "Crypto and developer brands first. They feel it most." +1,400% · 2,730+ Superteam Earn sponsors · Jan 2026 X ban. Starting with: aDNA, film.fun and GamersLab (case-study brands run by people who agreed to take part; not paying, no signed agreements); then Superteam sponsors | [Chainalysis](https://www.chainalysis.com/blog/crypto-scams-2026/), [Superteam Earn](https://superteam.fun/earn) (checked 6 Oct 2026, account counts), [SWOT](./swot.md) (launch brands), [research 09](./research/09_demo_brands.md) |
| 8 | Competition | "The best do two steps. Nobody runs the whole program." Pressmaster, Google Pomelli, Sprout Social and Buffer, Galxe, Superteam Earn and Zealy, Encypher and Adobe Content Credentials, rated on build, create, prove and pay; JamJam: yes, yes, yes, designed | [Research 10](./research/10_competitor_onboarding_pricing.md) §3 |
| 9 | Business model | "Free to start. Paid when the program runs." Free $0 · Solo $39/mo · Team $199/mo · payouts: ambassador keeps 100%, brand pays 3% (test prices). Base case: 13 / 52 / 160 paying brands and $1.1k / $4.7k / $16.2k MRR at day 90 / 180 / 365 | Tiers: ADR-010 ([PR #55](https://github.com/DeveloperAlly/solana-hack/pull/55)); price bands: [research 10](./research/10_competitor_onboarding_pricing.md) §6; forecast workings: [go-to-market](./gtm_2026_10_12.md) |
| 10 | Team and close | "Built by a founder who has shipped this before." Ally Haire: founder and former CEO, Lilypad Network · built the original Waterlily.ai (2023) · Lead Developer Advocate APAC at IBM; Filecoin Foundation. Build your brand. Run it. Prove it. jamjam.tech | [Crowdfund Insider](https://www.crowdfundinsider.com/2024/08/227734-ally-haire-from-lilypad-shares-perspective-on-significance-of-open-source-ai-and-importance-of-accessing-compute-power/), [SiliconANGLE](https://siliconangle.com/2023/04/27/new-waterlily-service-offers-ai-image-generation-pays-royalties-artists/), [Waterlily repo](https://github.com/bacalhau-project/Waterlily); IBM and Filecoin Foundation roles: [go-to-market §9](./gtm_2026_10_12.md#9-team) (owner statement, 2026-10-12) |

## Before recording
- [ ] Owner: confirm or change the test prices on slide 9.
- [ ] Owner: confirm aDNA, film.fun and GamersLab may be named on slide 7.
- [ ] Re-check the Superteam Earn sponsor count on the day.
- [ ] The demo video is separate and is recorded on jamjam.tech ([#60](https://github.com/DeveloperAlly/solana-hack/issues/60)).
