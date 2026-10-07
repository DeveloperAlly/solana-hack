---
type: review
status: active
created: 2026-10-06
updated: 2026-10-07
last_edited_by: agent
tags: [review, vc, judging, colosseum, deck]
---
> **Status: active.** VC and hackathon-judge review of the wireframes and docs (2026-10-06). It informs the [pitch deck v2](./pitch_deck_2026_10_06.md) and [ADR-007](../decisions/adr_007_pitch_positioning.md), not the build scope; current scope is in [STATE.md](../../../STATE.md).

# VC and judge review (2026-10-06)

**Inputs:** the [wireframes canvas](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn) (57 artboards and notes), [compendium](./compendium_2026_10_06.md), [ADR-002](../decisions/adr_002_purpose_build_run_prove.md), [ADR-003](../decisions/adr_003_superhub_business_model.md), [Brand Builder architecture](./brand_builder_architecture.md), [wireframe audit](./wireframe_audit_2026_10_06.md), [SWOT](./swot.md), [backlog](../../how/backlog/backlog.md), [research 01–09](./research/README.md), plus web sources listed at the end. Live editable copy: [review doc](https://claude.ai/artifact/XwyymJ6rGuofXCCvAcctDK) (owner access).

## Owner responses (2026-10-06)
- **End to end:** the owner disagrees that the product lacks a wedge. No one runs the whole loop ([research 04](./research/04_brand_hub_landscape.md) agrees). The deck now makes end to end the differentiator and leads the sale with crypto and developer brands.
- **Scope, ICP, traction:** recommendations 1 and 4 in the summary (cut to one loop; outside design partners) were not adopted. Waterlily is for the owner's own use first ([STATE.md](../../../STATE.md)).
- **Registry:** Solana Attestation Service, with memo as the fallback, was adopted ([STATE.md](../../../STATE.md)).

## Summary (as written)
The part nobody owns is "prove": a brand-issued, public record of what is official, tied to paying people for verified work. That is also the part a Solana judge scores highest. Recommendations:
1. Cut the build to one loop: kit v1, approved post, onchain attestation, public verify page, one USDC payout for verified off-X work. *(Not adopted.)*
2. Build the registry on the Solana Attestation Service (SAS), with Waterlily as credential issuer. *(Adopted, memo fallback.)*
3. Fix screens that contradict the strategy: paid X posts, licensing-era Ledger and Verify copy, "Ally Haire" still listed as a demo brand.
4. Get outside traction: design partners outside the owner's network. *(Not adopted.)*
5. Rewrite the deck around impersonation and verified paid community work. *(Done: [pitch deck v2](./pitch_deck_2026_10_06.md).)*

## 1. VC view

**Feasibility.** Every piece is buildable with current tools. The 6-day schedule is the risk. Exact-text fingerprints break on any edit or platform reformatting, and impersonators publish new content rather than copies, so "not found" proves little (Verify-2 says this itself).

**Market.**

| Pool | Size | Source |
|---|---|---|
| US influencer marketing (brand payments to creators) | $10.52B in 2025 (forecast), +15.7% forecast for 2026 | [eMarketer](https://www.emarketer.com/press-releases/us-influencer-marketing-spending-will-surpass-10-billion-in-2025) |
| Social media management software | $29.9B in 2025 (vendor estimate) | [Grand View Research](https://www.grandviewresearch.com/industry-analysis/social-media-management-market-report) |
| Brand management software | $4.75B in 2026 (vendor estimate) | [Research and Markets](https://www.researchandmarkets.com/reports/6011121/brand-management-software-market-global) |
| Superteam Earn (Solana) accounts | 2,730+ sponsors, 233,210+ registered talent (accounts, not completed payments) | [Superteam Earn](https://superteam.fun/earn) |
| US impersonation losses | $3.5B imposter losses in 2025, nearly $1B from business impersonators | [FTC](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-data-show-people-reported-losing-3-point-5-billion-imposter-scams-2025) |
| Crypto impersonation | Impersonation scams up 1,400% year on year in 2025 | [Chainalysis](https://www.chainalysis.com/blog/crypto-scams-2026/) |

**Gaps and fixes.**

| # | Gap | Fix |
|---|---|---|
| 1 | "No one covers everything" is true ([research 04](./research/04_brand_hub_landscape.md)), but buyers switch for one sharp job | Keep end to end as the differentiator; lead the sale with proving what's official and paying for verified community work |
| 2 | Buyer unclear (solo founders, brands with ambassador budgets, enterprises) | Sell first to crypto and developer brands: crypto impersonation is up 1,400% ([Chainalysis](https://www.chainalysis.com/blog/crypto-scams-2026/)), and they already fund community work ([Superteam Earn](https://superteam.fun/earn) sponsors) |
| 3 | AI brand generation is a commodity (Google Pomelli, Jasper) | Differentiate on evidence: every claim tied to a source and attested |
| 4 | No price; payout fee dropped with licensing | Subscription per brand plus a fee on payout volume (placeholders until tested) |
| 5 | Direction changed three times in about three days (ADR-000 to ADR-003) | Frame it as research-led: licensing was killed because no one paid per piece |
| 6 | Platform dependency: X bars paying for X actions and charges $0.20 per API link post; LinkedIn closes member-post reads; personal WhatsApp and LinkedIn inbox access risks bans ([research 03](./research/03_platform_performance.md), [research 04](./research/04_brand_hub_landscape.md)) | Pay only for off-X work; keep inbox and engagement out of the pitch |
| 7 | Brand-risk features (Flirty template, AI influencer, lead finder) distract | Keep them labelled experimental, out of the deck and demo |
| 8 | Moat unstated | Network effect: once wallets, explorers and extensions read Waterlily's attestations, the registry is where "official" is checked |
| 9 | Colosseum backs full-time teams ([Colosseum](https://blog.colosseum.com/how-to-win-a-colosseum-hackathon/)) | Name who builds full-time |

## 2. Judge view

Colosseum publishes 7 criteria but no weightings; overall prizes are judged in one pool across all chains; the Solana track pays 10 prizes of $10K ([Colosseum](https://colosseum.com/hackathon), [World's Fair](https://colosseum.com/worldsfair)). Scores below are the reviewer's estimate (1–5), not Colosseum's.

| Criterion | Before | After fixes | Why |
|---|---|---|---|
| Founder + market fit | 4 | 4 | Lilypad founder ([Crowdfund Insider](https://www.crowdfundinsider.com/2024/08/227734-ally-haire-from-lilypad-shares-perspective-on-significance-of-open-source-ai-and-importance-of-accessing-compute-power/)); original Waterlily.ai, 2023 ([SiliconANGLE](https://siliconangle.com/2023/04/27/new-waterlily-service-offers-ai-image-generation-pays-royalties-artists/), [research 09](./research/09_demo_brands.md)); brand work for aDNA ([ADR-002](../decisions/adr_002_purpose_build_run_prove.md)) |
| Insight | 2 | 4 | "Official should be a public record that survives metadata stripping" |
| Product + execution | 2 | 3–4 | Judged only on work done during the event; one loop must work end to end |
| Potential market size | 3 | 3–4 | Name the spend pool, not tools markets |
| Founder communication | 2 | 4 | One problem, one loop, one Solana reason |
| Viability | 2 | 3 | Needs a price and a named buyer |
| Traction | 1 | 2–3 | Own-use numbers from Waterlily and aDNA |

**What Solana wants.**
- **SAS:** live on mainnet since May 2025; named use cases are KYC, sybil resistance, accreditation and reputation, not brand provenance ([Solana](https://solana.com/news/solana-attestation-service)). A brand registry on SAS is a new use of a Foundation-backed primitive.
- **Stablecoin payments and allowances** are a 2026 focus, including "Subscriptions & Allowances" ([Solana](https://solana.com/news/solana-ecosystem-roundup-june-2026)). Capped, brand-signed USDC payouts ([ADR-006](../decisions/adr_006_wallet_identity_split.md)) fit that focus; a delegated allowance would map onto it more directly, but is not the current design.
- **Creator economy and identity** sit in the Request for Startups, last updated Aug 2024 ([Solana](https://solana.com/solutions/request-for-startups)).
- **No winner in the five Solana hackathons reviewed** pairs a brand registry with verified payouts; closest are Banger.lol (Renaissance), Attest Protocol (Radar) and Clipstake (Breakout) ([Renaissance](https://blog.colosseum.com/renaissance-winners-gameshift-google-cloud/), [Radar](https://blog.colosseum.com/announcing-the-winners-of-the-solana-radar-hackathon/), [Breakout](https://blog.colosseum.com/announcing-the-winners-of-the-solana-breakout-hackathon/), [Cypherpunk](https://blog.colosseum.com/announcing-the-winners-of-the-solana-cypherpunk-hackathon/), [Frontier](https://blog.colosseum.com/announcing-the-winners-of-the-solana-frontier-hackathon/)).

**Screen gaps found.**

| Where | Issue | Fix |
|---|---|---|
| Amb-4 Publish, Ledger | Ambassadors paid for X posts; conflicts with X's developer policy and the compendium's off-X rule | Remove X as a paid route |
| Ledger, Verify-1, Onboard-5 | Licensing-era copy (license fees, 90/10 split, consent, "voice pack") | Ledger lists registrations and payouts; Verify shows brand, kit version, approver, attestation |
| Landing | Solana only in a footer box | Show the verify badge above the fold |
| Ledger switcher, landing | Founder's personal brand listed as a demo brand; Waterlily missing | Waterlily, aDNA, film.fun, GamersLab ([compendium §4](./compendium_2026_10_06.md)) |
| Hub-Home, Ledger | Some sample numbers unlabelled | Label sample data or use devnet transactions |
| Verify | Exact fingerprint only | Add "is this account or wallet official?" lookups |
| Influencer-Setup | Flirty voice on an AI persona | Keep out of the demo (Colosseum's SFW rule for this event is unverified) |
| Submission | Mainnet requirement and SFW rules unverified | Ask in Colosseum's Discord |

## Sources
- [Colosseum Crypto World's Fair](https://colosseum.com/worldsfair) · [Colosseum hackathon criteria](https://colosseum.com/hackathon) · [How to win a Colosseum hackathon](https://blog.colosseum.com/how-to-win-a-colosseum-hackathon/) · [Perfecting your hackathon submission](https://blog.colosseum.com/perfecting-your-hackathon-submission/) · [Breakout winners](https://blog.colosseum.com/announcing-the-winners-of-the-solana-breakout-hackathon/)
- [Solana Attestation Service](https://solana.com/news/solana-attestation-service) · [Solana ecosystem roundup, June 2026](https://solana.com/news/solana-ecosystem-roundup-june-2026) · [Solana Request for Startups](https://solana.com/solutions/request-for-startups)
- [FTC imposter scam data, 2025](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-data-show-people-reported-losing-3-point-5-billion-imposter-scams-2025) · [FTC Endorsement Guides](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking) · [Chainalysis crypto scams 2026](https://www.chainalysis.com/blog/crypto-scams-2026/)
- [eMarketer](https://www.emarketer.com/press-releases/us-influencer-marketing-spending-will-surpass-10-billion-in-2025) · [Grand View Research](https://www.grandviewresearch.com/industry-analysis/social-media-management-market-report) · [Research and Markets](https://www.researchandmarkets.com/reports/6011121/brand-management-software-market-global) · [Superteam Earn](https://superteam.fun/earn)
- [Kaito shuts Yaps, launches Kaito Studio](https://www.kucoin.com/news/flash/kaito-to-shut-down-yaps-and-incentive-rankings-launch-kaito-studio) · [X automation rules](https://help.x.com/en/rules-and-policies/x-automation)
