---
type: adr
status: proposed
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [adr, ui, react, design-tokens, theming, components]
---
> **Status: proposed.** Build the UI as a layered React component library driven by design tokens, so styles change in one place and every screen is composed from shared components.

# ADR-005: UI component system (React, design tokens, layered library)

## Context
- The owner asked for the build to start from "repeatable, reusable DRY components", in React, with style elements such as colours easy to create and change (owner request recorded in [PR #5](https://github.com/DeveloperAlly/solana-hack/pull/5), 2026-10-06).
- The wireframes repeat the same patterns across many screens. For example, a draft with checks and Approve / Edit / Reject appears on the content dashboard, the reply queue, the inbox, ambassador approvals, lead outreach and the influencer queue ([wireframes](../context/links.md); [component inventory](../context/component_inventory.md) §6.1 and §8).
- The visual brand does not exist yet. The deck has draft fonts but no ratified identity ([links](../context/links.md)), so the build must start on a neutral theme and take the brand later without code changes.
- The PRD names Cloudflare Workers with Next.js via vinext ([issue #2](https://github.com/DeveloperAlly/solana-hack/issues/2), §12). vinext is Cloudflare's Vite-based reimplementation of the Next.js API ([cloudflare/vinext](https://github.com/cloudflare/vinext)) and is described as experimental ([InfoQ, 2026-03](https://infoq.com/news/2026/03/cloudflare-vinext-experimental)).
- The GamersLab lead finder has a React 18 + Vite dashboard with reusable components (LeadRow, ProspectCard, ScoreBadge, ConfidenceChip, GateBanner, theming) marked for reuse ([research 07](../context/research/07_gamerslab_leadfinder.md)).

## Decision
1. **React + TypeScript component library in five layers**: tokens → primitives → composites → shells → domain patterns. Screens only compose library components and hold no styles of their own. Full list: [component inventory](../context/component_inventory.md).
2. **Design tokens are the only source of style values.**
   - Raw palette values live in `primitives`. Components read only `semantic` tokens (for example `text.primary`, `action.primary.bg`), exposed as CSS custom properties.
   - A **theme** is one JSON file that remaps semantic tokens. Changing a colour means editing one value; creating a theme means adding one file.
   - Themes: `wireframe` (grayscale, used now), `waterlily` (from the brand work), optional `dark`.
3. **Zero-runtime styling:** CSS Modules reading CSS variables. No component hardcodes a colour, spacing, radius or font value; a CI check enforces this.
4. **Config drives repeated structure**, not copied markup: navigation and page tags, channels and their limits, voice dimensions and templates, Brand Kit sections, check types. When research changes (for example 9 vs 10 voice dimensions), only config changes.
5. **In-app workbench and theme editor** (`/system`) instead of a separate Storybook. It shows every component in every variant and state, edits tokens live, checks contrast and exports theme JSON.
6. **Scope boundary.** This ADR covers the UI. The system side (agents, LLM gateway, connectors, registrar) is mapped in [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4) P1; the two meet at the typed data adapters.
7. **Framework-independent library.** Components do not depend on the app framework, so the app shell can run on vinext as the PRD plans, or fall back to a Vite + React SPA on Cloudflare if vinext blocks us. Framework choice is confirmed in build phase B0 ([UI build mission](../../how/missions/mission_ui_build.md)).
8. **Data behind adapters.** Screens read typed data through one interface with a `mock` (fixtures) and a `live` implementation, so screens are built and demoed before the backend exists and don't change when it lands.

## Consequences
- Screens are fast to add once the library exists; Coming soon and roadmap pages become cheap static compositions.
- Up-front cost: tokens, workbench and primitives must land before screens (phases B0–B2 in the [mission](../../how/missions/mission_ui_build.md)).
- The brand identity can arrive late (as a theme file) without blocking the build.
- Lead-finder components are lifted only after being re-themed onto tokens.
- Headless accessibility primitives for complex widgets (dialog, menu, tabs, tooltip, select) are a candidate dependency, to be confirmed in B0 against the bundle and the 10 ms CPU limit noted in the PRD.

## Ratification
Pending owner ratification.
