# Compendium 2026-10-06: Waterlily becomes a brand superhub

> **Status:** CURRENT. This is the decision record for 2026-10-06 and the source for the next PRD rewrite.
> **Supersedes:** the licensing-centred PRD v2.1 (issue #2), the story PRD (`docs/PRD.md`) and its `ROADMAP.md`, `INFLUENCER.md` and `AI-CREATOR-ANGLES.md` as product direction (they stay as history).
> **Sources:** the founder's design-chat thread (2026-10-05/06), founder answers in chat, [PURPOSE.md](./PURPOSE.md), and research [01–08](./research/README.md).

## 1. Purpose (decided)
**Waterlily: build your brand, run it, prove it.** A brand superhub. It is both the product vision and the hackathon build, scoped by the hackathon / roadmap tags in §5.

## 2. Business model (decided)
- **The brand pays** a subscription for the hub.
- **Partners, agencies and ambassadors** get access to the brand's voice as **seats or invites** on the brand's account. They are not paying customers.
- **Ambassador payouts in USDC stay.** This is the one money flow brands already spend on, and where Solana does real work: cross-border payments, per verified post, from a capped budget.
- **Consent and provenance are features of what brands pay for, not the business on their own.**
- **Licensing ("pay to write in a brand's voice") is dropped as a headline flow** and becomes at most a roadmap line. The evidence: brands pay for voice tools (Jasper's voice tools sit in its paid tiers), but nothing showed outsiders paying a brand per piece. When brands want partners on-message, they hand them the assets free.
- **Pitch:** a brand hub that writes in your voice, runs your campaigns, pays your community per verified post, and proves what's official. Voice and drafting are table stakes. Paid community plus provenance are what set it apart.

## 3. Principles (decided)
1. **Human review on everything.** Nothing posts, replies, follows or sends without a person approving it.
2. **Every draft runs through a no-AI-slop pass** before a human sees it.
3. **X's rules are not the product's governing constraint, but platform rules are respected per platform.** Engagement features are built as draft-and-approve. The research behind this:
   - X bans bulk follow/unfollow, automated likes and untargeted auto-replies ([X automation rules](https://help.x.com/en/rules-and-policies/x-automation)).
   - LinkedIn reportedly closes accounts that use automation tools. This is secondary-source only; LinkedIn's own pages couldn't be fetched.
4. **AI personas are always labelled.** The experimental influencer carries a visible AI watermark.
5. **Claims carry evidence.** This brings the evidence-and-source rule from the founder's brand database onchain as "claims with evidence".
6. **Demo content is SFW.** Colosseum rules §12 ban "indecent, obscene" content. "Flirty" exists as a voice template, but demo brands stay SFW.

## 4. Demo brands (decided)
- **Primary:** aDNA, and the founder's personal brand.
- **Extras:** GamersLab and film.fun.

## 5. Product map (decided structure; tags drive the build)
Navigation: **Brand / Create / Grow / Inbox / Analytics / Ledger-Verify**.

| Area | Page | What it does | Tag |
|---|---|---|---|
| Brand | **Build your brand** | Guided, interview-led brand pack that works with zero content and adds to what's already public: purpose, beliefs, values, positioning, value props, audience, messaging, core voice, then tone presets on top ([01](./research/01-brand-pillars.md), [02](./research/02-brand-voice-elements.md)) | Hackathon |
| Brand | **Voices (templates)** | Voice templates as presets over fixed, measurable dimensions (§6); multiple voices per pack | Hackathon |
| Brand | **Claims with evidence** | Each claim has evidence, an owner and an expiry, and can be registered onchain | Hackathon (thin) |
| Create | **Campaign builder v2** | Platform(s), purpose, success metrics, then a content plan | Hackathon |
| Create | **Content dashboard** | Posted, replies, and drafts awaiting approval; scheduled posting; per-platform scoring ([03](./research/03-platform-performance.md)) | Hackathon |
| Grow | **Engagement assist** (formerly "10x your impact") | Reply queue in the brand voice with one-click human approval; who-to-engage suggestions; suggested lists the user applies themselves; scheduled posting; opt-in auto-replies only (e.g. to people who mention the brand) | Hackathon (reply queue) / roadmap (rest) |
| Grow | **Ambassadors and paid quests** | Curated ambassadors, briefs, verified posts, USDC payouts from a capped budget. Quest mechanics follow the Lilypad quest data model, rebuilt and rewarding off-X work ([05](./research/05-lilypad-quest-api.md)) | Hackathon (one payout) / **quests: coming soon** |
| Grow | **Find your customer** (lead finder) | Reuses the founder's GamersLab lead finder, generalised so the brand kit drives ICP, keywords and weights ([07](./research/07-gamerslab-leadfinder.md)) | Experimental |
| Grow | **Create an influencer** | The founder's own AI persona, with avatars by a collaborator and a visible AI watermark, tied to the verified brand pack and attested onchain | Experimental |
| Grow | **Partner invites** | Partners and agencies write in the brand voice as seats (what's left of licensing) | Roadmap |
| Inbox | **Unified inbox** | One Gmail-style inbox across Telegram, WhatsApp, X DMs, LinkedIn, email, Discord and Slack, with an "All inboxes" view ([§7](#7-unified-inbox-new)) | Coming soon |
| Inbox | **Needs reply** | Flags messages that need a response, ranked; AI drafts a reply for human review | Coming soon |
| Analytics | **Analytics** | What's performing and what isn't, per platform and per voice | Roadmap (UI shown) |
| Ledger-Verify | **Official registry + verify** | Onchain records of the brand identity, official accounts, official content, claims and AI personas; verify page and badge | Hackathon |
| Ledger-Verify | **Ledger** | Payouts, cause giving, registrations | Hackathon |

Every page gets an artboard with empty, loading, success and error states and annotated interactions, and is tagged hackathon / experimental / coming soon / roadmap.

## 6. Voice templates (decided model; values to calibrate)
- **Do these exist?** Partly. Products ship tone *labels* or rewrite verbs: ChatGPT (Default, Professional, Friendly, Candid, Quirky, Efficient, Cynical, plus More/Less controls for warmth, enthusiasm and emoji), Copilot, Google, Canva, Wordtune, QuillBot, Grammarly. HubSpot, Jasper and Copy.ai learn voice from samples. **No mainstream product publishes measurable parameter presets, offers per-post template mixing, or treats claims as part of the preset.** Small open-source precedents exist: Grain (numeric parameters with channel overrides) and VOICE.md. No product offers "flirty" ([06](./research/06-voice-templates.md)).
- **Dimensions** (1–5):
  - formality
  - energy
  - humour
  - warmth
  - sentence length
  - jargon
  - emoji and punctuation
  - CTA intensity
  - **claims strictness**, which is a policy gate, not a slider
- **Starter templates:** Academic, Enterprise, Professional, Friendly, Plainspoken, Efficient, Candid/Founder, **Playful**, **Flirty** (suggestive, never explicit, behind a content-policy gate), Sales, Hype/Launch, Empathetic/Support.
- **Scoring:** each preset is a set of numeric targets with tolerance bands, with per-channel overrides. Drafts are scored automatically: formality by F-score or a classifier, sentence length by readability, emoji and exclamation rates, CTA lexicon, and claims against the approved list. Humour and warmth need an LLM rater plus human spot checks.

## 7. Unified inbox (new)
- **Founder need:** one Gmail-style inbox for all social and messaging DMs, plus a "needs reply" view.
- **Feasibility by channel:**
  - **Email:** official APIs (Gmail, Outlook).
  - **Telegram:** reading your own chats needs the MTProto client API (api_id/api_hash). It's allowed, but Telegram watches unofficial clients and bans spam ([guide](https://www.upload-post.com/telegram-api/)).
  - **X DMs:** API, pay-per-use.
  - **Discord:** bots only see servers they're added to; self-bots are against the terms.
  - **Slack:** official.
  - **WhatsApp:** only the **Business Platform** is officially supported, for business numbers, with opt-in and a 24h window. Personal WhatsApp has no official API, and automating the consumer client violates WhatsApp's terms, with permanent bans ([CodeWords](https://www.codewords.ai/blog/whatsapp-business-api-vs-unofficial-api)).
  - **LinkedIn messages:** no member API; aggregators use credentials, cookies or a QR code.
  - **Third-party aggregator:** Unipile offers one API across LinkedIn, WhatsApp, Instagram and Telegram ([Unipile](https://www.unipile.com/communication-api/messaging-api/)). Account-ban risk for personal WhatsApp and LinkedIn still applies.
- **Decision:** tagged **coming soon**. The full UI is drawn. Build order when it is built:
  1. Email, Telegram and X
  2. WhatsApp Business
  3. Personal WhatsApp and LinkedIn only with the user's explicit opt-in to the ban risk

## 8. Reuse (decided)
- **Personal-brand process and research** (founder-owned): summarise the ideas publicly, with no private data.
- **Brand database proof layer** (claim, metric, evidence, provenance): becomes the onchain "claims with evidence".
- **Lilypad quest API:** reuse the data model only. It has no auth, has been dormant for 14 months, and its quest list rewards X actions, which X now bans.
- **GamersLab lead finder:** reuse the UI kit, scoring and budget patterns. **Drop email harvesting, WHOIS lookup and guessed addresses** (Australian Spam Act and privacy exposure). The demo produces a scored list and drafted messages, with no sending.

## 9. Open items
- Calibrate voice template values with a small user test.
- Verify LinkedIn's automation policy from primary pages (blocked from fetching).
- Fully read the Lilypad quest repo (needs connector approval for the Lilypad-Tech org).
- Decide the docs/aDNA structure ([08](./research/08-adna-evaluation.md)).
- Rewrite the PRD (issue #2), update the wireframes and deck to this compendium.
