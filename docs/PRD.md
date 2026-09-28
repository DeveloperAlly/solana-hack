# Story Studio: PRD (MVP)

**Status:** v2, reduced to MVP only · 2026-09-28
**Hackathon:** Colosseum Crypto World's Fair, Solana track. Deadline **Oct 12, 11:59pm PT (Oct 13, 5:59pm Melbourne)**
**Tracking issue:** #1 · **Everything that was cut:** [ROADMAP.md](./ROADMAP.md)
**Hosting:** **waterlily.ai** (founder-owned domain, not currently in use), with **waterlily.world** (also founder-owned) as the alternative
**Lineage:** a rebuild of the Waterlily.ai concept (2023: artists opted in, AI generated images in their style, and the artist was paid). Rebuilt for writing and voices, with no Waterlily code reused. The founder owns the Waterlily name. Disclose the lineage in the submission.

---

## 1. One-liner

**Write in anyone's voice, if they said yes, and they choose where the money goes.**
Readers commission a short story in an opted-in voice. The voice owner decides whether the proceeds go to them, to charity, or nowhere (free), and every payment settles in one Solana transaction that anyone can check.

## 2. Problem and insight

- **Problem:** AI imitates writers without consent, credit or payment. There's no simple per-use way to license a voice.
- **Insight 1:** a writing voice can be licensed **without training a model**. Use an extracted style guide plus a few excerpts, applied in context.
- **Insight 2:** a spoken voice is now a 1–2 minute upload, so "narrated by the voice owner" is cheap. Consent is the hard part, and an onchain attestation fits it well.
- **Insight 3:** Solana turns the split into the product. One atomic transaction routes money to owner, cause and platform, with a public receipt.
- **"Voice" means anyone, not just authors.** Novelists, bloggers and posters (e.g. a well-known tweet voice) can all be voice owners, *if they opt in*. The MVP generates short stories only.

## 3. Consent guardrail (non-negotiable)

- Only **opted-in** voices are generated. Requests to write "in the style of" anyone who isn't in the catalogue are refused.
- The **demo uses only the founder's own voice and public-domain authors**. A famous person's voice can be used in the pitch as a hypothetical ("imagine if they opted in"), but is never generated without their consent. Otherwise we'd be demoing the exact problem we're fixing, and it creates impersonation risk.
- Voice clones are made only from the voice owner's own audio, with a consent memo onchain.
- SFW only (Colosseum rules §12).

## 4. MVP scope

**Hero user:** a reader commissioning a story.

| # | Feature | Judging criterion |
|---|---|---|
| M1 | **Voices shelf**: 3 voices: the founder's own voice (writing + cloned spoken voice) and 2 public-domain authors (stock narrator) | UX, Novelty, Founder–market fit |
| M2 | **One-screen builder**: genre, characters, setting/twist, length → free preview paragraph | UX, Functionality |
| M3 | **Pay to unlock**: Solana Pay transaction request routed by the owner's **payout mode** (§5), plus a provenance memo | **UX using blockchain**, Business |
| M4 | **Narrate**: paid; the owner's cloned voice, or a stock voice for public domain; same routing | Novelty, Business |
| M5 | **Story page**: text, audio, provenance line (voice, profile version, story hash, explorer link to the transaction) | Composability |
| M6 | **Ledger page**: per-voice and per-cause totals plus a transaction list with explorer links | **UX using blockchain**, Impact |
| M7 | **Voice seeding (admin script)**: Style Profiler → style guide, consent memo from the owner wallet, payout mode stored | Novelty |

**Not in the MVP** (all in ROADMAP.md): tweet/thread format, self-serve onboarding, beat-by-beat editing, style-critic loop, tip Blinks, `/verify` page, x402 agent licensing, charity routing via Giving Block/Endaoment, writer marketplace.

## 5. Payout modes (the Waterlily twist)

The voice owner picks a mode. Each mode is a preset of three percentages: **owner / cause / platform**. The platform share has a floor that covers AI cost.

| Mode | Owner | Cause | Platform | Reader pays |
|---|---|---|---|---|
| **Paid** | 90% | 0% | 10% | Full price (e.g. 1 USDC) |
| **Charity** | 0% | 90% | 10% | Full price |
| **Split** (custom) | x% | y% | ≥10% | Full price |
| **Free** | 0% | 0% | 100% of a small cost fee | Cost fee only (e.g. 0.2 USDC) |

Public-domain voices are fixed to **Charity** (literacy cause), mirroring Waterlily's rule that public-domain proceeds went to charity after compute costs.

**Transaction shape (every mode):** one Solana transaction built by the server (a Solana Pay *transaction request*, because transfer requests allow only one recipient):
- one `transferChecked` USDC instruction for each non-zero leg (owner, cause, platform), so 1–3 transfers
- a `memo`: `ss:v1|type:<commission|narration>|story:<sha256>|voice:<id>|profile:<ver>|mode:<paid|charity|split|free>`
- a reference key so the server can find the transaction

Content unlocks only after the server confirms the transaction onchain with the expected legs and memo. All instructions succeed or none do.

**Consent memo (seeding):** from the owner's wallet: `ss:v1|type:consent|voice:<id>|profile:<hash>|spoken:<0|1>|mode:<mode>`

## 6. Agents (MVP)

The generate → check → retry pattern is lifted from `ai-and-agents/n8n-agent`.

| Agent | Job |
|---|---|
| Style Profiler (seeding only) | Corpus (5–20k words) → style guide JSON + 3–5 exemplar excerpts, versioned by hash |
| Story Agent | Brief + style profile → an internal 5-beat outline → draft. The preview is the first paragraph |
| Safety Agent | SFW check; refuses voices not in the catalogue and real-person harm |
| Narrator | Chunked text-to-speech via ElevenLabs (owner clone or stock voice) |
| Payment builder / verifier | Deterministic code, not an LLM: builds the split transaction and confirms it |

## 7. Data model (Supabase)

- `voices` (id, name, owner_wallet, is_public_domain, payout_mode, pct_owner, pct_cause, pct_platform, cause_id, price_story, price_narration, tts_voice_id, consent_tx)
- `style_profiles` (id, voice_id, version_hash, guide_json, exemplars)
- `causes` (id, name, wallet, source_url)
- `stories` (id, voice_id, profile_version, brief_json, text, sha256, audio_url)
- `payments` (id, story_id, type, mode, tx_sig, owner_amt, cause_amt, platform_amt, payer, confirmed_at)

## 8. Stack

Next.js (`create-solana-dapp`) · Phantom Connect embedded wallet (email sign-in) · `@solana/kit` + `@solana/spl-token` · Solana Pay transaction request · Supabase · Claude API · ElevenLabs API · Helius free RPC (devnet, devnet USDC) · Vercel with custom domain **waterlily.ai** (fallback: waterlily.world).

## 9. Build plan (≤18h)

| Block | Tasks | Hours |
|---|---|---|
| Setup | Scaffold, Phantom Connect, Supabase schema, devnet USDC, cause wallet | 2 |
| Seeding | Style Profiler script; 3 voices; clone founder's spoken voice; consent memos | 2 |
| Builder | One-screen form, Story Agent, Safety Agent, preview | 3.5 |
| Payments | Transaction-request endpoint for all 4 modes, confirmation, unlock | 4 |
| Narration | Paid narration, owner clone + stock voice | 2.5 |
| Story + ledger pages | Provenance line, per-voice and per-cause totals, transaction list | 1.5 |
| Deploy | Vercel + point waterlily.ai (or waterlily.world) DNS at it, README (architecture, lineage/prior-code disclosure) | 1 |
| Videos | 2–3 min pitch + ≤3 min demo | 1.5 |
| **Total** | | **18** |

## 10. Success metrics

- A new reader with no wallet goes from landing to a paid, narrated story in **under 3 minutes**
- All 4 payout modes produce a confirmed transaction with the right legs and memo (tested once each)
- Ledger totals match onchain sums exactly
- 3 voices live; the founder's narration plays in her cloned voice
- Blind check: 3 of 5 testers match a story to its voice from samples
- 10+ paid stories from people outside the team before submission
- Submitted at least 24h before the deadline

## 11. Business model (for the pitch)

The platform takes a 10% take rate on every commission and narration, with a cost-fee floor in Free mode. The supply wedge is indie writers and posters with loyal audiences. Demand is personalised gifts and fans. The moat is consented voices plus the onchain consent and royalty record. Expansion paths (tweets, agents, marketplace) are in ROADMAP.md.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Non-consenting imitation / impersonation | Catalogue-only voices; demo uses only the founder and public domain; Safety Agent |
| Voice-clone misuse | Owner's own audio only; consent memo; clone never exported |
| Rules §12 content | SFW only |
| Prior-code rule | Fresh repo; disclose Waterlily lineage and lifted snippets |
| Team eligibility | One submission per builder; confirm the roster with your friend |
| Naming | The founder owns the Waterlily name (not Lilypad), so it can be used, e.g. branding as Waterlily. Final name still to decide: "Story Studio" or Waterlily |

## 13. Demo script (≤3 min)

1. (0:00) "AI can already write like anyone. The person it copies gets nothing, and was never asked."
2. (0:20) Sign in with email → Voices shelf (founder's voice + 2 classics). Show the payout mode on each card.
3. (0:40) One-screen brief → free preview in the founder's voice.
4. (1:05) Pay 1 USDC → explorer: one transaction, split legs + memo.
5. (1:30) Unlock → "Narrate" → plays in the founder's own voice.
6. (1:55) Switch to a public-domain voice → Charity mode → show the cause leg.
7. (2:15) Ledger: per-voice and per-cause totals, all onchain.
8. (2:35) "Any writer or poster can opt in and choose: get paid, give it free, or give it to charity." (Hypothetical famous examples are fine here; don't generate them.)
9. (2:50) Close: "Consent, credit and cash, per story."

## Sources

[Colosseum rules](https://colosseum.com/legal/Crypto%20World's%20Fair%20Hackathon%20Rules.pdf) · [Colosseum FAQ](https://colosseum.com/hackathon#faqs) · [Batch payments (atomic)](https://solana.com/docs/payments/send-payments/payment-processing/batch-payments) · [Solana Pay spec](https://solana.com/docs/tools/solana-pay/specification/version1) · [Phantom Connect](https://docs.phantom.com/phantom-connect) · [ElevenLabs instant voice cloning](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning) · [Waterlily repo](https://github.com/Lilypad-Tech/Waterlily) · [Waterlily build write-up](https://developerally.hashnode.dev/waterlily-ai)
