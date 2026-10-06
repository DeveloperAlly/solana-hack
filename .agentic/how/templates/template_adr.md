---
type: template
status: active
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [template, adr]
---
> **Status: active.** Template: copy to `.agentic/what/decisions/adr_NNN_slug.md` and replace everything in angle brackets.

````markdown
---
type: adr
status: proposed            # proposed / accepted / superseded
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
last_edited_by: <agent | Ally Haire>
tags: [adr, <topic>]
supersedes: <adr_NNN or omit>
superseded_by: <adr_NNN or omit>
---
> **Status: proposed.** <one-line summary of the decision>

# ADR-<NNN>: <title>

## Context
<The problem and forces at play. Cite a source for every factual claim.>

## Decision
<What was decided, in one or two sentences, then any detail.>

## Consequences
<What changes, what becomes easier or harder, what is now out of scope.>

## Ratification
<Pending owner ratification.> or <Ratified by Ally Haire in <channel>, <YYYY-MM-DD>.>
````
