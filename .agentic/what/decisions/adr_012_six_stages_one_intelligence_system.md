---
type: adr
status: proposed
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [adr, architecture, intelligence-system, distribution, composability]
---
> **Status: proposed.** The product is six stages on one shared brand intelligence system; modules are packages behind typed contracts with registries as extension points; every platform is accounted for in the spec and built by demand.

# ADR-012: Six stages on one intelligence system; composable modules; platforms by demand

## Context
- **The owner's product definition (2026-10-13, working session).** The complete system is: (1) build your brand and voice, using the intelligence system; (2) create your content, with an intelligence system made for your brand and voice; (3) distribute everywhere, to all the platforms; (4) verify anywhere, through the ledger; (5) grow your reach (ambassadors, influencers, campaigns), also on the intelligence system; (6) learn from what works (analytics and self-learning), also an intelligence system. Her rulings in the same session: "the spec should account for this; doesn't mean it gets built now; features get built by demand or market need", and the architecture must be "fully composable, scalable and maintainable". The README already opens with these six steps ([README, The system](../../../README.md#the-system)).
- **The planning failure she called out.** The architecture specified the intelligence system as scattered features, each in its own place: the evidence store ([architecture §3](../context/brand_builder_architecture.md#3-data-model)), the voice ladder (§6.2), learned rules (§6.1, backlog T1b), the validation loop (§2 stage 9, §12.3 rule 6, backlog B16), analytics (backlog N1 to N4) and the evaluators (§6.1, §13). In the code each feature reads its own data directly (`voiceContext`, `allEvidence` and `policyCheck` in [`posts.ts`](../../../web/worker/posts.ts)).
- **Distribution stopped at five platforms:** Bluesky, LinkedIn as a member, X, Threads and LinkedIn Company Pages ([backend map §10.5](../context/backend_map.md#105-publishing-order-p2-p3-p3a); architecture §6.1 Publishing row). The owner's platforms page lists far more (social, long-form, video, community and developer platforms; [issue #82](https://github.com/DeveloperAlly/solana-hack/issues/82)).
- **Composability was decided for components but not for the stages.** Backend map §10.3 already decides that each component becomes a package with a typed contract and no Cloudflare or Supabase code inside, and lists ten modules ([backend map §10.3](../context/backend_map.md#103-reuse-providers-and-packaging), accepted in [ADR-010](./adr_010_component_list_and_plan_tiers.md) decision 6). It has no module for shared brand memory, the learn loop, campaign optimisation, distribution adapters or analytics ingest.

## Decision
1. **Six stages are the top-level structure** of the architecture and the backlog: Build, Create, Distribute, Verify, Grow, Learn ([architecture §2a.1](../context/brand_builder_architecture.md#2a1-the-six-stages)). The backlog sections follow them; no row or ID is removed.
2. **One brand intelligence system (backlog X18)** is the shared engine every stage reads from and writes to: brand memory (evidence with quotes, kit versions, voice, claims, learned rules, decision history, outcomes), retrieval, the model gateway and model choice (default `openrouter/free`), evaluators and gates, and the learning loop ([architecture §2a.2](../context/brand_builder_architecture.md#2a2-the-brand-intelligence-system-backlog-x18)). Its invariants: human approval on everything; nothing grades itself; only quoted facts are evidence; the owner approves every learned change; one brand's memory never shapes another brand's output.
3. **The learn loop (backlog N5)** turns outcomes into proposals for Build, Create, Distribute and Grow. Each proposal cites the outcomes it rests on, is judged by a check other than the model that wrote it, changes nothing until the owner approves it, and is versioned and reversible ([architecture §2a.3](../context/brand_builder_architecture.md#2a3-the-learn-loop-backlog-n5)). Self-learning campaigns (R11) are one consumer.
4. **Distribution is an adapter registry (backlog P7)** with one adapter per platform declaring capabilities, auth, format limits, cost, AI-disclosure flags and optional metrics read-back. Every platform in [architecture §2a.4](../context/brand_builder_architecture.md#2a4-distribute-everywhere-backlog-p7-to-p19) has a backlog row (P1 to P19). **All are accounted for in the spec; which are built is decided by demand or market need.**
5. **Composable, scalable, maintainable** ([architecture §2a.5](../context/brand_builder_architecture.md#2a5-composable-scalable-maintainable)): the modules added to backend map §10.3 (brand memory, learn loop, campaign optimiser, distribution adapter registry, analytics ingest, evaluator registry) are packages behind typed contracts with no Cloudflare or Supabase code inside. Registries are the extension points (sources, platforms, media renderers, evaluators, model providers, proposal kinds). Modules are extracted from the Worker files when a file is next changed for a feature, one module per PR, behaviour unchanged and covered by a contract test.
6. **By demand.** A new backlog tag, "by demand", marks rows that are accounted for in the spec and built when demand or market need shows. Backlog §15 gains a By demand list (P8 to P19, R11); X18 joins Phase 2, and P7 and N5 join Phase 3.

## Consequences
- A new platform, source type, renderer, evaluator or model provider is one registry entry, one test and one backlog row; stage code does not change.
- Every stage gets the same evidence rules and gates, because they all read through one engine; a stage can no longer read another stage's tables directly.
- Learned behaviour is visible and reversible: nothing the system learns reaches a brand without the owner's approval.
- Platform rows P8 to P19 carry access facts the repo has not verified; each is checked on the platform's own docs before it is built.
- Not decided here: which stages or platforms are built next, proposal thresholds, storage partitioning and retention, and the move to a separate pipeline Worker or the paid Workers tier.
- AGENTS.md rule 8 (canvas): this ADR changes no screen today. If ratified, aligning the hub navigation (Home, Brand, Create, Grow, Inbox, Analytics, Ledger, Settings; backlog A3) to the six stage names is a canvas follow-up, and the platforms page in [issue #82](https://github.com/DeveloperAlly/solana-hack/issues/82) should read from the adapter list in architecture §2a.4.

## Ratification
Pending owner ratification.
