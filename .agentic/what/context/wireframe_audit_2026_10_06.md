---
type: audit
status: active
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [wireframes, audit, ui]
---
> **Status: active.** Audit of the [UI wireframes canvas](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn) (57 artboards) against the [Brand Builder architecture](./brand_builder_architecture.md), the [compendium](./compendium_2026_10_06.md) and [research 06](./research/06_voice_templates.md). This is the input to the wireframe rework, which comes first in [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4).

# Wireframe audit (2026-10-06)

**Method:** read the canvas index, every artboard file and every canvas note, then checked each one against the specs linked above.

## Inventory
| Canvas page | Artboards |
|---|---|
| Landing | 1 |
| Superhub (v2) | 20: home, inbox ×3, brand, voices ×2, content ×3, campaign v2 ×2, engagement ×2, partners, leads, influencer ×2, analytics ×2 |
| Brand onboarding | 10: wizard ×7, ambassador management ×2, campaign builder v1 |
| Ambassador | 14: desktop ×9, mobile ×5 |
| Licensee (parked) | 7 |
| Verify + ledger | 4 |

## Keep (copy fixes only)
- **Hub and inbox:** Hub-Home, Inbox-All, Inbox-NeedsReply, Inbox-Connect. Unconfirmed API access is already marked in brackets.
- **Create:** Content-Dashboard (and its empty state), Campaign-v2 steps 1–2.
- **Grow:** Engage-Queue, Engage-Rules, Leads, Influencer-Setup, Influencer-Queue.
- **Analytics:** both screens.
- **Verify:** Verify-2 (no match) and Verify-3 (edited).
- **Ambassador:** all screens, desktop and mobile. Rename "voice pack" to "kit".

## Rework
| Artboard | Why |
|---|---|
| Main (landing) | Hero and entry points still describe voice licensing ("licensed on your terms", "license a voice", "Since 2023") |
| Onboard 1–4 and 6 | The wizard steps are sign-in, domain, sources, voice pack and license terms. It must become the Brand Builder intake (architecture §5) |
| Brand-Build | 9 sections instead of the 17 in the architecture. Missing: a coverage view (evidenced / inferred / missing), evidence per fact, the 3 decision gates, assumption labels, kit hash |
| Voice-Templates, Voice-Editor | Use the research 06 model (decided 2026-10-06): 12 templates, 9 dimensions, claims strictness as a gate, Flirty behind a content-policy gate. Drop the Irreverence and Suggestiveness dials |
| Draft-Review | Has the slop check but none of the polish actions (Review, Shorten, Clarify, Beautify plus accessible mode) and no platform score |
| Ledger, Verify-1 | Show license fees, splits and consent. Should show registrations: identity, account, kit, claim, content, persona, plus payouts |
| Dashboard, Dashboard-Empty, Partners | Licensing-era wording ("voice pack", "license") |

## Missing (in the spec, no screen)
- **Brand Builder intake steps:**
  - intake form (type, stage, goals, links)
  - origin
  - Golden Circle
  - alternatives and what makes you different
  - audience
  - voice by example
- **Brand Builder views:**
  - coverage map
  - Gate 1 (purpose), Gate 2 (positioning), Gate 3 (voice)
  - kit v1 approved and registered
  - aDNA export
- **Claims with evidence:** each claim shows its evidence, owner, expiry and registration.
- **Quests** (coming soon).
- **Settings:**
  - publishing connections (X, LinkedIn, clipboard fallback)
  - AI model and bring-your-own key
  - plan, seats and billing (subscription model, ADR-003)
- **States:** most hub screens have no loading or error state. Some have no empty state.

## Conflicts and decisions
| Conflict | Decision (owner, 2026-10-06) |
|---|---|
| Voice model: wireframes have 7 templates on 10 dials; research 06 has 12 templates on 9 dimensions plus a claims gate | Research 06 wins. Update the wireframes |
| Licensing screens (7 licensee screens, Onboard-5, campaign builder v1) | Keep them on the Parked page for reference, untouched |
| Sample brand on hub screens: aDNA is shown on X, but research 09 found no social presence | Keep aDNA as the sample brand for now, including X (it shows aDNA going onto social) |
| "Ally Haire" is listed as a demo brand on the landing page and the ledger | The compendium decided the founder's personal brand is a user, not a demo case. Remove it from the demo brand lists |
| Waterlily doesn't appear as a brand anywhere | Add it to the brand switcher and the case-study screens (headline demo) |
| Sample figures (ledger, home) are not labelled on screen | Label them as sample data |
| The tag legend refers to a "22 h hackathon build" and its tags differ from the backlog | Align it with the [backlog](../../how/backlog/backlog.md) tags |
