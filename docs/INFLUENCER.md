# Alternative entry: self-funding AI creator (social posts + fan chat)

**Status:** Scope v1 · 2026-09-28 · **Alternative** to the Waterlily entry in [PRD.md](./PRD.md). Only one can be submitted: one submission per builder (Colosseum rules).
**Hosting:** Cloudflare Workers, same as Waterlily.
**Lineage:** the SFW, hackathon-sized version of the `onlyfans-project` AI-creator concept.

---

## 1. One-liner

**An AI creator that earns its own money and pays its own bills, in public.**
An original AI character posts on X and chats with fans on its own site. Fans tip it and pay for chat. It pays for its own AI inference onchain, and a live P&L shows whether it is "profitable".

## 2. Why it could win, and why it might not

**For:**
- It hits Solana's headline narrative directly: an agent that **earns and spends** onchain. Agentic payments and x402 had their own Solana Foundation workshop this cycle.
- It makes a very visible demo: a face, a voice, a feed, and a number going up or down.

**Against:**
- **Crowded and burned narrative.** The 2024–25 wave of tokenised AI-agent influencers (ElizaOS/ai16z, Virtuals, Truth Terminal) was huge and has largely collapsed. The AI16Z token's founder called it "dead" in Aug 2026. Judges have seen many "AI agent with a wallet on X" projects, so novelty is lower.
- **Distribution is fragile.** X has no free API tier. It has also been removing automated accounts at scale since late 2025. Third-party analyses say pure automation from datacenter IPs gets flagged, which Cloudflare Workers are. Instagram now requires an "AI-generated profile" label, or it cuts the account's reach.
- **Founder–market fit is weaker** than Waterlily, which has the original project and fiction writing behind it.

**Differentiation if built:** **no token**. Revenue comes from real services (tips, paid chat), not speculation. There is a public P&L, full AI disclosure, and the agent pays its own compute. This pitches as "the honest version of the AI-agent influencer".

## 3. Persona (MVP)

- **An original character** with a name, look, backstory and voice. It is not based on any real person or existing character.
- **Niche:** pick one that suits text and images and chat, and that is SFW. Examples: a micro-fiction storyteller (links back to the Waterlily engine), a cosy sci-fi "correspondent from the future", or a desk-plant-obsessed AI. Decide in a 30-minute naming and persona session.
- **Voice:** a designed ElevenLabs voice. Never a clone of a real person.
- **Disclosure everywhere:** "AI character, run by @<human account>" in the bio. The X Automated label is on (it must be linked to a human-run account). If Instagram is added later, its AI-generated profile label is on.
- **Audience:** adults. The fan chat is behind an 18+ gate. Nothing is aimed at children.

## 4. MVP scope (≤24h)

| # | Feature | Notes |
|---|---|---|
| I1 | **Persona brain** | System prompt, style guide and memory of past posts and chats (Supabase). Generate → check → retry loop lifted from `n8n-agent` |
| I2 | **Post drafting + approval queue** | The agent drafts 3–5 posts a day (text + image). **A human approves each one** before it posts via the X API. This is safer under X's automation enforcement, and quality stays high |
| I3 | **X posting** | Pay-per-use API (≈$0.015/post; ≈$0.20 if the post contains a link). The tip link lives in the bio and pinned post, not in every post |
| I4 | **Persona site** (Cloudflare) | Profile, recent posts, **Tip** button, **Chat** entry, **P&L** |
| I5 | **Tips** | Solana Pay transaction request into the persona wallet, with a memo |
| I6 | **Paid fan chat** | 18+ gate → 5 free messages → buy a pack (e.g. 1 USDC for 30 messages) with Solana Pay → chat. Server-side message balance |
| I7 | **Pays its own inference** | Every LLM, image and TTS call is paid **from the persona wallet** through an x402-metered endpoint. Use Metaplex's Nori (pay-as-you-go LLM/image, metered in SOL) if its SDK is ready in time. Otherwise use our own x402 inference proxy, so the agent still pays onchain per call |
| I8 | **Public P&L page** | Income (tips, chat packs) minus onchain spend (inference), from onchain data. Off-chain costs (X API, card-billed) are shown as a separate line, clearly labelled |
| I9 | **Safety layer** | SFW filter on posts and chat. Blocks sexual content, harassment and impersonation. Anti-dependency rules in chat: no romantic-partner framing, no pressure to pay |

**Not in the MVP:** Instagram posting, video posts, auto-replies on X, games, a token, and more than one persona (see §8).

## 5. Earn / spend loop and onchain design

```
fans ──tip / chat pack (USDC)──► persona wallet ──x402 per call──► inference provider
                                     │
                                     └── memo on every tx: pp:v1|type:<tip|chat|inference>|ref:<id>
P&L = Σ income txs − Σ inference txs   (all read from chain; off-chain costs shown separately)
```

- **Persona wallet:** Metaplex Agent Kit identity, which gives a wallet without exposing a private key. Fallback: a server keypair with a **spend cap**.
- **Spend guardrails:** a daily inference budget, and a hard stop if balance < threshold. The persona "goes quiet" when broke, which is itself a demo moment.
- **Optional payout mode** (borrowed from the Waterlily idea): a set % of net profit to a cause, visible on the P&L.

## 6. Avatar and media options

| Option | What | Fit |
|---|---|---|
| **Static images (MVP)** | A consistent-character image model with a reference image, 1 image per post | Cheapest and fastest; enough for X |
| **D-ID** | Talking head from a single portrait photo; from about $4.70/mo, API on paid plans, generation in under a minute | Good for 1–2 demo clips |
| **HeyGen** | Custom and full-body avatars, well-documented API on higher tiers, from about $29/mo | Better quality, costs more |
| **Tavus** | Real-time conversational video, with a developer SDK | Stretch: live video chat. Too heavy for the MVP |

Recommendation: static images for posts, plus **one D-ID talking clip** for the demo video.

## 7. Build plan (≤24h)

| Block | Hours |
|---|---|
| Persona definition, voice, reference image | 2 |
| Scaffold on Cloudflare Workers + Supabase + Phantom Connect | 2 |
| Persona brain, post drafting, approval queue | 4 |
| X API posting (+ Automated label setup) | 2 |
| Tips (Solana Pay transaction request) | 2 |
| Paid fan chat (18+ gate, packs, balance, safety) | 4 |
| Agent pays its own inference (x402 / Nori or own proxy) + spend caps | 4 |
| P&L page | 1.5 |
| Demo clip (D-ID) + pitch/demo videos | 2.5 |
| **Total** | **24** |

## 8. Roadmap (after the hackathon)

- Instagram posting with the AI-generated profile label (needs a professional account and API set-up)
- Short video posts (talking head), and a narrated micro-fiction series (reusing the Waterlily engine)
- x402 endpoint so **other agents** can pay to collaborate or commission content
- Multi-persona "creator studio": anyone can launch a disclosed AI creator with a wallet, spend caps and a public P&L. This is the stepping stone to the `onlyfans-project` vision, and an adult vertical there needs its own age-verification and compliance track
- Live video chat (Tavus-style)

## 9. Success metrics (demo day)

- The persona has posted at least 20 approved posts on X under the Automated label, with no enforcement actions
- 10+ onchain income transactions from people outside the team (tips or chat packs)
- 100% of inference calls are paid onchain by the persona wallet, and the P&L totals match onchain sums exactly
- A new fan reaches a paid chat in **under 2 minutes** with no prior wallet
- The spend cap triggers correctly in a test (persona goes quiet at zero budget)

## 10. Scorecard vs Waterlily (1–5)

| Criterion | Waterlily | AI creator |
|---|---|---|
| Founder–market fit | **5** | 3 |
| Novelty | **4** | 3 (crowded narrative) |
| UX that needs the chain | **5** | 4 |
| Market / impact | **4** | 3 |
| Business plan | **4** | 3 |
| Solana narrative (agentic payments) | 3–4 | **5** |
| Build hours (lower is better) | **18h** | 24h |
| Distribution risk (lower is better) | **Low** | High (X enforcement, API costs) |
| **Total (first six)** | **25–26** | 21 |

**Assessment:** Waterlily is still the stronger submission. The AI creator is more fun and more on-narrative, but it carries more platform risk and more "seen it before" risk. It's a good post-hackathon build towards the `onlyfans-project` goal.

## Sources

[X API pricing 2026](https://www.postproxy.dev/blog/x-api-pricing-2026/) · [X Automated account labels](https://help.x.com/en/using-x/automated-account-labels) · [X bot enforcement 2026 (third-party analysis)](https://socialnexis.com/guides/x-june-2026-bot-purge-anatomy) · [Instagram AI-generated profile label (Engadget)](https://www.engadget.com/2246914/instagram-will-demote-ai-generated-influencers-if-they-dont-clearly-label-their-account/) · [Talking-head APIs compared (VEED)](https://www.veed.io/learn/best-talking-head-video-apis) · [Metaplex Agent Kit / Nori](https://www.metaplex.com/docs/agents) · [x402 on Solana](https://solana.com/docs/payments/agentic-payments/intro-to-x402) · [AI16Z "dead" (CoinDesk)](https://www.coindesk.com/markets/2026/08/05/ai-agent-token-once-worth-usd2-4-billion-ends-with-founder-calling-it-dead) · [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
