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

## First-run journey: screen to live route (implemented, 2026-10-13)

These routes run in `web/worker/` (not stubs). The journey UI ([issue #48](https://github.com/DeveloperAlly/solana-hack/issues/48), PR #75) replaces each `INTEGRATION:` marker with the call in this table. The whole path is proved by `web/scripts/journey-e2e.mjs` (the workflow `journey e2e`). Every route takes `Authorization: Bearer <Supabase access token>`. An anonymous session may create its one brand, read up to 8 sources (per-IP limited) and review facts; every step that calls the model or registers on Solana needs the saved account (403 otherwise).

| Screen | Action | Call | Notes |
|---|---|---|---|
| J0 Land | Start with a URL, no sign-up | `supabase.auth.signInAnonymously()`, then `POST /api/brands {name, website}`, then `POST /api/brands/:id/sources {url}` | Anonymous: 1 brand and 8 sources; per-IP limit (429). Needs anonymous sign-ins on (`supabase-auth-config` workflow). |
| J1 Read | Still reading | `POST .../sources` may answer 409 `{runId, status, progress}` once the workflow engine (#70) is merged | Not an error: poll `GET /api/runs/:runId` (or `GET /api/brands/:id`, which lists sources with status) until `done`, showing `progress`. 201 means it finished within the wait. |
| J1 Read | Facts with quotes, coverage | `GET /api/brands/:id` gives `evidence` (claim, quote, trust, review_status) and `coverage` {sections: [{section, title, status: found/partly/needs_you, facts, usable}], covered, total, ratio} | A fact is kept only when its quote is on the page (`quote.ts`). |
| J1 Read | Remove a source | `DELETE /api/brands/:id/sources/:sid` | Removes the facts read from it; the owner's edits of those facts stay. |
| J1 Read | Upload a file or paste text | No route yet | The document and paste adapters exist (`worker/sources/`) but are not wired to a route. Use a link for now. |
| J2 Save, new email | Link the email to the same user | `supabase.auth.updateUser({ email })`, then `supabase.auth.verifyOtp({ email, token, type: 'email_change' })` | No data moves; the brand stays the visitor's. |
| J2 Save, existing email | Sign in, then move the brand | `signInWithOtp` + `verifyOtp({ type: 'email' })`, then `POST /api/me/claim {anonymousToken}` | `anonymousToken` is the anonymous session's access token, held before signing in. Refresh the anonymous session first (`supabase.auth.refreshSession()`), since an access token lasts about an hour; an expired or invalid one gives 409. Gives `{moved: [brandId]}`. |
| J3 Confirm | Accept or Reject a fact | `PATCH /api/brands/:id/evidence/:eid {review_status: 'approved' or 'rejected'}` | Gives `{evidence, stale}`. |
| J3 Confirm | Edit a fact | `PATCH /api/brands/:id/evidence/:eid {claim}` | The source fact is rejected; the owner's wording becomes an approved owner statement with no quote, linked by `edited_from` (migration 012). Gives `{evidence, replaced, stale}`. |
| J4 Gaps | Answer a question | `PUT /api/brands/:id/answers/:step {data, skipped}` | Steps: basics, origin, golden_circle, alternatives, audience, voice. |
| J4 Voice | Three samples per round (saved account) | `POST /api/brands/:id/voice/samples {round: 1}`, then `{round: 2, near: <template>}` | Each sample: `{template, label, text, answer}`. Save the pick with `PUT .../answers/voice {data: sample.answer}`. |
| J5 Approve | Draft (saved account), edit, approve a section; gates | `POST .../sections/:s/draft`, `PUT .../sections/:s {body}`, `POST .../sections/:s/approve {note}` | Gates purpose, positioning and voice record who, when and why. |
| J5 Approve | Register kit v1 on Solana | `POST /api/brands/:id/kit/register` | Needs a saved account (403 for anonymous). Gives `{kit, explorer, attestationExplorer}`. |
| J5 Approve | Retry after a failed registration (Kit-RegisterFailed) | `POST /api/brands/:id/kit/register` again | There is no `/api/registrations/:id/retry`: the same call retries, and a registration left pending is treated as interrupted after `KIT_PENDING_TIMEOUT_MS` (5 minutes). Posts likewise: `POST .../posts/:pid/register` again. |
| J6 First post | Draft with no brief | `POST /api/brands/:id/posts {}` (or `{brief, channel}`) | Written from the registered kit. |
| J6 First post | Polish, undo, edit, approve, register | `POST .../posts/:pid/polish {action, rev}`, `.../undo {rev}`, `PUT .../posts/:pid {body, rev}`, `.../approve {rev}`, `.../register {rev, publishedUrl?}` | Register needs a saved account. |
| J7 Prove | Check the exact text | `POST /api/verify {text}` (no sign-in) | `official: true` only when the Solana attestation verifies. |
| J8 Return | Brand list and state | `GET /api/me`, `GET /api/brands/:id` | |
