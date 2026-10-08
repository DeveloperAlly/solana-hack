---
type: manifest
status: active
created: 2026-10-06
updated: 2026-10-07
last_edited_by: agent
tags: [manifest, index]
---
# MANIFEST

## Identity
| Field | Value |
|---|---|
| Name | Waterlily |
| Owner | Ally Haire |
| Domain | waterlily.ai (fallback: waterlily.world) |
| Hosting | Cloudflare |
| Chain | Solana |
| Standard | aDNA v2.5, embedded form (`.agentic/`) |

## Scope
The Waterlily product and its Colosseum Crypto World's Fair submission. Purpose: [ADR-002](./.agentic/what/decisions/adr_002_purpose_build_run_prove.md). Business model and product map: [ADR-003](./.agentic/what/decisions/adr_003_superhub_business_model.md). PRD: [issue #2](https://github.com/DeveloperAlly/solana-hack/issues/2). Build plan: [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4). Live status: [STATE.md](./STATE.md).

## INDEX
| Path | Status | Purpose |
|---|---|---|
| [README.md](./README.md) | active | Judge- and human-first entry point |
| [CLAUDE.md](./CLAUDE.md) | active | Agent boot order and session rules |
| [AGENTS.md](./AGENTS.md) | active | Binding rules for agents and humans |
| [STATE.md](./STATE.md) | active | The only live status |
| [.agentic/what/AGENTS.md](./.agentic/what/AGENTS.md) | active | What belongs in `what/` (knowledge) |
| [.agentic/what/decisions/adr_002_purpose_build_run_prove.md](./.agentic/what/decisions/adr_002_purpose_build_run_prove.md) | accepted | ADR-002: purpose, "build your brand, run it, prove it" |
| [.agentic/what/decisions/adr_003_superhub_business_model.md](./.agentic/what/decisions/adr_003_superhub_business_model.md) | accepted | ADR-003: superhub business model, principles, product map |
| [.agentic/what/decisions/adr_004_docs_use_adna.md](./.agentic/what/decisions/adr_004_docs_use_adna.md) | accepted | ADR-004: docs use aDNA embedded form |
| [.agentic/what/decisions/adr_005_ui_component_system.md](./.agentic/what/decisions/adr_005_ui_component_system.md) | proposed | ADR-005: UI in React on design tokens; components built slice by slice |
| [.agentic/what/decisions/adr_006_wallet_identity_split.md](./.agentic/what/decisions/adr_006_wallet_identity_split.md) | accepted | ADR-006: wallet identity split |
| [.agentic/what/decisions/adr_007_pitch_positioning.md](./.agentic/what/decisions/adr_007_pitch_positioning.md) | accepted | ADR-007: pitch positioning, end to end, sold first to crypto and developer brands |
| [.agentic/what/decisions/adr_008_submission_critical_path.md](./.agentic/what/decisions/adr_008_submission_critical_path.md) | proposed | ADR-008: submission critical path |
| [.agentic/what/context/component_inventory.md](./.agentic/what/context/component_inventory.md) | proposed | UI component inventory, first slice per component, screen-to-component map |
| [.agentic/what/context/compendium_2026_10_06.md](./.agentic/what/context/compendium_2026_10_06.md) | active | Decision compendium 2026-10-06 (v2); source for the PRD rewrite |
| [.agentic/what/context/brand_builder_architecture.md](./.agentic/what/context/brand_builder_architecture.md) | accepted | Brand Builder architecture, data model and per-section input spec |
| [.agentic/what/context/backend_map.md](./.agentic/what/context/backend_map.md) | proposed | Backend map: endpoints, data sources, jobs and external APIs per screen; architecture gaps |
| [spec/api/README.md](./spec/api/README.md) | proposed | Backend boilerplate stubs (comments only) and Supabase schema |
| [.agentic/what/context/wireframe_audit_2026_10_06.md](./.agentic/what/context/wireframe_audit_2026_10_06.md) | active | Audit of the UI wireframes canvas against the spec (v1 and v2 re-review); input to the rework |
| [.agentic/what/context/pitch_deck_2026_10_06.md](./.agentic/what/context/pitch_deck_2026_10_06.md) | draft | Pitch deck v2: slide text, speaker notes and placeholders to fill |
| [.agentic/what/context/vc_judge_review_2026_10_06.md](./.agentic/what/context/vc_judge_review_2026_10_06.md) | active | VC and hackathon-judge review of the wireframes and docs; informs the deck |
| [.agentic/what/context/swot.md](./.agentic/what/context/swot.md) | historical | SWOT of the licensing-era concept; still informs risks |
| [.agentic/what/context/links.md](./.agentic/what/context/links.md) | active | Working links: wireframes, deck, PRD, research |
| [.agentic/what/context/research/README.md](./.agentic/what/context/research/README.md) | active | Research index |
| [.agentic/what/context/research/01_brand_pillars.md](./.agentic/what/context/research/01_brand_pillars.md) | active | Brand-building pillars and the 9-step onboarding workflow |
| [.agentic/what/context/research/02_brand_voice_elements.md](./.agentic/what/context/research/02_brand_voice_elements.md) | active | Brand voice elements and the Brand Kit data model |
| [.agentic/what/context/research/03_platform_performance.md](./.agentic/what/context/research/03_platform_performance.md) | active | What makes a post perform, per platform |
| [.agentic/what/context/research/04_brand_hub_landscape.md](./.agentic/what/context/research/04_brand_hub_landscape.md) | active | Brand-hub and social-ops competitors and gaps |
| [.agentic/what/context/research/05_lilypad_quest_api.md](./.agentic/what/context/research/05_lilypad_quest_api.md) | active | Lilypad quest API review and fit |
| [.agentic/what/context/research/06_voice_templates.md](./.agentic/what/context/research/06_voice_templates.md) | active | Voice templates and a measurable preset model |
| [.agentic/what/context/research/07_gamerslab_leadfinder.md](./.agentic/what/context/research/07_gamerslab_leadfinder.md) | active | GamersLab lead finder review and reuse |
| [.agentic/what/context/research/08_adna_evaluation.md](./.agentic/what/context/research/08_adna_evaluation.md) | active | aDNA evaluation for project context |
| [.agentic/what/context/research/09_demo_brands.md](./.agentic/what/context/research/09_demo_brands.md) | active | Demo brands: public presence and what is ingested vs asked |
| [.agentic/how/AGENTS.md](./.agentic/how/AGENTS.md) | active | What belongs in `how/` (process) |
| [.agentic/how/missions/mission_hackathon_submission.md](./.agentic/how/missions/mission_hackathon_submission.md) | active | Mission: submit to Colosseum, phases A to E |
| [.agentic/how/missions/mission_ui_build.md](./.agentic/how/missions/mission_ui_build.md) | proposed | Mission: UI build in timed chunks, slices S0 to S8 along the critical path |
| [.agentic/how/backlog/backlog.md](./.agentic/how/backlog/backlog.md) | active | Product-map items with build tags |
| [.agentic/how/templates/template_adr.md](./.agentic/how/templates/template_adr.md) | active | ADR template |
| [.agentic/how/sessions/AGENTS.md](./.agentic/how/sessions/AGENTS.md) | active | Sessions folder (stub) |
| [.agentic/who/AGENTS.md](./.agentic/who/AGENTS.md) | active | What belongs in `who/` (people and authority) |
| [.agentic/who/governance/decision_rights.md](./.agentic/who/governance/decision_rights.md) | active | Who ratifies and who proposes |
| [.agentic/who/coordination/AGENTS.md](./.agentic/who/coordination/AGENTS.md) | active | Coordination folder (stub) |

## Superseded
| Path | Status | Purpose | Replaced by |
|---|---|---|---|
| [.agentic/what/decisions/adr_000_story_studio.md](./.agentic/what/decisions/adr_000_story_studio.md) | superseded | ADR-000: Story Studio / Waterlily for authors | ADR-001 |
| [.agentic/what/decisions/adr_001_brand_voice_licensing.md](./.agentic/what/decisions/adr_001_brand_voice_licensing.md) | superseded | ADR-001: Waterlily for Brands, licensing and ambassador payouts | ADR-002, ADR-003 |
| [.agentic/what/context/archive/prd_story_studio.md](./.agentic/what/context/archive/prd_story_studio.md) | superseded | Story Studio PRD (MVP) | ADR-002, ADR-003, issue #2 |
| [.agentic/what/context/archive/roadmap_story_studio.md](./.agentic/what/context/archive/roadmap_story_studio.md) | superseded | Story Studio post-MVP roadmap | Backlog |
| [.agentic/what/context/archive/influencer_scope.md](./.agentic/what/context/archive/influencer_scope.md) | superseded | Self-funding AI creator scope | ADR-003 ("Create an influencer", experimental) |
| [.agentic/what/context/archive/ai_creator_angles.md](./.agentic/what/context/archive/ai_creator_angles.md) | superseded | AI creator angle options | ADR-003 |
| [.agentic/what/context/archive/design_prompts_v1.md](./.agentic/what/context/archive/design_prompts_v1.md) | superseded | Claude Design prompts for Waterlily for Brands | To be rewritten from the compendium and the brand builder architecture |
