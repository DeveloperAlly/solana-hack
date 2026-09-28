# Story Studio: PRD

**Status:** Draft v1 · 2026-09-28
**Hackathon:** Colosseum Crypto World's Fair, Solana track. Deadline **Oct 12, 11:59pm PT (Oct 13, 5:59pm Melbourne)**
**Tracking issue:** #1
**Lineage:** a rebuild of the Waterlily.ai concept (ethical AI art with artist royalties, 2023) for authors and writing. No Waterlily code is reused. Disclose the lineage in the submission.

---

## 1. One-liner

**Commission a story in the voice of an author who said yes, and pay them for it.** A guided AI story builder in which every story written in an author's style, and every narration in their voice, pays that author and their chosen cause in a single Solana transaction that anyone can check.

## 2. Problem

- AI writing tools imitate authors without consent, credit or payment. Authors are fighting this through lawsuits and licensing deals, but there is no simple, per-use way to **license a voice and be paid for it**.
- Readers want personalised stories (a bedtime story with their kid's name, a mystery set in their town, fan-style shorts), but today they get either generic AI prose or an unlicensed imitation.
- Card rails can't make a $1 purchase split instantly between three parties in different countries, and they don't produce a public receipt.

## 3. Insight

1. **Style can be licensed without training a model.** An author's writing voice can be captured as a style profile (an extracted style guide plus a few excerpts) and applied in context. The original Waterlily needed a DreamBooth fine-tune per artist; this needs none.
2. **Spoken voice is now a 1–2 minute upload.** Instant voice cloning makes "narrated by the author" cheap. The hard part is consent, which a public onchain attestation solves well.
3. **Solana makes the split the product.** One atomic transaction pays author, cause and platform. The receipt is public, so trust is built in rather than promised.

## 4. Users

| User | Goal | MVP? |
|---|---|---|
| **Reader (hero user)** | Commission a personalised story in a chosen voice, optionally narrated, in under 3 minutes | Yes |
| **Opted-in author** | Upload writing and voice, set price, cause and split, watch earnings | Yes (onboarding can be admin-assisted for the demo) |
| **Public-domain catalogue** | Austen, Poe and others. No living rights holder, so proceeds go to a literacy cause | Yes |
| **AI agent** | Licence an author's style per call via x402 | Stretch |
| **Aspiring writer** | Publish their own stories and get tipped | Later |

## 5. User flows

### Flow A: Reader commissions a story (hero flow)
1. Land on the **Voices** shelf: author cards showing style tags, sample paragraph, price, cause, and "narrated by author" if available.
2. Pick a voice, then open the **guided builder**:
   1. **Genre and length** (e.g. bedtime, mystery, sci-fi short; 500 / 1,000 / 2,000 words)
   2. **Characters** (names, one trait each; optional "star my kid / my friend / my dog")
   3. **Setting and beats**. The agent proposes a 5-beat outline, which the reader can reorder or edit.
   4. **Tone slider** (cosy ↔ dark, simple ↔ literary)
3. A **free preview**: the opening paragraph in the author's voice.
4. **Pay to unlock** (e.g. 1 USDC). One transaction pays author, cause and platform, plus a provenance memo.
5. The full story streams in. The **provenance card** shows the author, the style-profile version, the story hash, and an explorer link to the transaction.
6. **Upsell: "Narrate this"** (e.g. 0.5 USDC, same split) produces audio in the author's cloned voice, or a stock narrator for public-domain authors.
7. **Share**: a public story page with a **Tip** button (Blink). Tips use the author's split.

### Flow B: Author opts in
1. Sign in with email (Phantom Connect embedded wallet).
2. Upload 5–20k words of **their own** writing and tick the rights confirmation.
3. The **Style Profiler agent** returns a style guide. The author edits and approves it, and it is versioned by hash.
4. Optional: record or upload 1–2 min of clean audio and confirm consent. This creates the voice clone.
5. Pick a cause from the curated list, set the split (default author 70 / cause 20 / platform 10) and the price.
6. **Consent attestation memo** is written onchain (profile hash + voice yes/no + author wallet).
7. Dashboard: earnings, cause total, per-story transactions.

### Flow C: Public ledger
- `/ledger`: totals per author and per cause, with a live list of transactions linked to an explorer.
- `/verify/{storyHash}`: paste a story or hash and see who licensed it, who was paid what, and when.

### Flow D (stretch): Agent licenses a voice via x402
- `GET /api/license/{authorId}?prompt=…` returns `402 Payment Required`. The agent pays (same three-way split) and receives the story. The same ledger entry type is used, tagged `agent`.

## 6. Features and scope

| # | Feature | MVP / Stretch | Judging criterion served |
|---|---|---|---|
| F1 | Voices shelf (3 voices: 1 opted-in author + 2 public domain) | MVP | UX, Novelty |
| F2 | Guided builder (genre → characters → beats → tone) | MVP | UX, Functionality |
| F3 | Free preview paragraph | MVP | UX, Business (conversion) |
| F4 | Pay-to-unlock via Solana Pay transaction request, 3-way split + memo | MVP | **UX using blockchain**, Business |
| F5 | Provenance card + `/verify` | MVP | Novelty, Composability |
| F6 | Narration (author clone or stock voice), paid, same split | MVP | Business, Novelty |
| F7 | Public ledger (per author and per cause) | MVP | **UX using blockchain**, Impact |
| F8 | Author onboarding + Style Profiler + consent memo | MVP (can be admin-run for the demo) | Novelty, Impact |
| F9 | Tip Blink on shared stories | MVP-lite (dial.to link) | UX, distribution (GTM) |
| F10 | x402 agent licensing endpoint | Stretch | Solana narrative, Composability |
| F11 | Style-adherence critic loop | Stretch (MVP if time) | Functionality |
| F12 | Writer publishing and tipping marketplace | Later | Market size |
| F13 | Giving Block / Endaoment routing with tax receipts | Later | Impact |

**Explicitly out of scope:** model fine-tuning, native mobile app, token launch, NSFW content (rules §12), imitating non-consenting living authors.

## 7. Agent architecture

The reuse point is the **generate → check → retry loop** from `ai-and-agents/n8n-agent`. Agents are server-side functions orchestrated in one Next.js API route. n8n is optional.

| Agent | Input → Output | Notes |
|---|---|---|
| **Style Profiler** | Author corpus → style guide JSON (diction, sentence rhythm, POV, recurring themes, taboo list) + 3–5 exemplar excerpts | Run once per author; versioned by sha256 |
| **Brief Agent** | Builder answers → structured brief | Asks at most 1 clarifying question |
| **Outline Agent** | Brief → 5 beats | Reader can edit |
| **Draft Agent** | Brief + beats + style profile → story | Streams output; preview = first paragraph only |
| **Style Critic** (F11) | Draft + profile → score 0–1 + fixes | If score < threshold, one revise pass (the retry loop) |
| **Safety Agent** | Brief/draft → pass/fail | SFW; blocks requests to imitate authors who aren't in the catalogue; blocks real-person harm |
| **Narrator** | Story → chunked TTS → audio file | ElevenLabs voice ID per author; stock voice for public domain |
| **Ledger Agent** | Payment intent → built transaction, then verifies confirmation → releases content | Deterministic code, not an LLM |

## 8. Payments and onchain design

- **Wallets:** Phantom Connect embedded wallet (email sign-in) so readers need no prior crypto. [docs](https://docs.phantom.com/phantom-connect)
- **Currency:** USDC (devnet for the demo). CASH is optional since it's a standard SPL token. [docs](https://docs.phantom.com/cash)
- **Checkout:** Solana Pay **transaction request**. The server composes the transaction, because a transfer request only supports a single recipient. [spec](https://solana.com/docs/tools/solana-pay/specification/version1)
- **One atomic transaction per purchase:** [batch payments](https://solana.com/docs/payments/send-payments/payment-processing/batch-payments)
  - `transferChecked` reader → author (e.g. 70%)
  - `transferChecked` reader → cause (e.g. 20%)
  - `transferChecked` reader → platform (e.g. 10%)
  - `memo`: `ss:v1|type:commission|story:<sha256>|author:<id>|profile:<ver>`
  - A reference key is added so the server can find and confirm the transaction
- **Public-domain split:** cause 90% / platform 10%. The platform share covers inference, mirroring Waterlily's "fees minus compute" rule.
- **Consent attestation:** a memo from the author wallet: `ss:v1|type:consent|profile:<hash>|voice:<0|1>`
- **Tips:** Blink (`@solana/actions`) returning the same split transaction. Unfurls on dial.to; unfurling on X needs Dialect registry verification. [docs](https://solana.com/docs/tools/actions)
- **Agents (stretch):** x402 via `@faremeter/payment-solana` / Corbits. [docs](https://solana.com/docs/payments/agentic-payments/intro-to-x402)
- **Verification rule:** content is released only after the server confirms the transaction onchain with the expected amounts, recipients and memo.

**Demo prices (placeholders):** commission 1 USDC · narration 0.5 USDC · tips any amount.

## 9. Data model (Supabase)

- `authors` (id, display_name, wallet, bio, cause_id, split_author, split_cause, split_platform, price_commission, price_narration, voice_id?, is_public_domain, consent_tx)
- `style_profiles` (id, author_id, version_hash, guide_json, exemplars, created_at)
- `causes` (id, name, wallet, source_url, verified_note)
- `stories` (id, author_id, profile_version, brief_json, beats_json, text, sha256, is_public, created_at)
- `payments` (id, story_id, type [commission|narration|tip|agent], tx_sig, amount, author_amt, cause_amt, platform_amt, payer, confirmed_at)
- `narrations` (id, story_id, audio_url, voice_id, payment_id)

## 10. Stack

Next.js (`create-solana-dapp`) · Phantom Connect React SDK · `@solana/kit` / `@solana/spl-token` · Solana Pay transaction request · `@solana/actions` · Supabase · Claude API · ElevenLabs API · Helius free RPC (devnet) · Vercel.

## 11. Build plan (≤30h)

| Block | Tasks | Hours |
|---|---|---|
| Setup | Scaffold, Phantom Connect, Supabase schema, env, devnet USDC, cause wallets list | 3 |
| Catalogue | Style Profiler; profile 2 public-domain authors (Gutenberg texts) + 1 opted-in author; Voices shelf | 4 |
| Builder | 4-step guided UI, Brief/Outline/Draft agents, preview paragraph, Safety agent | 6 |
| Payments | Transaction-request endpoint (3 transfers + memo + reference), confirmation, unlock | 5 |
| Narration | ElevenLabs voice clone for the opted-in author + stock voice; paid narration flow | 3 |
| Provenance + ledger | Provenance card, `/verify`, `/ledger` totals and transaction list | 3 |
| Tip Blink | Actions endpoint reusing the split builder | 1.5 |
| Polish + deploy | Design pass, error states, Vercel, README with architecture and disclosure | 2.5 |
| Pitch + demo videos | Script, record, edit | 2 |
| **Total** | | **30** |
| Stretch | Style Critic loop (2h), x402 agent endpoint (3h) | +5 |

## 12. Success metrics

**Build acceptance (demo day):**
- A new reader with no wallet goes from landing to a paid, narrated story in **under 3 minutes**
- Each purchase is **one** confirmed transaction with 3 transfers and a memo; the ledger totals match onchain sums exactly
- 3 voices are live (1 opted-in author with cloned voice, 2 public domain)
- `/verify` resolves any generated story to its transaction
- Blind check: 3 of 5 testers can match a story to its author from the style samples

**Pitch and traction (submission):**
- 10+ real paid stories on devnet from people other than the team, plus at least 1 outside author committed (a signed-up waitlist is fine)
- Both videos done and submitted at least 24h before the deadline

## 13. Business model and go-to-market

- **Revenue:** a platform share (10%) of every commission, narration and tip. Later, a B2B voice-licensing API that agents and apps pay per call via x402.
- **Supply:** start with indie, self-published and genre authors, who have the most to gain and the least legal tangle. Public-domain voices fill the shelf on day one.
- **Demand:** personalised gifts (bedtime stories, birthdays), fans of specific authors, and tip Blinks shared on X.
- **Moat:** consented supply (authors' style profiles and voices), the onchain consent and royalty record, and author trust.

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Imitating non-consenting authors | Catalogue-only voices; Safety agent blocks "in the style of X" for authors not in the catalogue |
| Voice clone misuse | Author clones only their own voice; consent memo onchain; clone stored server-side, never exported |
| Content rules (§12 "indecent, obscene") | SFW-only Safety agent; no adult genres in the hackathon build |
| Model or TTS provider policy violations | Stay within provider usage policies; SFW |
| Charity wallet authenticity | Curated list with source links; later, route via Giving Block / Endaoment |
| Prior-code judging rule | Fresh repo; disclose Waterlily lineage and any lifted snippets |
| Team eligibility | One submission per builder; confirm the team roster with your friend before building |
| Waterlily name/IP (Lilypad org) | Use "Story Studio" publicly unless Lilypad approves the name |

## 15. Demo script (≤3 min)

1. (0:00) "AI can write like your favourite author, but the author gets nothing. Story Studio fixes that."
2. (0:20) Sign in with email, then browse the Voices shelf.
3. (0:40) Build a bedtime story: genre, the kid's name, beats, tone. Show the free preview.
4. (1:15) Pay 1 USDC with one tap, then show the transaction: 3 transfers + memo on the explorer.
5. (1:40) Unlock the story, then click "Narrate", which plays in the author's own voice.
6. (2:10) Open `/ledger`: author earnings and cause total, all onchain.
7. (2:30) Author view: consent memo, split settings. (Stretch: an agent licenses the voice via x402.)
8. (2:50) Close: "Consent, credit and cash, per story."

## 16. Open questions

- The author for the opted-in slot: our own pen name, or an outside author?
- Which causes go on the curated list (literacy-focused)?
- Is "Story Studio" the final name?
- Devnet only, or a small mainnet demo transaction for credibility?

## Sources

[Colosseum rules](https://colosseum.com/legal/Crypto%20World's%20Fair%20Hackathon%20Rules.pdf) · [World's Fair](https://colosseum.com/worldsfair) · [Colosseum FAQ](https://colosseum.com/hackathon#faqs) · [Solana payments](https://solana.com/docs/payments) · [Batch payments](https://solana.com/docs/payments/send-payments/payment-processing/batch-payments) · [Solana Pay spec](https://solana.com/docs/tools/solana-pay/specification/version1) · [Actions & Blinks](https://solana.com/docs/tools/actions) · [x402](https://solana.com/docs/payments/agentic-payments/intro-to-x402) · [Phantom Connect](https://docs.phantom.com/phantom-connect) · [ElevenLabs instant voice cloning](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning) · [Waterlily repo](https://github.com/Lilypad-Tech/Waterlily) · [Waterlily build write-up](https://developerally.hashnode.dev/waterlily-ai) · [The Giving Block, Solana](https://thegivingblock.com/resources/cryptocurrency/solana/) · [Endaoment](https://endaoment.org/)
