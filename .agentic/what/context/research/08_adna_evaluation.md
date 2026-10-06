---
type: research
status: active
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [research, adna, docs]
---
> **Status: active.** Research input (2026-10-06); its recommendation was ratified as [ADR-004](../../decisions/adr_004_docs_use_adna.md). The "Problem today" section describes the repo before the migration.

# aDNA for Waterlily project context: evaluation

*Evaluation 2026-10-06.*

## What aDNA is
- **The standard.** aDNA ("Agentic DNA") is an MIT-licensed standard for organising a project so agents and humans share one map. It is plain Markdown in git, with no server and no lock-in ([adna.network](https://adna.network), [github.com/aDNA-Network/aDNA](https://github.com/aDNA-Network/aDNA)).
  - Standard v2.5 was released 2026-10-04.
  - The canonical spec is `.adna/what/docs/adna_standard.md`.
- **Governance files:**
  - `CLAUDE.md`: agent boot, rules, version stamp
  - `MANIFEST.md`: stable identity and index; points to docs, never restates them
  - `STATE.md`: the only live status, covering phase, recent decisions, blockers and next steps; updated each session
  - `AGENTS.md`
  - `README.md`
- **Triad:**
  - `what/` (knowledge: `context/`, `decisions/` ADRs)
  - `how/` (missions, sessions, templates, backlog)
  - `who/` (governance, coordination)
  - Existing codebases use the embedded `.agentic/` form.
- **Frontmatter** on every file: `type, status, created, updated, last_edited_by, tags`.
- **ADRs:** only a named human can ratify them (v2.5).
- **Tooling:** validators (`adna_validate.py`, `compliance_checker.py`) and `llms.txt`. There is no CLI or MCP server, and automated staleness detection is deferred in the spec (gap G7).
- **Maturity:** young. 74 registered vaults, and the layout changed in June 2026.

## The founder's existing practice (conventions only)
The founder's personal-brand vault already runs a stricter dialect:
- status banners on every governance file
- `STATE.md` that **points to** where state lives rather than duplicating it
- `MANIFEST.md` as an index that never restates the plan
- GitHub issues as the authority
- an owner-only rule for promoting anything to verified
- a process spine: audit → research → define → decide → build → test → measure → iterate

## Fit for this repo
**Problem today:**
- `README.md` says only "Hello".
- The Story Studio PRD, its roadmap and the AI creator angles doc still describe superseded directions.
- Nothing marks which doc is current.

**Proposed structure** (embedded form, Starter conformance plus STATE/AGENTS/decisions):
```
README.md        judge and human entry: pitch, demo, run, links
CLAUDE.md        agent boot: read STATE.md first; public-repo firewall
AGENTS.md        binding rules (status, supersession, owner ratifies, no private refs)
MANIFEST.md      identity, architecture, index of every current doc
STATE.md         the only live status: phase, deadline, blockers, next 3
.agentic/what/context/      research/, SWOT, links, compendia
.agentic/what/decisions/    ADRs (purpose, business model, superhub, inbox ...), superseded ones kept with superseded_by
.agentic/how/missions/      PRD + hackathon cut as missions
.agentic/how/backlog/       roadmap
.agentic/how/templates/     ADR template, design prompts
.agentic/who/governance/    founder decision rights
```

**Staleness controls:**
1. One live file: `STATE.md`.
2. ADRs with `status` and `supersedes`/`superseded_by`. These two fields are a local addition, not part of the base spec.
3. Frontmatter plus a one-line status banner.
4. A small CI check that:
   - fails if a superseded doc has no `superseded_by`;
   - fails if a current doc names a retired concept;
   - fails if `STATE.md` is older than the newest docs change.

**Cost:**
- About 2–3h to set up, then one `STATE.md` edit per working session.
- Skip sessions, coordination and Full conformance for the hackathon.
- Claim "aDNA-structured" unless every Starter directory stub exists.

**Risks:**
- The repo is public, so write fresh public governance files. Never copy private vault rules or reference private vaults.
- Keep `README.md` judge-first so the dot-folder doesn't bury it.
- Pin the aDNA version, because the spec is still changing.

**Upside:**
- It fixes the drift that already exists.
- It matches the founder's own conventions.
- It gives aDNA, a demo brand, a public reference repo. That is a credibility bonus, not a scoring lever.

## Recommendation
**Yes:** embedded `.agentic/`, Starter plus `STATE.md`/`AGENTS.md`/decisions, with one CI staleness check and a public-repo firewall rule. Migrate existing docs into it, and mark superseded ones with pointers rather than deleting them.
