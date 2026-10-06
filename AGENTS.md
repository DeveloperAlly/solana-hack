---
type: governance
status: active
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [governance, rules]
---
# AGENTS.md: binding rules

These rules bind every agent and human working in this repo.

1. **Frontmatter and banner.** Every doc under `.agentic/` has YAML frontmatter with `type, status, created, updated, last_edited_by, tags` (plus `supersedes` / `superseded_by` where relevant), and a one-line status banner as the first body line.
2. **Status values** are exactly: `draft` / `proposed` / `active` / `accepted` / `superseded` / `historical`.
3. **Superseded docs are kept, never deleted.** They carry `superseded_by` and a banner naming their replacement.
4. **Decisions are ADRs** in [`.agentic/what/decisions/`](./.agentic/what/decisions/), using [the ADR template](./.agentic/how/templates/template_adr.md). Only the owner (Ally Haire) ratifies; agents may propose (status `proposed`). See [decision rights](./.agentic/who/governance/decision_rights.md).
5. **Public-repo firewall.** Never reference private repositories, private vaults, local paths, personal data or secrets.
6. **Every factual claim cites a source** (a link, a research doc, an ADR, or the issue it came from).
7. **MANIFEST.md indexes and never restates.** It points to docs; it does not copy their content. Live status lives only in [STATE.md](./STATE.md).
