---
type: governance
status: active
created: 2026-10-06
updated: 2026-10-13
last_edited_by: agent
tags: [governance, rules]
---
# AGENTS.md: binding rules

These rules bind every agent and human working in this repo.

**Read first at every work cycle and handoff:** [canonical delivery plan](.agentic/how/missions/mission_hackathon_submission.md), [master #38](https://github.com/DeveloperAlly/solana-hack/issues/38), [execution #114](https://github.com/DeveloperAlly/solana-hack/issues/114), and [STATE.md](STATE.md). Reconcile scope before implementation; do not ask the owner to repeat recorded instructions.

1. **Frontmatter and banner.** Every doc under `.agentic/` has YAML frontmatter with `type, status, created, updated, last_edited_by, tags` (plus `supersedes` / `superseded_by` where relevant), and a one-line status banner as the first body line.
2. **Status values** are exactly: `draft` / `proposed` / `active` / `accepted` / `superseded` / `historical`.
3. **Superseded docs are kept, never deleted.** They carry `superseded_by` and a banner naming their replacement.
4. **Decisions are ADRs** in [`.agentic/what/decisions/`](./.agentic/what/decisions/), using [the ADR template](./.agentic/how/templates/template_adr.md). Only the owner (Ally Haire) ratifies; agents may propose (status `proposed`). See [decision rights](./.agentic/who/governance/decision_rights.md).
5. **Public-repo firewall.** Never reference private repositories, private vaults, local paths, personal data or secrets.
6. **Every factual claim cites a source** (a link, a research doc, an ADR, or the issue it came from).
7. **MANIFEST.md indexes and never restates.** It points to docs; it does not copy their content. Live status lives only in [STATE.md](./STATE.md).
8. **The canvas follows the product.** The [wireframe canvas](./.agentic/what/context/links.md) is the UI spec, and its Journey page is the onboarding spec. A PR that changes what a user sees, and an ADR or plan change that changes product behaviour, updates the canvas in the same change, or says in the PR why no update is needed. The [PR template](./.github/pull_request_template.md) asks for this. Why: decisions that never reached the canvas let it drift from the product ([2026-10-12 audit](./audits/2026-10-12_onboarding-journey-wireframe-audit.md), root cause 2).
9. **Three open PRs at most.** No more than 3 PRs are open at once across the repo. Before opening a PR, an agent checks the open count; at 3, it first merges or closes one of its own, or adds its work to a PR already open. Each PR in a stack (a PR whose base is another PR's branch) counts, so a stack is merged down layer by layer as each goes green, never left open. Work that cannot pass checks alone (pages that link to each other) is one PR from the start. A review finding whose fix belongs in another PR is fixed there and merged forward within the hour; it does not hold both PRs open. Exceeding 3 needs the owner's approval, recorded in the PR. Why: 20 PRs were open on 2026-10-12, six UI PRs could only merge together ([#103](https://github.com/DeveloperAlly/solana-hack/pull/103)), and #99, #100 and #101 sat open waiting on fixes routed to #91.
