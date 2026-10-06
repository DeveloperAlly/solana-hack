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
