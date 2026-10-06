---
type: state
status: active
updated: 2026-10-06
last_edited_by: agent
---
# STATE

**Phase:** Build planning. Purpose (ADR-002), business model and product map (ADR-003) and the Brand Builder architecture (accepted 2026-10-06) are decided. The phased build plan is [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4).
**Deadline:** Colosseum Crypto World's Fair, Oct 12 2026, 11:59pm PT (Oct 13, 5:59pm Melbourne). Waterlily's own kit v1 is due by Oct 9.

## Recent decisions
- ADR-002: Waterlily: build your brand, run it, prove it.
- ADR-003: Brand superhub; the brand pays a subscription; partners and ambassadors are seats; USDC ambassador payouts; provenance is a feature; human review on everything; no-AI-slop pass.
- ADR-004: Docs use aDNA (this structure).
- Brand Builder architecture accepted (owner, 2026-10-06); build plan in issue #4. Wireframes come first, then priorities.
- Landing: one value prop, "build your brand, then start creating"; flow land, build brand, branding (owner, 2026-10-06; requirement R5 in the [UI build mission](./.agentic/how/missions/mission_ui_build.md#2-frozen-requirements-owners-words)).
- **Purpose of the build (owner, 2026-10-06):** Waterlily is for the founder's own use. Winning the hackathon is a bonus. The full phased plan stays (no single-loop cut), the ICP stays broad, there's no outside-traction workstream, and the demo runs on devnet. The [VC and judge review](https://claude.ai/artifact/XwyymJ6rGuofXCCvAcctDK) informs the deck, not the scope.
- Registry: Solana Attestation Service, with memo as the fallback (owner, 2026-10-06). The P0 spike settles it (backend map G-SAS).
- Exa is the default search provider, behind an adapter (owner, 2026-10-06). The backend map and `spec/api/` stubs are drafted (proposed).
- UI framework: Vite + React SPA on Cloudflare (owner, 2026-10-06; [ADR-005](./.agentic/what/decisions/adr_005_ui_component_system.md)).
- Wireframes: voices follow research 06 (12 templates, 9 dimensions, claims gate); licensing screens stay parked; aDNA stays the sample brand.
- Demo: Waterlily builds its own brand from scratch, live (headline). aDNA is the second case (strong written brand, no social). film.fun and GamersLab are semi-established case studies. Polish actions include Beautify.

## Blockers
- **Wallet (G-WALLET):** Phantom Connect isn't accepting new apps, so email sign-in can't create an embedded wallet. Proposed: Supabase OTP for sign-in, a server Registrar for registrations, and an injected wallet only for USDC payouts. Needs an owner decision ([backend map §7](./.agentic/what/context/backend_map.md#7-architecture-gaps-and-decisions-needed)).
- **Before Oct 9:** buy 10 OpenRouter credits (the free cap is 50 requests a day) and set up custom SMTP for Supabase OTP (the built-in limit is 2 emails an hour).

## Proposed (awaiting owner)
- ADR-005: UI in React on design tokens (one file changes the look); components are built slice by slice, when a screen first needs them (owner, 2026-10-06), not as a library up front; Vite chosen (owner, 2026-10-06).
- [Component inventory](./.agentic/what/context/component_inventory.md) with each component's first slice.
- [UI build mission](./.agentic/how/missions/mission_ui_build.md): proof-driven delivery in timed chunks; slices S0–S8 along the critical path, each checked on the deployed site. S0 waits on G-WALLET and on the Cloudflare and Supabase accounts (mission Q5).

## Next
0. Owner decides G-WALLET and reviews the [backend map](./.agentic/what/context/backend_map.md) gaps.
1. UI slice S0 per the [UI build mission](./.agentic/how/missions/mission_ui_build.md), once G-WALLET is decided and the deploy and database accounts exist (Q5). The local half of S0 is built and checked.
2. Phase W of [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4): rework and complete the wireframes from the [audit](./.agentic/what/context/wireframe_audit_2026_10_06.md), then mark each screen need or boilerplate.
3. P0: SAS devnet spike (G-SAS); rewrite the PRD in issue #2; gap research (questionnaire UX; verify OpenRouter free tier, X and LinkedIn posting, Cloudflare limits).
4. P1: system component map.
5. Owner ratifies the proposed pipeline rules in [architecture §12.3](./.agentic/what/context/brand_builder_architecture.md#12-end-to-end-walkthrough-user-flow-and-pipeline) and the founder-profile step (2a).
