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
- Wireframes: voices follow research 06 (12 templates, 9 dimensions, claims gate); licensing screens stay parked; aDNA stays the sample brand.
- Demo: Waterlily builds its own brand from scratch, live (headline). aDNA is the second case (strong written brand, no social). film.fun and GamersLab are semi-established case studies. Polish actions include Beautify.

## Blockers
- None. GamersLab is confirmed as gamerslab.gg.

## Proposed (awaiting owner)
- ADR-005: UI in React on design tokens (one file changes the look); components are built slice by slice, when a screen first needs them (owner, 2026-10-06), not as a library up front.
- [Component inventory](./.agentic/what/context/component_inventory.md) updated for the reworked canvas, with each component's first slice.
- [UI build mission](./.agentic/how/missions/mission_ui_build.md): proof-driven delivery in timed chunks; slices S0–S8 along the critical path, each checked on the deployed site. Frozen requirements and open questions await owner confirmation.

## Next
1. Phase W of [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4): finish the canvas rework. Batch 1 (Brand Builder) and the landing are drawn; batches 2–5 (voices and Draft-Review; Ledger and Verify; claims, quests and settings; states and tags) are not. Then mark each screen need or boilerplate.
2. UI build per the [UI build mission](./.agentic/how/missions/mission_ui_build.md): owner confirms the frozen requirements and open questions there, then slice S0 (preflight) runs. Critical-path screens first, in batches; components are built when a screen first needs them.
3. P0: rewrite the PRD in issue #2; gap research (questionnaire UX; verify OpenRouter free tier, X and LinkedIn posting, Cloudflare limits, Supabase and Phantom embedded wallet).
4. P1: system component map; the UI half is the [component inventory](./.agentic/what/context/component_inventory.md).
5. Owner ratifies the proposed pipeline rules in [architecture §12.3](./.agentic/what/context/brand_builder_architecture.md#12-end-to-end-walkthrough-user-flow-and-pipeline) and the founder-profile step (2a).
