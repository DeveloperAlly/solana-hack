---
type: audit
status: active
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [audit, pitch, vc, colosseum]
---
> **Status: active.** A VC teardown of the JamJam pitch (2026-10-12), with the answer to each finding and where the answer now sits in the pitch. The pitch is the deck v4 ([Slides artifact](https://claude.ai/artifact/4QPRrRAXx8VF4PsKf5qZ8d)) and the [script](../.agentic/what/context/pitch_script_2026_10_12.md). Live build status is in [STATE.md](../STATE.md), not here.

# Pitch VC teardown and answers (2026-10-12)

The owner asked for a VC reading of the pitch: "why do I need a blockchain at all". Each finding below is quoted from that teardown, then answered. **The pitch sells the product as it will be built** (backlog phases 1 to 5 in [PR #55](https://github.com/DeveloperAlly/solana-hack/pull/55), the [wireframes](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn)); the separate demo video shows what runs today.

## 1. Why a blockchain at all?

**Finding.** "You don't need a blockchain to build a brand or write posts. That's the core of the product, and a database does it." The chain was framed as doing two things:
- **Prove:** the records are signed by JamJam's own server key, and nobody outside reads them yet.
- **Pay:** USDC payouts are the clearest gain from a chain, and they aren't built.

**Answer.** Correct, and the pitch now says it plainly (slide 6): *"We don't need a blockchain to write your posts. We need one where trust and money move."* The chain does two jobs in the product as designed:
- **Trust.** Every official kit, post, account and claim goes on an open record ([ADR-002](../.agentic/what/decisions/adr_002_purpose_build_run_prove.md), Prove).
  - Any wallet, exchange or app can read it without asking JamJam.
  - No one can quietly rewrite it, including JamJam, because the record and its history are public.
  - Outside readers arrive through distribution. Published posts carry a "check it" link to Verify where the channel allows links, and a check-it badge where it doesn't (X post bodies stay link-free, backlog phase 3). The record format is open, so a wallet or exchange can query it directly.
- **Money.** Brands pay partners and ambassadors in USDC, anywhere, from their own wallet, inside a set budget ([ADR-006](../.agentic/what/decisions/adr_006_wallet_identity_split.md); backlog phase 4). The gain over card and bank payouts that JamJam's design relies on is public settlement: each payment is a transfer anyone can check against the approved piece it paid for.

Brands sign in with email, so a business that never touches crypto still ends up using Solana for both jobs.

## 2. No traction

**Finding.** "The live database has 0 brands. Nobody pays, there are no letters of intent, and the three named brands are case studies."

**Answer.**
- **Before recording:** JamJam, aDNA, film.fun and GamersLab each build their kit on jamjam.tech ([compendium §4](../.agentic/what/context/compendium_2026_10_06.md#4-demo-brands-and-demo-story-decided)). That gives real kits and real records for the demo video.
- **The pitch's ask** (slide 12) is founders who want their brand run for them. A slide claiming traction we don't have would cost more credibility than it buys.

## 3. No single customer

**Finding.** "'Founders', 'crypto and developer brands' and 'brand hub' are three different buyers."

**Answer.** These are one buyer and one beachhead:
- **The buyer is the founder or small team that needs a brand team** (slides 1 to 3).
- **The first market is crypto and developer teams** (slide 8, [ADR-007](../.agentic/what/decisions/adr_007_pitch_positioning.md)). Impersonation scams in crypto grew 1,400% year on year ([Chainalysis](https://www.chainalysis.com/blog/crypto-scams-2026/)), they already run community programs, and none of their community tools does brand or content ([research 04](../.agentic/what/context/research/04_brand_hub_landscape.md) §5c).
- **After that:** every small brand.

## 4. The value is one-off, the price is monthly

**Finding.** "A brand kit gets built once. What brings them back each month is content, which is the crowded part."

**Answer.** The kit is the free hook (slide 10); the subscription pays for the brand team's ongoing work:
- content approved without editing, including posts, carousels and video;
- direct publishing to X, LinkedIn, Bluesky and Threads, and copy-and-paste-back for any other network (backlog rows P1 to P3a);
- the inbox and analytics;
- community payouts.

That is backlog phases 2 to 4 (slide 11). Competitors meter by seats or credits; JamJam includes approvals on every plan, where rivals sell them as an upgrade ([research 10](../.agentic/what/context/research/10_competitor_onboarding_pricing.md), summary item 5).

## 5. The problem slide criticises tools, not a customer's pain

**Finding.** The 90% quote "proves a competitor is weak, not that anyone will pay us."

**Answer.** Slide 2 now frames the founder's three options: an agency, doing it yourself, or an AI writer. The quote is the evidence for the third option.

**Open:** a measured cost in hours per week. The owner's own builds on jamjam.tech give the first number. Until it is measured, no time claim goes in the pitch ([PR #44](https://github.com/DeveloperAlly/solana-hack/pull/44), decision D3).

## 6. "Nobody does all four" cuts both ways

**Finding.** "A VC hears 'maybe nobody wants all four.'"

**Answer.** Slide 9 now reads "Four tools that don't talk. Or one."
- **What we have:** solo founders already pay for three or four point tools at $10–65 each ([research 04](../.agentic/what/context/research/04_brand_hub_landscape.md) §5b, §6).
- **Why joining them matters:** you can only pay for work you can prove, and only prove what was approved against the kit.

**Open:** whether buyers want the steps joined up is to be tested in the planned founder interviews ([go-to-market](../.agentic/what/context/gtm_2026_10_12.md) §8).

## 7. The tagline is a feature list

**Finding.** "'Build, run, prove' doesn't say what the customer gets."

**Answer.** The cover now leads with the outcome, "Your brand team, in one app. Every post provably yours.", and keeps "Build your brand. Run it. Prove it." as the product line. A time-to-value number ("a brand kit in under 10 minutes", the phase 1 goal in the backlog) goes on the cover once it is measured.

## 8. The model is test numbers

**Finding.** The prices are test values, and the 3% fee competes with Superteam Earn's 0%.

**Answer.** These are launch prices on the decided tiers ([ADR-010](https://github.com/DeveloperAlly/solana-hack/pull/55)) and inside the market bands (research 10 §6). The 3% buys a public record of every payout and automatic disclosure, which bounty boards don't provide (research 10 §7.3). The owner confirms the final prices.

## 9. No market size for the beachhead

**Finding.** "2,730 Superteam sponsor accounts are a list of people to contact, not buyers."

**Answer.** Agreed. The pitch uses the number as reach ("sponsor accounts on Superteam Earn"), not as buyers. A sourced size for crypto and developer teams is open in the [go-to-market](../.agentic/what/context/gtm_2026_10_12.md).

## 10. Moat

**Finding.** "Evidence-backed kits are the real difference, and they can be copied."

**Answer.** The moat compounds:
1. **The evidence store.** Every fact keeps its quote and every sentence in the kit traces to a fact (backlog phase 1).
2. **The approval record.** Every approved and rejected draft trains a shared anti-slop writer, with consent (backlog phase 5). That data grows with every brand and can't be copied.
3. **The open record of what's official.** It gets more useful as more brands, wallets and exchanges use it.

## 11. Team

**Finding.** "Solo founder. They'll ask whether you're on this full-time."

**Answer.** Slide 12 covers the founder's record:
- founded Lilypad Network;
- built the original Waterlily.ai;
- built developer communities at IBM and the Filecoin Foundation.

The full-time question is the owner's to answer in the submission form ([#60](https://github.com/DeveloperAlly/solana-hack/issues/60)).

## Owner direction (2026-10-12, after the teardown)
The owner's answers, which the deck and script now follow:
1. **Real usage:** the owner is building it. The pitch sells the product as it will be built; the demo video shows the live product.
2. **Outcomes, not timings:** the pitch leads with what a founder gets ("Your brand team, in one app"), not a measured time.
3. **Why Solana covers the future features:**
   - verified content from the brand and its ambassadors;
   - a verified AI persona;
   - USDC tips;
   - rewards for real content: disclosed, approved, off X;
   - agents licensing the brand kit per call;
   - stablecoin plans.
4. **AI does the content; paying communities is not the point.** Ambassadors are seats in the app, with approvals, so that their content is **verified** as the brand's. Verification of content, not payment, is why they exist.
5. **Buyer:** personal brands and founders, with the owner as the first customer. Crypto and developer communities are the launch channel.
