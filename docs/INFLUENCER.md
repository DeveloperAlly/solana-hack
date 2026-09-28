# Alternative entry: self-funding AI creator (social posts + subscriber chat)

**Status:** Scope v2 · 2026-09-28 · **Alternative** to the Waterlily entry in [PRD.md](./PRD.md). Only one can be submitted: one submission per builder (Colosseum rules).
**Hosting:** Cloudflare Workers (Cron Triggers for scheduled jobs), same as Waterlily.
**Lineage:** the SFW, hackathon-sized version of the `onlyfans-project` AI-creator concept.

---

## 1. One-liner

**An AI creator that earns its own money and pays its own bills, in public, with no token.**
An original AI character posts on X and chats with subscribers on its own site. Fans subscribe monthly in USDC (and can tip). It pays for its own AI inference onchain, and a live P&L shows whether it is "profitable".

## 2. Demand evidence

People already pay for AI characters and AI creators, at scale:

- **AI companion apps:** about **$328M** of mobile consumer spending in **H1 2026**, split roughly evenly between general-purpose companions ($164.8M) and romantic/NSFW apps ($162.8M). **38% of all spending since late 2022 happened in those six months.** Character.AI has about 20M monthly active users. ([CompanionRater, 2026](https://companionrater.com/ai-companion-statistics-2026))
- **AI creators:** median **$300–1,500/month**; the top 1% make **$25k–100k+/month**, mostly on Fanvue-type subscription platforms. ([iimagined, 2026](https://iimagined.ai/blog/ai-influencer-income-real-numbers-2026); figures come from creator surveys and public leaderboards, so treat them as directional)
- **Revenue mix for creators earning $5k+/month:** subscriptions 45%, brand deals 25%, digital products 15%, affiliates 10%, **tips only 5%** (same source). **So subscriptions are the model and tips are secondary.**
- **Platforms treat AI personas as a mainstream category:** Instagram introduced a dedicated "AI-generated profile" label on Aug 31, 2026. ([Engadget](https://www.engadget.com/2246914/instagram-will-demote-ai-generated-influencers-if-they-dont-clearly-label-their-account/))

## 3. Positioning: what's burned and what isn't

- **Consumer demand is strong** (§2).
- **What's burned is the *tokenised* AI-agent trend** (ElizaOS/ai16z, Virtuals, Truth Terminal). The AI16Z token's founder called it "dead" in Aug 2026. ([CoinDesk](https://www.coindesk.com/markets/2026/08/05/ai-agent-token-once-worth-usd2-4-billion-ends-with-founder-calling-it-dead))
- **Headline differentiator: no token, real revenue, public P&L.** Earnings come from subscribers and tips, not speculation, and anyone can check income and spend onchain. This is "the honest version of the AI-agent influencer".
- **Why Solana:** stablecoin subscriptions without card processors (AI and adult-adjacent creators often face payment-processor friction), global payouts, an agent wallet that pays its own compute (x402), and a verifiable P&L.

## 4. Persona (MVP)

- **An original character** with a name, look, backstory and voice. It is not based on any real person or existing character.
- **Niche:** SFW and suited to text, images and chat (e.g. a micro-fiction storyteller that links to the Waterlily engine, or a cosy sci-fi "correspondent from the future"). Decide in a 30-minute persona session.
- **Voice:** a designed ElevenLabs voice. Never a clone of a real person.
- **Disclosure everywhere:** "AI character, run by @<human account>" in the bio, plus the X Automated label (linked to a human-run account). If Instagram is added later, its AI-generated profile label is on.
- **Audience:** adults. The subscriber chat is behind an 18+ gate. Nothing is aimed at children.

## 5. MVP scope (≤25h)

| # | Feature | Notes |
|---|---|---|
| I1 | **Persona brain** | System prompt, style guide, memory of posts and chats (Supabase). Generate → check → retry loop lifted from `n8n-agent` |
| I2 | **Post drafting + approval queue** | The agent drafts 3–5 posts a day (text + image). **A human approves each one** before it posts: safer under X's automation enforcement, and quality stays high |
| I3 | **X posting** | Pay-per-use API (≈$0.015/post; ≈$0.20 with a link). The subscribe link lives in the bio and pinned post |
| I4 | **Persona site** (Cloudflare) | Profile, public posts, **subscriber-only posts**, **Subscribe**, **Chat**, **P&L** |
| I5 | **Monthly subscription** (primary revenue) | Solana **Subscriptions & Allowances**: the persona publishes a plan (e.g. 5 USDC/month); the fan accepts it once; a Cloudflare Cron Trigger pulls each period via `transferSubscription`; the fan can cancel at any time (revoke). Being subscribed is checked against an active authorization |
| I6 | **Subscriber chat** | 18+ gate → 3 free messages → subscribe → chat with fair-use limits. Safety layer applies |
| I7 | **Tips** (secondary) | Solana Pay transaction request into the persona wallet, with a memo |
| I8 | **Pays its own inference** | Every LLM, image and TTS call is paid **from the persona wallet** through an x402-metered endpoint. Use Metaplex's Nori (pay-as-you-go LLM/image, metered in SOL) if its SDK is ready in time; otherwise our own x402 inference proxy, so the agent still pays onchain per call |
| I9 | **Public P&L page** | Income (subscription pulls, tips) minus onchain spend (inference), read from the chain. Off-chain costs (X API, card-billed) shown as a separate, clearly labelled line |
| I10 | **Safety layer** | SFW filter on posts and chat; blocks sexual content, harassment and impersonation. Anti-dependency rules: no romantic-partner framing, no pressure to pay or stay subscribed |

**Not in the MVP:** Instagram posting, video posts, auto-replies on X, games, a token, multiple personas (see §9).

## 6. Earn / spend loop and onchain design

```
fans ──subscription pull / tip (USDC)──► persona wallet ──x402 per call──► inference provider
                                             │
                                             └── memo on every tx: pp:v1|type:<sub|tip|inference>|ref:<id>
P&L = Σ income txs − Σ inference txs   (all read from chain; off-chain costs shown separately)
```

- **Subscriptions:** the Subscriptions Delegation Program lets a program-controlled authority pull only what the fan authorized (amount, period, expiry). It can't move funds beyond that. Supports SPL Token and Token-2022. ([docs](https://solana.com/docs/payments/subscriptions/overview))
- **Demo timing:** a month is too long to show a renewal, so use a short billing period on devnet if the plan terms allow it. Otherwise show the first pull, the subscriber-only unlock, and a cancel.
- **Persona wallet:** Metaplex Agent Kit identity, which gives a wallet without exposing a private key. Fallback: a server keypair with a **spend cap**.
- **Spend guardrails:** a daily inference budget, and a hard stop if balance < threshold. The persona "goes quiet" when broke, which is itself a demo moment.
- **Optional:** a set % of net profit to a cause (the Waterlily payout-mode idea), visible on the P&L.

## 7. Avatar and media options

| Option | What | Fit |
|---|---|---|
| **Static images (MVP)** | A consistent-character image model with a reference image, 1 image per post | Cheapest and fastest; enough for X |
| **D-ID** | Talking head from a single portrait photo; from about $4.70/mo, API on paid plans, generation in under a minute | 1–2 demo clips |
| **HeyGen** | Custom and full-body avatars; well-documented API on higher tiers; from about $29/mo | Better quality, costs more |
| **Tavus** | Real-time conversational video, with a developer SDK | Later: live video chat for subscribers |

Recommendation: static images for posts, plus **one D-ID talking clip** for the demo video.

## 8. Build plan (≤25h)

| Block | Hours |
|---|---|
| Persona definition, voice, reference image | 2 |
| Scaffold on Cloudflare Workers + Supabase + Phantom Connect | 2 |
| Persona brain, post drafting, approval queue | 4 |
| X API posting (+ Automated label set-up) | 2 |
| Subscription plan, accept, cron pull, cancel, subscriber check | 3 |
| Subscriber chat (18+ gate, fair use, safety) + subscriber-only posts | 3 |
| Tips (Solana Pay transaction request) | 1 |
| Agent pays its own inference (x402 / Nori or own proxy) + spend caps | 4 |
| P&L page | 1.5 |
| Demo clip (D-ID) + pitch/demo videos | 2.5 |
| **Total** | **25** |

## 9. Business model and roadmap

- **Now:** a subscription-first AI creator with no token and a public P&L.
- **Business, for VC judges:** a **creator studio** where anyone launches a *disclosed* AI creator with a wallet, subscriptions, spend caps and a public P&L. The platform takes a % of subscription and tip revenue. This goes after the Fanvue-style AI-creator economy (§2) with stablecoin rails and verifiable earnings.
- **Later:**
  - Instagram posting with the AI-generated profile label (needs a professional account and API set-up)
  - Short video posts; a narrated micro-fiction series (reusing the Waterlily engine)
  - An x402 endpoint so other agents can pay to collaborate or commission content
  - Live video chat for subscribers (Tavus-style)
  - An adult vertical under a separate brand with its own age-verification and compliance track. This is the `onlyfans-project` path, never part of the Colosseum submission (rules §12)

## 10. Success metrics (demo day)

- The persona has posted at least 20 approved posts on X under the Automated label, with no enforcement actions
- At least 5 paying subscribers from outside the team, plus at least 1 successful recurring pull shown (or the first pull + cancel, if the billing period can't be shortened)
- 100% of inference calls are paid onchain by the persona wallet, and the P&L totals match onchain sums exactly
- A new fan goes from landing to subscribed and chatting in **under 2 minutes** with no prior wallet
- The spend cap triggers correctly in a test (persona goes quiet at zero budget)

## 11. Scorecard vs Waterlily (1–5), updated

| Criterion | Waterlily | AI creator | Reason for AI creator score |
|---|---|---|---|
| Founder–market fit | **5** | 3 | Agent/compute background helps, but no creator-economy track record |
| Novelty | **4** | 3 | Crowded narrative; the no-token public P&L is the differentiator |
| UX that needs the chain | **5** | 4 | Stablecoin subscriptions + agent-paid compute + verifiable P&L |
| Market / impact | 4 | **4** (was 3) | Proven consumer spend (§2) |
| Business plan | 4 | **4** (was 3) | Subscription-first model matches how AI creators actually earn |
| Solana narrative (agentic payments) | 3–4 | **5** | Agent that earns and spends onchain |
| **Total** | **25–26** | **23** (was 21) | |
| Build hours | **18h** | 25h | |
| Distribution risk | **Low** | High | X API costs and automated-account enforcement are unchanged |

**Assessment:** the gap is now small. Waterlily still edges it on founder fit, novelty and build risk. The AI creator has the bigger proven market and the stronger Solana narrative. Choose Waterlily to minimise risk; choose the AI creator if you want the bigger market story and are comfortable running X carefully (human-approved posts, Automated label).

## Sources

[AI companion spending 2026 (CompanionRater)](https://companionrater.com/ai-companion-statistics-2026) · [AI influencer income 2026 (iimagined)](https://iimagined.ai/blog/ai-influencer-income-real-numbers-2026) · [Instagram AI-generated profile label (Engadget)](https://www.engadget.com/2246914/instagram-will-demote-ai-generated-influencers-if-they-dont-clearly-label-their-account/) · [AI16Z "dead" (CoinDesk)](https://www.coindesk.com/markets/2026/08/05/ai-agent-token-once-worth-usd2-4-billion-ends-with-founder-calling-it-dead) · [Solana Subscriptions & Allowances](https://solana.com/docs/payments/subscriptions/overview) · [X API pricing 2026](https://www.postproxy.dev/blog/x-api-pricing-2026/) · [X Automated account labels](https://help.x.com/en/using-x/automated-account-labels) · [X bot enforcement 2026 (third-party analysis)](https://socialnexis.com/guides/x-june-2026-bot-purge-anatomy) · [Talking-head APIs compared (VEED)](https://www.veed.io/learn/best-talking-head-video-apis) · [Metaplex Agent Kit / Nori](https://www.metaplex.com/docs/agents) · [x402 on Solana](https://solana.com/docs/payments/agentic-payments/intro-to-x402) · [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
