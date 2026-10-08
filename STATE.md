---
type: state
status: active
updated: 2026-10-08
last_edited_by: agent
---
# STATE

**Phase:** Build: the product spine is on main and the rest of the UI waits in a PR stack. Purpose (ADR-002), business model and product map (ADR-003) and the Brand Builder architecture (accepted 2026-10-06) are decided. The phased build plan is [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4).

**Where the build is (2026-10-08):**
- **On main:**
  - S0 registry route ([PR #10](https://github.com/DeveloperAlly/solana-hack/pull/10));
  - S1–S4: email-code sign-in, intake with URL ingest and quoted evidence, AI-drafted sections, three gates, and kit v1 registration ([PR #11](https://github.com/DeveloperAlly/solana-hack/pull/11)).
- **Open, merge in this order:**
  - [#14](https://github.com/DeveloperAlly/solana-hack/pull/14): registry diagnostics;
  - [#13](https://github.com/DeveloperAlly/solana-hack/pull/13): S5–S6 thin, covering create, approve, register, Verify and Ledger;
  - [#15](https://github.com/DeveloperAlly/solana-hack/pull/15): full landing and the signed-in hub. It contains #13;
  - [#16](https://github.com/DeveloperAlly/solana-hack/pull/16): polish actions with undo;
  - [#17](https://github.com/DeveloperAlly/solana-hack/pull/17): the voice step from research 06.

  Retarget #16 and #17 to main once their bases merge.
- **Database:** seven migrations are applied to Supabase, confirmed with `list_migrations` on 2026-10-08: `spine_001`, `posts_002`, `posts_registering_003`, `posts_rev_004`, `posts_registration_times_005`, `posts_last_valid_block_height_006` and `kits_registered_at_007`. Their files are `spec/db/001` on main and `002`–`007` in PR #13 (carried up the stack). 004 adds `posts.rev` for compare-and-swap on every post change. 005 adds `registering_at` and `registered_at`. 006 adds `last_valid_block_height`, so an unconfirmed registration is reopened only once it can no longer land. 007 adds `kits.registered_at` for ledger order. RLS is on with no policies, so only the Worker reads and writes.
- **Not yet proven live:** the deployed registry selftest returned 502 after #11. #14 adds the safe diagnostics needed to find the cause.
- **No live use yet:** on 2026-10-08 the live database had 0 users, brands, kits and posts. Nobody has signed in on jamjam.tech, so the spine on main is unproven end to end. CI only type-checks and builds the build, gate and kit paths; there are no tests for them yet. The automated tests cover the UI, and the post and verify logic in the open PRs.
**Deadline:** Colosseum Crypto World's Fair, Oct 12 2026, 11:59pm PT (Oct 13, 5:59pm Melbourne). Waterlily's own kit v1 is due by Oct 9.

## Recent decisions
- ADR-002: Waterlily: build your brand, run it, prove it.
- ADR-003: Brand superhub; the brand pays a subscription; partners and ambassadors are seats; USDC ambassador payouts; provenance is a feature; human review on everything; no-AI-slop pass.
- ADR-004: Docs use aDNA (this structure).
- Brand Builder architecture accepted (owner, 2026-10-06); build plan in issue #4. Wireframes come first, then priorities.
- Landing: one value prop, "build your brand, then start creating"; flow land, build brand, branding (owner, 2026-10-06; requirement R5 in the [UI build mission](./.agentic/how/missions/mission_ui_build.md#2-frozen-requirements-owners-words)).
- **Purpose of the build (owner, 2026-10-06):** Waterlily is for the founder's own use. Winning the hackathon is a bonus. The full phased plan stays (no single-loop cut), the ICP stays broad, there's no outside-traction workstream, and the demo runs on devnet. The [VC and judge review](https://claude.ai/artifact/XwyymJ6rGuofXCCvAcctDK) informs the deck, not the scope.
- Registry: Solana Attestation Service, with memo as the fallback (owner, 2026-10-06). **Settled 2026-10-08:** the devnet spike created and read back a Registrar-signed SAS attestation and minted a test token ([`spike/`](./spike/), backend map G-SAS). Gap G-RPC (the public devnet RPC blocks Workers and rate-limits) is closed by the Helius provider RPC (owner, 2026-10-08).
- Exa is the default search provider, behind an adapter (owner, 2026-10-06). The backend map and `spec/api/` stubs are drafted (proposed).
- UI framework: Vite + React SPA on Cloudflare (owner, 2026-10-06; [ADR-005](./.agentic/what/decisions/adr_005_ui_component_system.md)).
- Hosting: the app runs on the apex of jamjam.tech as a Cloudflare Worker custom domain, deployed from GitHub Actions on merge to main ([PR #6](https://github.com/DeveloperAlly/solana-hack/pull/6)); live since 2026-10-06 (owner, 2026-10-06, [recorded on issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4#issuecomment-6014295120); supersedes the waterlily.ai hosting in R30). The owner added the repo deploy settings; CI checks their names.
- ADR-006: email sign-in (Supabase OTP); a server Registrar keypair signs registrations; a wallet only for USDC payouts (owner, 2026-10-06; G-WALLET decided).
- Wireframes: voices follow research 06 (12 templates, 9 dimensions, claims gate); licensing screens stay parked; aDNA stays the sample brand.
- [ADR-007](./.agentic/what/decisions/adr_007_pitch_positioning.md): the pitch makes end to end (build, run, prove, pay) the differentiator and leads the sale with crypto and developer brands; build scope unchanged. Deck v2 text and notes are in [pitch_deck_2026_10_06.md](./.agentic/what/context/pitch_deck_2026_10_06.md) (draft; placeholders to fill), with the [review](./.agentic/what/context/vc_judge_review_2026_10_06.md) behind it.
- Demo: Waterlily builds its own brand from scratch, live (headline). aDNA is the second case (strong written brand, no social). film.fun and GamersLab are semi-established case studies. Polish actions include Beautify.

- [ADR-008](./.agentic/what/decisions/adr_008_submission_critical_path.md) (proposed, awaiting the owner's ratification): the submission critical path. The spine, a thin Create, and Verify and Ledger come first, then the submission assets. Payouts, X and LinkedIn OAuth, quests, claims, the full settings and the remaining canvas batches are cut. The hub screens that label them "coming soon" are in review in #15, not yet live.
- Helius devnet RPC (G-RPC) and a funded OpenRouter key are in the deploy secrets (owner, 2026-10-08). The Registrar is `E6nY1Wzgish68uZNeJDJKk2wAUWmYwG8yXSZeTSuDvMG`.

## Blockers
- Registry 502 on the live app: cause unknown until #14 deploys.
- Supabase email template: the Magic Link template must include `{{ .Token }}`, or sign-in emails carry a link and no code (owner action).
- Custom SMTP for Supabase OTP is still open. The built-in limit is 2 emails an hour, which is too low for demo rehearsals.

## Proposed (awaiting owner)
- ADR-005: UI in React on design tokens (one file changes the look); components are built slice by slice, when a screen first needs them (owner, 2026-10-06), not as a library up front; Vite chosen (owner, 2026-10-06).
- [Component inventory](./.agentic/what/context/component_inventory.md) with each component's first slice.
- [UI build mission](./.agentic/how/missions/mission_ui_build.md): proof-driven delivery in timed chunks; slices S0–S8 along the critical path, each checked on the deployed site. S0 live half: the deploy now carries the Registrar key and the provider RPC ([PR #10](https://github.com/DeveloperAlly/solana-hack/pull/10); owner added the RPC secret 2026-10-08), but the live self-test still fails (see Blockers).

## Next
- **Now (2026-10-08):**
  1. Merge the PR stack in the order above.
  2. Read the #14 fields in Workers Logs and fix the registry 502.
  3. Run the full flow on https://jamjam.tech: sign-in, ingest, gates, kit v1, then a post through Verify. Check the rows in Supabase.
  4. Register Waterlily's own kit v1 (due Oct 9).
  5. Make the submission assets ([Colosseum hackathon page](https://www.colosseum.com/hackathon)): the presentation video, the product demo video (3 minutes or less), the logo, the go-to-market strategy, demand validation, and the repo link (the README is written for judges).
- **Earlier items.** The full phased plan below stays the owner-approved scope (line on purpose of the build, 2026-10-06). The order above is ADR-008's proposal and is not binding until the owner ratifies it:

0. Owner reviews the remaining [backend map](./.agentic/what/context/backend_map.md) gaps.
1. UI slice S0 per the [UI build mission](./.agentic/how/missions/mission_ui_build.md). **Done (2026-10-06):** checks (1), (4) and (5): the app is built with Vite, deployed to https://jamjam.tech from GitHub Actions ([PR #6](https://github.com/DeveloperAlly/solana-hack/pull/6)), and the post-deploy Playwright run passes (landing loads, `/system` deep link works, axe 0 on both); a token edit changes the page (S0 proof, run in CI). The deploy and database settings exist (owner, 2026-10-06; CI checks their names). The Cloudflare and Supabase accounts exist and the owner has no Phantom account ([owner answers](https://github.com/DeveloperAlly/solana-hack/issues/4#issuecomment-6014295120)). **Left:** (2) email OTP sign-in, and (3) one Registrar-signed devnet registration from the app. The G-SAS spike passed (2026-10-08). The funded devnet Registrar (`E6nY1Wzgish68uZNeJDJKk2wAUWmYwG8yXSZeTSuDvMG`) is the app's Registrar and the provider RPC (G-RPC) is set, both via the deploy ([PR #10](https://github.com/DeveloperAlly/solana-hack/pull/10)). (3) is still open: the live self-test returns 502 (see Blockers).
2. Phase W of [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4): rework and complete the wireframes from the [audit](./.agentic/what/context/wireframe_audit_2026_10_06.md), then mark each screen need or boilerplate.
3. P0: rewrite the PRD in issue #2; gap research (questionnaire UX; verify OpenRouter free tier, X and LinkedIn posting, Cloudflare limits).
4. P1: system component map.
5. Owner ratifies the proposed pipeline rules in [architecture §12.3](./.agentic/what/context/brand_builder_architecture.md#12-end-to-end-walkthrough-user-flow-and-pipeline) and the founder-profile step (2a).
