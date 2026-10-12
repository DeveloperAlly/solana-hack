---
type: audit
status: active
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [audit, release, database, proof]
---
> **Status: active.** Embedded SQL acceptance evidence for [delivery #114](https://github.com/DeveloperAlly/solana-hack/issues/114); release status remains in [STATE.md](../STATE.md).

# SQL acceptance evidence

The [reproducible runner](./proof/sql-acceptance.mjs) applied the repository's exact migrations 001–014 to a fresh embedded PostgreSQL database. The [raw transcript](./proof/2026-10-13_sql-acceptance.txt) records each migration's SHA-256 and reports PostgreSQL 18.6 through PGlite 0.5.9. It verifies the SQL digest function used by prompt seeds without requiring a pgcrypto extension. This is local SQL evidence for the [canonical delivery plan](../.agentic/how/missions/mission_hackathon_submission.md), not production deployment evidence.

The runner executes these behavioral checks against SQL, rather than the JavaScript database fake:

- Corroboration from two independent sources raises confidence; rejecting or deleting one lowers it.
- An approved owner correction rejects its original; restoring the original removes the correction.
- A superseded run refuses metering with PT409 and consumes no further calls.
- Admission reserves the last anonymous source slot; a second reservation fails with PT429; releasing the first frees capacity.

Each result appears in the [transcript](./proof/2026-10-13_sql-acceptance.txt). The existing applied identity `010_evidence_edited_from.sql` remains intact; the runner applies the reconciled engine, extraction, intake and Create migrations as 011–014. [Migration directory](../spec/db/)

## Reproduce

Run from the repository root with Node 22 or newer and npm available. Install the pinned proof dependency outside the repository; this does not change product dependencies or require Docker.

```sh
PROOF_DEPS=$(mktemp -d)
npm install --prefix "$PROOF_DEPS" --no-save @electric-sql/pglite@0.5.9
PGLITE_MODULE="$PROOF_DEPS/node_modules/@electric-sql/pglite/dist/index.js" \
  node audits/proof/sql-acceptance.mjs
```

The runner resolves migrations relative to its own repository location and writes its evidence to stdout. A failed migration or assertion exits nonzero. The recorded migration hashes make changes after this run visible when comparing a new transcript. [Runner](./proof/sql-acceptance.mjs)

## Limits and remaining release gates

The test runs one embedded PostgreSQL process. Supabase's `auth.users` schema and the `anon`, `authenticated` and `service_role` roles are minimal stubs. The reservation checks exercise ordered attempts at the SQL transaction boundary; they do not demonstrate two independent concurrent database sessions. [Runner and transcript](./proof/2026-10-13_sql-acceptance.txt)

This evidence does not prove production migrations are applied, Supabase client RLS behavior, Cloudflare provisioning or permissions, real provider calls, emailed sign-in, or Solana transactions. Those remain separate deployed acceptance checks under [#114](https://github.com/DeveloperAlly/solana-hack/issues/114). No production database or cloud account is contacted by this runner. [Runner](./proof/sql-acceptance.mjs)
