---
type: mission
status: active
created: 2026-10-06
updated: 2026-10-12
last_edited_by: agent
tags: [mission, hackathon, colosseum]
---
> **Status: active.** Mission: submit JamJam to Colosseum Crypto World's Fair. Live progress is in [STATE.md](../../../STATE.md), not here.

# Mission: hackathon submission

**Goal:** submit JamJam to Colosseum Crypto World's Fair by **Oct 12, 11:59pm PT** (Oct 13, 5:59pm Melbourne).

**PRD home:** [issue #2](https://github.com/DeveloperAlly/solana-hack/issues/2).
**Built on:** [ADR-002](../../what/decisions/adr_002_purpose_build_run_prove.md) (purpose), [ADR-003](../../what/decisions/adr_003_superhub_business_model.md) (business model and product map), [backlog](../backlog/backlog.md) (build tags).

## Canonical execution plan

Read this plan first at every work cycle and handoff. [Master #38](https://github.com/DeveloperAlly/solana-hack/issues/38) owns scope; [execution #114](https://github.com/DeveloperAlly/solana-hack/issues/114) owns work allocation and acceptance. Current status lives only in [STATE.md](../../../STATE.md).

1. Codex integrates existing PR work into a real persisted Journey: source intake, quoted facts, owner confirmation, gaps and voice, approved kit registration, approved post registration, and genuine verification.
2. Claude finishes UI. Reuse wireframes, shared theme and components. Codex owns integration seams; no duplicate screen development.
3. Codex executes release and submission preparation in parallel: inventory existing approved assets, prepare recordings and portal content, validate the deployed critical path, and capture the final submission receipt.

## Timeboxes and reporting

Each work block has a maximum of 20 minutes. Every agent and the orchestrator reports at 10-minute intervals: concrete outcome/artifact, acceptance evidence, blocker, and next action. At the 20-minute limit, stop exploration and return a reviewable result or explicit failed check with fallback for reassignment or scope reduction. No open-ended investigation or repeated review loop.

## Proof and delegation contract

Every task names one owner, dependencies, acceptance checks and a next action on #114. Agents return exact commits and reproducible evidence. The orchestrator independently checks integrated behavior; an agent report alone never marks delivery complete. Local tests, database simulation and deployment dry-run prove only their stated scope. Release requires actual cloud provisioning, applied migrations and a deployed end-to-end walkthrough. Submission requires the complete asset package and portal receipt. Failed checks yield a concrete correction or fallback, with no repeated review loops.

## Owner boundaries

The pitch deck and pitch script retain the approved sales voice and cannot change without explicit owner authorization. Demo changes are authorized. Prefer real functionality; clearly label demonstration fixtures. No Docker. Reuse existing branches and PRs. Read recorded scope and inventory existing assets before asking the owner for missing information.
