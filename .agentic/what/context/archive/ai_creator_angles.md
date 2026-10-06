---
type: options
status: superseded
created: 2026-10-04
updated: 2026-10-06
last_edited_by: agent
tags: [options, ai-creator, archive]
superseded_by: adr_003_superhub_business_model
---
> **Status: superseded.** Replaced by [ADR-003](../../decisions/adr_003_superhub_business_model.md) (AI persona as the experimental "Create an influencer" module). Kept as history.

# AI creator: new angles

**Status:** Options, not yet chosen · 2026-10-04
**Builds on:** [influencer_scope.md](./influencer_scope.md) (self-funding AI creator) and [prd_story_studio.md](./prd_story_studio.md) (Waterlily: consented voices with payout modes).
**Why this doc:** demand for AI creators is proven (about $328M of AI companion app spending in H1 2026; see the influencer scope §2). What's burned is the *tokenised* agent trend. These angles apply the idea in a way judges haven't seen.

---

## 1. Consented AI twins (recommended)

**Waterlily applied to influencers.** A real creator licenses an AI twin of themselves: their writing voice (style profile) and spoken voice (clone of their own audio). The twin posts and chats with subscribers around the clock. The creator picks the payout mode (Paid / Charity / Split / Free), and consent and royalties are recorded onchain.

- **Why it's new:** every AI-creator product today is a made-up persona *or* an unlicensed copy. This one pays the human behind the AI and proves consent onchain. It's clearly different from the tokenised agents.
- **Why it merges both ideas:** Waterlily is the engine (consent memo, style profile, voice clone, payout split). The influencer build is the distribution (posting, subscriber chat, subscriptions).
- **Pitch line:** "Your AI twin works while you sleep. You choose who gets paid."
- **Scope impact:** larger than either doc alone. MVP: one twin (the founder's), subscriber chat plus subscriptions, payout-mode split on every pull; X posting by human approval.

## 2. Keep it alive

The AI creator must earn its compute or it goes quiet. Subscribers are its "life support", and the P&L is a public survival game.

- **Strength:** the most viral mechanic. The spend cap becomes the product, and it makes a great demo moment.
- **Weakness:** closer to a stunt than a business; harder to defend to VC judges.

## 3. Fans direct the story

An AI character lives a serialised storyline. Subscribers vote, or pay, to steer what happens next.

- **Strength:** the Story Studio engine applied to a persona; strong engagement and retention hook.
- **Weakness:** needs an audience to work; the voting UX adds build time.

## 4. Pays its makers

Every post or chat automatically pays the humans who shaped the persona (writer, voice actor, artist) in one atomic onchain split.

- **Strength:** makes "ethical AI creator" concrete; reuses the Waterlily split design.
- **Weakness:** a smaller story than #1; mostly a feature of #1.

## Recommendation

**#1, consented AI twins.** It's the only angle that combines both ideas. Consent-plus-royalties is the part judges haven't seen, and it removes the either/or choice: Waterlily becomes the engine. #4 folds into #1 as a feature. #2 and #3 are good growth mechanics for later.

## Next step

Pick an angle. Then write a scope doc for it (MVP, hours, success metrics) and rescore it against Waterlily and the AI creator.
