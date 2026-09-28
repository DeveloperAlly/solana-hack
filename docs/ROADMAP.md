# Story Studio: Roadmap (post-MVP)

Everything cut from the hackathon MVP ([PRD.md](./PRD.md)), grouped by when it makes sense. Estimates are rough build hours.

## Phase 1: stretch goals if hackathon time allows

| Item | What | Why | Est. |
|---|---|---|---|
| Tip Blinks | Shareable "tip this story" link (`@solana/actions`) using the owner's payout mode. Unfurls on dial.to; unfurling on X needs Dialect registry verification | Distribution on X; one-tap payments | 1.5h |
| `/verify` page | Paste a story or its hash to see voice, profile version, payment legs and transaction | Stronger provenance demo | 1.5h |
| Style-critic loop | Score each draft against the style profile; one revise pass below a threshold | Better voice fidelity (Functionality) | 2h |
| x402 agent licensing | `GET /api/license/{voice}` returns 402 → agent pays (same split) → story. Via `@faremeter/payment-solana` / Corbits | Solana's agentic-payments narrative: "agents pay writers" | 3h |

## Phase 2: first weeks after the hackathon

- **Tweet / thread format**: "write this post in X's voice", with opted-in posters as voice owners. It's the most viral expansion of "anyone's voice".
- **Self-serve voice onboarding**: sign in, upload corpus and audio, confirm rights and consent, approve the style guide, pick payout mode, consent memo.
- **Beat-by-beat builder**: reader edits the 5-beat outline, plus a tone slider.
- **Voice-owner dashboard**: earnings, cause totals, per-story transactions, change payout mode (versioned).
- **Public story pages and sharing**, with a creator-attribution split for the commissioner.
- **Mainnet launch** with real USDC/CASH; fee sponsorship so readers never need SOL.

## Phase 3: platform

- **Charity rails**: route cause legs through The Giving Block (accepts SOL, has an API) or Endaoment (DAF, has an API) for verified 501(c)(3)s and receipts.
- **Writer marketplace**: aspiring writers publish their own guided-builder stories and earn tips.
- **Voice-licensing API for apps**: B2B per-call pricing (x402 and invoiced).
- **Recurring patronage**: Solana Subscriptions & Allowances for monthly "story subscriptions" to a voice.
- **Richer provenance**: compressed-NFT certificates for commissioned stories; onchain consent registry that other apps can read.
- **Fine-tuned voices** (optional, premium): only if in-context profiles plateau.
- **Other media**: return to images (the original Waterlily), and audio-only formats (podcasts, bedtime audio series).

## Separate product (not under this brand)

- **Adult vertical**: same engine forked privately with strict 18+ age verification, a compliant model and TTS provider, and payment-partner review. Never part of the Colosseum submission (rules §12).

## Parking lot / open questions

- Final name ("Story Studio" vs Waterlily-derived; needs Lilypad approval for the latter)
- Which literacy causes are on the curated list
- Devnet-only demo vs one small mainnet transaction for credibility
- Take rate (10%) and Free-mode cost fee (0.2 USDC): validate with the first 10 voice owners
