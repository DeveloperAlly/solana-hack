---
type: adr
status: accepted
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [adr, docs, adna]
---
> **Status: accepted.** Project docs use the aDNA v2.5 embedded form.

# ADR-004: Docs use aDNA

## Context
The repo's README said only "Hello", several docs described superseded directions, and nothing marked which doc was current ([research 08](../context/research/08_adna_evaluation.md)). aDNA is an MIT-licensed, plain-Markdown standard for shared agent and human project context; v2.5 was released 2026-10-04 ([adna.network](https://adna.network), [research 08](../context/research/08_adna_evaluation.md)).

## Decision
Use the aDNA **embedded form** (`.agentic/`) at **Starter** conformance, plus `STATE.md`, `AGENTS.md` and `decisions/` ADRs. Pin to aDNA v2.5. Superseded docs are kept with `superseded_by`, never deleted. A public-repo firewall rule applies.

## Consequences
- `STATE.md` is the only live status, updated each working session.
- Every `.agentic/` doc carries frontmatter and a status banner ([AGENTS.md](../../../AGENTS.md)).
- Sessions and coordination exist as stubs only for the hackathon.
- A CI staleness check is to be added separately ([research 08](../context/research/08_adna_evaluation.md)).

## Ratification
Ratified by Ally Haire in chat, 2026-10-06
