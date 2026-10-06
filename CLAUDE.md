<!-- aDNA v2.5 | 2026-10-06 -->
# CLAUDE.md: agent boot

This repo uses the aDNA v2.5 embedded form (`.agentic/`).

## Boot order
1. Read [STATE.md](./STATE.md): current phase, decisions, blockers, next steps.
2. Read [MANIFEST.md](./MANIFEST.md): identity and the index of every doc.
3. Read [AGENTS.md](./AGENTS.md): the binding rules.

## Rules
- **STATE.md is the only live status.** Never restate status anywhere else; link to STATE.md instead.
- **Update STATE.md at the end of every working session** (phase, recent decisions, blockers, next steps, `updated` date).
- Follow every rule in AGENTS.md. This is a public repo: the public-repo firewall applies to everything you write.
