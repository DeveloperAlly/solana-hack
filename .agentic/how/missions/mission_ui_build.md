---
type: mission
status: proposed
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [mission, ui, build, components, design-tokens]
---
> **Status: proposed.** Phased plan to identify the UI component system and build Waterlily on it. Awaiting owner sign-off. Live progress goes in [STATE.md](../../../STATE.md), not here.

# Mission: UI component system and build

**Parent:** [hackathon submission](./mission_hackathon_submission.md), phase D (build).
**Approach:** [ADR-005](../../what/decisions/adr_005_ui_component_system.md) (proposed).
**Component list:** [component inventory](../../what/context/component_inventory.md) (proposed).
**Scope tags:** [backlog](../backlog/backlog.md).
**Deadline:** Oct 12, 11:59pm PT ([mission](./mission_hackathon_submission.md)). Waterlily's own kit v1 is due by Oct 9 ([STATE](../../../STATE.md)).

## How the work runs
- Every phase is split into **short timed tasks** (30–120 minutes). Each task has a timebox, a deliverable and a check. Running over a timebox is reported, not absorbed.
- Each phase ends at a **gate**. The owner signs off before the next phase starts, matching the repo's phase discipline ([mission](./mission_hackathon_submission.md)).
- After B0, component work is independent per component, so B1–B4 can run as parallel background agents, each owning a slice of the inventory.

## Part 1: Identify the system components

| # | Task | Timebox | Deliverable | Check | State |
|---|---|---|---|---|---|
| 1.1 | Inventory from the wireframes (v1 and v2 canvas) | 60 min | [Inventory](../../what/context/component_inventory.md) §2–§6 | Every artboard decomposed | Done (draft) |
| 1.2 | Inventory from the Brand Builder architecture, backlog and research 06 / 07 | 45 min | Inventory D11–D19, M1–M8 | Every hackathon backlog item has components | Done (draft) |
| 1.3 | Merge duplicates; assign each component one layer | 30 min | Inventory §3–§6 | No concept appears twice | Done (draft) |
| 1.4 | Screen-to-component map | 30 min | Inventory §8 | Every hackathon screen maps only to inventory items | Done (draft) |
| 1.5 | List gaps and decisions | 15 min | Inventory §9 | Each gap has a proposal | Done (draft) |
| 1.6 | **Gate G1:** owner reviews inventory, ADR-005 and this plan | Owner | Sign-off or changes | Gaps 1, 2 and 6 decided | Waiting |

**Part 1 success metrics**
- 100% of hackathon-tagged screens mapped to inventory components (target met in draft: inventory §8).
- 0 screen-specific components outside the domain layer.
- Each component lists variants, states and users.
- The most-shared pattern (ApprovalItem) is used by at least 6 screens (draft: 9).

## Part 2: Build to a phased spec
Each component is built against this spec template, kept next to its code and shown in the workbench:

```
Component: <name> (<ID>)   Layer: <T/P/C/L/D>
Purpose: <one line>
Props: <typed list; required marked>
Variants: <list>
States: <list, incl. loading / empty / error where relevant>
Tokens used: <semantic tokens only>
Accessibility: <role, keyboard, labels, contrast notes>
Used by: <screens / components>
Tests: <render per variant, interaction, axe>
```

**Definition of done (every component)**
1. In the workbench with every variant and state.
2. Uses semantic tokens only (CI check passes).
3. Keyboard operable; visible focus; labelled; axe reports 0 violations.
4. Unit test per variant plus one interaction test where interactive.
5. Props typed and documented.

### Phases

| Phase | Builds (inventory IDs) | Est. | Gate and acceptance |
|---|---|---|---|
| **B0 Foundations** | Repo scaffold; app framework spike (vinext vs Vite SPA, 60 min); token files T1–T12; token build to CSS variables + TypeScript names; ThemeProvider; `wireframe` theme; workbench shell and **theme editor** at `/system`; CI checks (lint, types, tests, axe, no raw style values, no stylesheets in `screens/`) | 4 h | **G2:** changing one semantic token in the theme editor visibly updates every workbench item; a new theme file appears in the switcher with no other code change; contrast check runs on every theme; all CI checks green |
| **B1 Primitives** | P1–P28 | 4 h | **G3:** all primitives meet the definition of done |
| **B2 Composites** | C1–C28 | 6 h | **G4:** all composites meet the definition of done |
| **B3 Shells and config** | L1–L10; M1 routes and nav (with tags), M2 channels, M3 voice model, M4 kit sections, M5 checks, M6 types, M7 mock adapter + fixtures (4 demo brands), M8 formatters | 4 h | **G5:** every route in M1 renders inside its shell (placeholder body); nav, sub-nav, mobile tab bar and tag badges come from config only |
| **B4 Domain patterns** | Approval family D1–D10 first, then Brand Builder D11–D23, campaigns D24–D31, proof D32–D37; inbox and experimental D38–D48 last | 8 h | **G6:** D1 renders all six kinds from fixtures; D20 renders both voice dimension sets from config without code change |
| **B5 Screens (hackathon tag)** | Brand Builder flow (first, because kit v1 is due Oct 9); Voices; Content dashboard + Draft review; Campaign v2; Engage queue; Ambassadors + payout flow (desktop and mobile); Verify; Ledger; Official registry; Hub home | 6 h | **G7:** every hackathon screen built from library only, on mock data; every flow on the canvas is clickable end to end, including error states via the demo state switcher (C28) |
| **B6 Wire services (thin)** | Live adapter behind M7: ingest of URLs and uploads, drafting and polish, slop pass, kit hash registration, one USDC payout, verify, ledger | 10–12 h | **G8:** the PRD demo path runs on live data; ledger totals equal onchain sums; no screen code changed when switching mock to live |
| **B7 Brand, remaining screens, ship** | `waterlily` theme from the brand work; coming-soon / roadmap / experimental screens as static compositions; deploy; demo recording states | 3 h | **G9:** theme switch to `waterlily` needs no component edits; deployed URL works; demo path recorded |

**Estimated total: about 45–47 hours.** The PRD's build budget was 22 hours ([issue #2](https://github.com/DeveloperAlly/solana-hack/issues/2) §12), written for the smaller licensing-era scope. To fit the deadline:
- run B1–B4 as parallel background agents after G2 (components are independent), and
- if still short, cut in this order: inbox / analytics / engagement-rules screens to static "coming soon" (already the backlog tag), then experimental screens to static, then mobile ambassador screens to responsive desktop only.

### Proposed calendar (owner to confirm)
| Date | Work | Gate |
|---|---|---|
| Tue Oct 6 | G1 sign-off; B0 | G2 |
| Wed Oct 7 | B1–B3 in parallel; B4 approval family and Brand Builder components | G3–G5 |
| Thu Oct 8 | B4 rest; B5 Brand Builder screens; start B6 ingest and drafting | G6 |
| Fri Oct 9 | Waterlily's kit v1 through the product; B5 remaining screens | G7 |
| Sat Oct 10 | B6 registry, payout, verify, ledger | G8 |
| Sun Oct 11 | B7 theme, static screens, deploy | G9 |
| Mon Oct 12 | Videos and submission ([mission](./mission_hackathon_submission.md) phase E) | Submitted |

## Proposed code layout
```
web/
  src/
    tokens/        primitives.json, semantic.json, themes/*.json, build output (CSS variables, TS names)
    ui/
      primitives/  P*
      composites/  C*
      shells/      L*
      domain/      D*, grouped by area (approval, brand, voices, campaigns, proof, inbox, experimental, analytics)
    config/        M1–M5
    data/          M6 types, M7 adapters (mock, live), fixtures
    lib/           M8 formatters
    screens/       one folder per area; composition only, no stylesheets
    system/        workbench and theme editor (/system)
```
Each component folder holds `Component.tsx`, `Component.module.css`, `Component.test.tsx` and `Component.examples.tsx` (its workbench entry and spec).

## Overall success metrics
| Metric | Target | How measured |
|---|---|---|
| Raw style values outside `tokens/` | 0 | CI check |
| Stylesheets in `screens/` | 0 | CI check |
| Change a colour | 1 edit in one token file | Theme editor demo |
| Create a theme | 1 new JSON file, no code change | Add `waterlily` in B7 |
| Contrast | Every theme passes text 4.5:1, large text and UI 3:1 | Automatic check in workbench and CI |
| Accessibility | 0 axe violations on workbench and hackathon screens | CI |
| Reuse | ApprovalItem used by 6+ screens; no duplicated organism markup | Inventory §8 and code review |
| Mock to live | 0 screen edits when the live adapter replaces mocks | Diff of `screens/` in B6 |
| Flows | Every canvas flow clickable, including error states | G7 walkthrough |
