# spec/api: backend boilerplate (proposed 2026-10-06)

These files are **stubs with full comments, not runnable code**. They show, for every wireframe screen, which endpoint it calls and where each piece of data comes from: Supabase, our pipeline, OpenRouter, Exa, Solana, X or LinkedIn. Each external call is checked against primary docs, or marked TO VERIFY.

- Map, gaps and sources: [`.agentic/what/context/backend_map.md`](../../.agentic/what/context/backend_map.md)
- `schema.sql`: Supabase tables and RLS pattern. Extends architecture §3.
- `lib/clients.ts`: Supabase, the LLM gateway (OpenRouter plus bring-your-own key), the Exa search adapter, DNS, Solana Registrar and memo, X and LinkedIn publishing, and queue and workflow producers.
- `routes/brand_builder.ts`: auth, brand, domain, sources, ingest, coverage, interview, drafting, gates, kit, export, claims.
- `routes/create.ts`: voices, drafts, polish, approve, publish, campaigns.
- `routes/grow.ts`: ambassadors, submissions, verification, approve and pay, reply queue, leads, personas. Roadmap items as one-liners.
- `routes/public_settings_inbox.ts`: verify, ledger, settings (connections, AI, plan), inbox sketch.
- **Registry note (owner decision 2026-10-06):** registrations use the Solana Attestation Service via `registerAttestation()` in `lib/clients.ts`. Route stubs still say `registerMemo(...)`. Read that as "register through the Registrar", with memo only as the fallback if the P0 spike fails (G-SAS).
- `pipeline/worker.ts`: separate Worker for IngestWorkflow, DraftWorkflow, queue consumer and cron.

## Run-backed routes (live in `web/worker/`, issue #64, PR #91)
- `POST /api/brands/:id/sources {url}` starts the `extract_facts` workflow (whole-site read, quote and support checks). It answers `201 {sourceId, facts, dropped, kind, needsReview, conflicts, runId}` when the run finishes within the wait, or `202 {runId, sourceId, status, progress, resume_at, message}` while it goes on (the drafting route's contract): follow it with `GET /api/runs/:runId` until `done` or `failed`. It used to answer 409 "still reading" in that case. Over a cap it answers 429 with the reason.
- `POST /api/brands/:id/runs {kind, reader?, ...}` starts any registered run kind (`web/worker/engine/kinds.ts`) and answers `202 {run}`.
