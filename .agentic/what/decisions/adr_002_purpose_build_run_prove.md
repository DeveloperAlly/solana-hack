---
type: adr
status: accepted
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [adr, purpose, product-direction]
supersedes: adr_001_brand_voice_licensing
---
> **Status: accepted.** Waterlily: build your brand, run it, prove it.

# ADR-002: Purpose: build your brand, run it, prove it

## Context
The licensing-centred direction (ADR-001, PRD v2.1 in [issue #2](https://github.com/DeveloperAlly/solana-hack/issues/2)) was re-examined against new research ([research index](../context/research/README.md)) and the [SWOT](../context/swot.md). The full decision memo is below.

## Decision
Option A, with B as one module: **Waterlily: build your brand, run it, prove it.** A brand OS with a proof layer on Solana, with official AI personas as a module (see "Recommendation" in the memo below). The business model and product map that follow are in [ADR-003](./adr_003_superhub_business_model.md).

## Consequences
- "Pay to write in a brand's voice" is dropped.
- Replies are draft-and-approve; payouts reward off-X work.
- The hackathon cut and kill criteria below govern the build scope.

## Ratification
Ratified by Ally Haire in chat, 2026-10-06

---

## Decision memo (full text)

### Waterlily: purpose decision memo

**Date:** 2026-10-06 · **Inputs:** [research](../context/research/README.md), the [SWOT](../context/swot.md), issue #2 (PRD v2.1), founder feedback
**Deadline:** Oct 12, 11:59pm PT, which is Tue Oct 13, 5:59pm Melbourne (about 6.5 days)

### Goals, in priority order (founder)
1. Submit something that **does well** with the judges.
2. Build something the founder **needs anyway**: her own personal brand plus aDNA, with inbound opportunities and an audience.
3. Reuse existing work: the founder's personal-brand process (12-stage process and workbook), the founder's brand database proof layer (claim, metric, evidence, provenance), and the Lilypad quest API data model.

### What the research changed
- **"Pay to write in a brand's voice" is dropped.** Nobody needs it; the founder's instinct is right.
- **Voice is the whole brand, not tone.** It covers purpose, beliefs/POV, values, positioning, value propositions, audience, messaging, voice attributes, tone presets per context, vocabulary, claims with evidence, visual, audio and behaviour ([02](../context/research/02_brand_voice_elements.md)). Existing tools merge all of this into one generic "voice" blob, and they leave out beliefs, claims tied to evidence, and founder-vs-company voice.
- **Cold start is solvable without data.** Run an interview-led workflow, 9 steps, all zero-data ([01](../context/research/01_brand_pillars.md)). No competitor runs strategy-first onboarding; they all need existing content ([04](../context/research/04_brand_hub_landscape.md)).
- **What does well on each platform is now known**, and can be scored as rules ([03](../context/research/03_platform_performance.md)).
- **Automation limits shape the product.**
  - X bans keyword auto-replies and paying users for X actions; AI replies need X's approval.
  - LinkedIn closes member-post reads.
  - So replies must be draft-and-approve, and payouts must reward off-X work.
- **Provenance alone is too thin** to be a product, as the founder suspected. But a public, checkable record of what is official is a real, unoccupied gap (C2PA metadata gets stripped by platforms; AI persona tools ship with no disclosure). It works as **the trust layer of a hub**, not as the hub.
- **The Lilypad quest API** is a thin, unauthenticated scaffold that's been dormant for 14 months, and its quest catalogue rewards X actions. Reuse the data model, not the code ([05](../context/research/05_lilypad_quest_api.md)).

### Candidate purposes

| | A. Brand OS with a proof layer (recommended) | B. Official AI personas | C. Provenance registry only |
|---|---|---|---|
| **One line** | Build your brand from zero, run it every day, and make everything official provable | Make a disclosed AI influencer for your brand, attested onchain | "Is this official?" for brand content |
| **Founder needs it?** | **Yes, directly.** It is the stated purpose of the founder's personal-brand process, and it serves aDNA | Somewhat (the founder's AI-persona direction) | Barely |
| **Judging: product, UX, market** | Strong: a clear gap in strategy-first onboarding and the solo-founder loop | Medium: crowded, and the token-agent story has burned out | Weak as a standalone product |
| **Judging: blockchain use** | Medium-high, if the proof layer is central (official registry, claims with evidence, paid quests in USDC) | Medium: persona attestation plus tips and subscriptions | High but narrow |
| **Build risk in 6 days** | Medium. Scope must be cut hard; the rest goes in the UI as "coming soon" | Medium | Low |
| **Reuse** | the founder's personal-brand process, the founder's brand database proof layer, quest model, existing wireframes | the founder's AI-persona concept | Verify screens |

### Recommendation: A, with B as one module

**Waterlily: build your brand, run it, prove it.**
1. **Build.** A guided, interview-led brand builder that works with zero content, following the 9-step workflow. It produces a full **Brand Kit** (the 17-section model): what we stand for, plus how we say it, with tone presets per channel. Founder and company get linked profiles.
2. **Run.** A content studio that writes in the kit's voice and scores each draft against the platform checklist. A post dashboard holds drafts, a calendar and an approval queue. **Coming soon in the UI:** reply drafts, listening and lead finding, analytics.
3. **Prove (Solana).** An **official registry** with a verify page and badge, built on onchain records:
   - the brand's identity (domain proof)
   - its official accounts
   - its official content
   - its **claims with evidence** (bringing the brand database proof-layer idea onchain)
   - its **official AI personas** (module B: disclosed and attested)
4. **Grow (Solana).** **Community quests** paid in USDC for off-X work: tutorials, docs, LinkedIn posts, events. Ambassadors are curated, there's an auto-disclosure, and the quest design comes from Lilypad's data model.

**Why this framing:**
- The founder uses it for her own brand and aDNA from day one, which also gives the demo **real traction**.
- Judges get a clear gap (no strategy-first hub exists) **and** a Solana layer doing real work: provenance and payouts.
- B and the quests are modules, so the build scope can flex.

### Hackathon cut (build vs. "coming soon")
- **Build, end to end:**
  1. Zero-data onboarding interview
  2. Brand Kit
  3. Draft a post with its platform score
  4. Register it as official on Solana
  5. Public verify page and badge
  6. One curated quest: a tutorial, approved and paid in USDC
- **Build thin:** an official AI persona as an attested profile (a disclosed persona card plus onchain attestation), with no posting automation.
- **UI only ("coming soon"):** reply drafts, listening and leads, analytics, scheduling integrations, audio kit.

### Kill criteria
- **By Oct 8:** if onboarding can't produce a Brand Kit good enough for **aDNA's real use**, cut to the founder's personal brand only and reduce the quest work.
- **By Oct 10:** if register → verify isn't working end to end, drop quests and AI personas from the build (keep them in the UI).
- **Pitch test:** if the pitch can't explain in one sentence why the chain is needed, lead with the "official registry" (verifiable after platforms strip metadata, and resistant to impersonation, which crypto brands suffer badly).

### Decisions needed from the founder
1. Approve A (with B as a module), or pick another.
2. Confirm the demo brands: aDNA and the founder's personal brand as primary, GamersLab and film.fun as secondary.
3. Allow reuse of the founder's personal-brand process content and the founder's brand database ideas in a public repo (summarised, no private data).
