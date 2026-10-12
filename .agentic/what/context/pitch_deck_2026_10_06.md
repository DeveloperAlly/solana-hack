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
| 1 | Cover | JamJam. "Your brand team, in one app. Every post provably yours." Build your brand. Run it. Prove it on Solana. Brand kit v1 card | |
| 2 | Problem | "Building a brand takes a team. Most people build theirs alone." Three options: agency, do it yourself, AI writer ("I end up changing 90% of what is generated"). Research quotes: "Some slop patterns appear over 1,000x more frequently in LLM output than human text" (Paech et al., Antislop, ICLR 2026, arXiv 2510.15061); "[LLMs] struggle with nuanced, informal writing in blogs and forums" (Park et al., EMNLP 2025 Findings, arXiv 2509.14543) | The headline is the pitch's positioning premise (owner-approved, 2026-10-12), not a measured fact; agency cost is not sourced. Support: solo founders stitch point tools at $10–65 each because no product does the brand team's job ([research 04](./research/04_brand_hub_landscape.md) §5a–b, §6). Quote: Blaze review on [Capterra](https://www.capterra.com/p/10013921/Blaze/reviews/), via research 04 §3 |
| 3 | Solution | "JamJam is the brand team you couldn't afford." Your brand, defined (from your site or from scratch, every fact sourced) · Content that sounds like you (every claim backed) · Everyone on-brand (team, partners and ambassadors write from your kit; you approve) · Proof it's really you (approved work publicly verifiable, so impersonators stand out) | [ADR-002](../decisions/adr_002_purpose_build_run_prove.md), [ADR-003](../decisions/adr_003_superhub_business_model.md) |
| 4 | How it works | "Your brand kit starts from what you've already published." Found: you confirm · Missing: we ask · You sign off | [Brand Builder architecture](./brand_builder_architecture.md) |
| 5 | Why now | "AI made content free. Trust is now the scarce thing." $3.5B US imposter losses (2025) · ~$1B from business impersonators · Jan 2026: X barred apps that reward people for posting | [FTC](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-data-show-people-reported-losing-3-point-5-billion-imposter-scams-2025), [X developer policy](https://docs.x.com/developer-terms/policy) |
| 6 | Why Solana | "Solana makes your brand provable and payable." Trust: verified official accounts and content, once the brand proves it owns its domain and accounts (designed: wireframe Verify-4); verified AI persona · Money: USDC tips; rewards for real content, disclosed and approved, off X · Your voice: AI agents license your voice per call; stablecoin plans | [Solana Attestation Service](https://solana.com/news/solana-attestation-service); [compendium §2, §5](./compendium_2026_10_06.md); [SWOT](./swot.md) (x402 agent licensing) |
| 7 | Solana Integration | "Proof is live on Solana. Payments are next." Today: official records, email sign-in, live verification · Next: verified accounts, ambassador payouts in USDC, open record · Later: USDC tips, voice licensing (x402), stablecoin plans | [ADR-006](../decisions/adr_006_wallet_identity_split.md); [architecture §7](./brand_builder_architecture.md#7-proof-layer-what-gets-registered-when); WL-ASSET: [backlog L9](../../how/backlog/backlog.md); [#76](https://github.com/DeveloperAlly/solana-hack/issues/76), [#77](https://github.com/DeveloperAlly/solana-hack/issues/77); tip Blinks: [archived roadmap](./archive/roadmap_story_studio.md) |
| 8 | Go to market | "Launch in web3, where proof matters most. Then every personal brand." +1,400% impersonation scams in web3 · $20–49/mo already paid for one AI writing tool · 3–4 tools stitched together · Customer zero: the owner, starting with JamJam and aDNA | [Chainalysis](https://www.chainalysis.com/blog/crypto-scams-2026/), [research 10](./research/10_competitor_onboarding_pricing.md) §6, [research 04](./research/04_brand_hub_landscape.md) §5–6 |
| 9 | Competition | "Others build, run, prove or pay. JamJam does all four." Table of 59 products checked | [Research 10](./research/10_competitor_onboarding_pricing.md) §3 |
| 10 | Business model | "Free to start. Paid once your brand is running." Free $0 · Solo $39/mo · Team $199/mo · 3% on tips and rewards (launch prices; owner to confirm). Flywheel: free kit; verified posts carry a check-it badge; refer a friend, both get 2 months free | Tiers: ADR-010 ([PR #55](https://github.com/DeveloperAlly/solana-hack/pull/55)); bands: [research 10](./research/10_competitor_onboarding_pricing.md) §6 |
| 11 | Roadmap | "Every release adds a role to your brand team." Now: your brand kit · Next: content you approve unedited · Then: publish everywhere; tips and fan rewards · Later: monetise your voice | Backlog phases 1 to 5 ([PR #55](https://github.com/DeveloperAlly/solana-hack/pull/55)); tips and fan rewards: [#76](https://github.com/DeveloperAlly/solana-hack/issues/76); agents licensing the kit: [#77](https://github.com/DeveloperAlly/solana-hack/issues/77) |
| 12 | Team and ask | "Built by a founder who has shipped this before." Lilypad · original Waterlily.ai · IBM and Filecoin Foundation. Ask: founders and creators who want their brand run for them | [Crowdfund Insider](https://www.crowdfundinsider.com/2024/08/227734-ally-haire-from-lilypad-shares-perspective-on-significance-of-open-source-ai-and-importance-of-accessing-compute-power/), [SiliconANGLE](https://siliconangle.com/2023/04/27/new-waterlily-service-offers-ai-image-generation-pays-royalties-artists/), [go-to-market §9](./gtm_2026_10_12.md#9-team) |

## Appendix (not spoken)
Five sections after a contents slide. Product screens come from the [wireframe canvas](./links.md), with wireframe notes and build-status labels hidden.

| # | Section | Slide | Content | Source |
|---|---|---|---|---|
| A0 | Contents | Appendix Contents | The five sections below | |
| A1 | 01 Architecture | System Architecture | Web app (React on design tokens) to an API Worker (Cloudflare, jamjam.tech) to data (Supabase Postgres, Worker-only access), one AI gateway (OpenRouter) and Solana (Attestation Service on devnet via Helius; a server Registrar signs). Sign-in by email code; deploy by GitHub Actions with Playwright and registry self-tests; evaluation gates on every prompt or model change. Nothing reaches Solana unless a person approved it | [Architecture §2, §6.1, §7, §13](./brand_builder_architecture.md); [ADR-005](../decisions/adr_005_ui_component_system.md); [ADR-006](../decisions/adr_006_wallet_identity_split.md) |
| A2 | 02 UI Highlights | Brand Sign-Off | "Three decisions. You make them; JamJam does the rest." Screen: J5 Approve kit | Wireframe J5-Approve-Kit |
| A3 | 02 UI Highlights | On-Voice Content | "Posts you approve without rewriting." Approved voice; claims without evidence blocked. Screen: J6 First post | Wireframe J6-First-Post |
| A4 | 02 UI Highlights | Ambassador Seats | "More voices, still on-brand." Off-brand claims and missing disclosures caught before approval. Screen: Amb-3 Generate | Wireframe Amb-3-Generate |
| A5 | 02 UI Highlights | Post Verification | "Your audience can tell you from a fake." Paste a post or link: Official only when it matches approved text from your verified accounts (account verification is designed: WL-ACCOUNT, wireframe Verify-4; today Verify matches exact approved text). Screen: J7 Prove | Wireframe J7-Proof |
| A6 | 02 UI Highlights | Public Ledger | "A record of what's official that no one can quietly rewrite." Screen: Ledger | Wireframe Ledger |
| A7 | 03 User Onboarding | Onboarding Journey | Read, Save, Confirm, Gaps and Voice, Approve Kit, First Post, Prove. Screen: J3 Confirm | Wireframes J1 to J7 |
| A8 | 04 Intelligence Architecture | Intelligence Pipeline | Brand kit: Ingestor, Evidence Store, Gap Analyst, Interviewer, Drafters, owner's gates. Every post: voice draft (voice spec plus retrieved approved posts, best of 3), anti-slop pass, claims gate, owner approval (edits become learned rules), registry | [Architecture §2, §6, §6.1](./brand_builder_architecture.md) |
| A9 | 04 Intelligence Architecture | Voice Learning Ladder | Voice templates; then a voice spec from your posts, retrieval and learned rules; then a shared anti-slop house writer (with consent); then per-brand models. Hard gates: 0 invented facts kept, 0 false "official", 95% recall on unsupported claims | [Architecture §6.2, §13](./brand_builder_architecture.md) |
| A10 | 05 Future Features | Future Features | Direct publishing, unified inbox, analytics, carousels and video, ambassador campaigns, USDC tips, voice licensing, verified AI persona, stablecoin plans | [Backlog](../../how/backlog/backlog.md); [#76](https://github.com/DeveloperAlly/solana-hack/issues/76), [#77](https://github.com/DeveloperAlly/solana-hack/issues/77) |

## Before recording
- [ ] Owner: confirm the launch prices on the Business model slide (10) and the ask on the Team and ask slide (12).
- [ ] Re-check the Superteam Earn sponsor count on the day.
- [ ] The demo video is separate and recorded on jamjam.tech ([#60](https://github.com/DeveloperAlly/solana-hack/issues/60)).
