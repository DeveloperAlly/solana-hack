# Waterlily

**Waterlily: build your brand, run it, prove it.**

Waterlily builds a brand from scratch through a short guided interview. It then drafts content in that brand's voice, and a person approves everything. A proof layer on Solana records what is official, so anyone can check that a post really came from the brand. Purpose: [ADR-002](./.agentic/what/decisions/adr_002_purpose_build_run_prove.md). Product map: [ADR-003](./.agentic/what/decisions/adr_003_superhub_business_model.md). Hackathon scope: [ADR-008](./.agentic/what/decisions/adr_008_submission_critical_path.md) (proposed).

**Live (devnet):** https://jamjam.tech
**Built for:** Colosseum Crypto World's Fair (submissions close Oct 12, 11:59pm PT).

## What it does
All of the features below are on main. What is live and proven, and what is blocked, is tracked only in [STATE.md](./STATE.md).

1. **Sign in with an email code**. There is no password, no wallet and no seed phrase. A server Registrar signs every on-chain registration ([ADR-006](./.agentic/what/decisions/adr_006_wallet_identity_split.md)). The code only arrives once the Supabase email template includes it (an owner setting, tracked in STATE).
2. **Read before asking**. Paste your site and Waterlily extracts facts. A fact is kept only if its supporting quote appears word for word on the page, and each one keeps its source. The fact itself is the model's reading of that quote and is not checked further, so you confirm it in the interview. Facts found are shown beside the question step for the same topic (purpose, origin, audience and voice, and positioning beside the Alternatives questions). Facts tagged only for messaging are used in drafting and are not shown in the interview. Removing a link removes the facts read from it; sections that cited them must be redrafted before the next kit version.
3. **Short interview**, about 15 minutes: basics and origin; why, how and what; alternatives and audience; voice. Basics needs a brand name. Every question step after it can be skipped and finished later. The voice step has 12 templates and 8 dials, with claims treated as a gate rather than a slider ([research 06](./.agentic/what/context/research/06_voice_templates.md)).
4. **AI-drafted kit**. Purpose, positioning, audience, voice, origin and messaging are drafted from your answers and sources. The model is asked to cite the evidence it used and to label unsupported points as assumptions. That labelling is not validated, so the screen marks a whole section as an assumption only when it cites no evidence at all.
5. **Three decision gates**. Purpose, positioning and voice must each be approved by a person. Each approval records who approved it and when.
6. **Kit v1 on Solana**. The kit is hashed (canonical JSON, SHA-256) and written as a Solana Attestation Service (SAS) attestation signed by the Registrar. On chain: the brand id, the kit hash, the kit version, the approver id and a domain-verified flag. No kit text goes on chain. Whether this path is proven live is in STATE.
7. **Create in your voice**:
   - posts are drafted from a brief against the registered kit version;
   - every AI draft passes a no-AI-slop check before you see it, and a failing draft is hidden;
   - voice-fit and platform scores describe the text shown;
   - polish actions (Review, Shorten, Clarify, Beautify, and Beautify (accessible)) can each be undone.
8. **Approve, then register**. Nothing is registered without approval. Before a post can be approved, it is checked against your claims gate (claims need support in your recorded evidence, at the strictness you chose) and the content policy. You publish the post yourself, then its content hash is registered. A registration that may have reached Solana is never sent twice.
9. **Verify and Ledger, public**. Paste a post to check whether it is official. The match is checked against the attestation on Solana, not just our database, and changing a single word breaks it. The ledger lists the latest registered kits and posts with explorer links.
10. **Export**. The registered kit downloads as aDNA-style Markdown.

Coming soon: X and LinkedIn publishing, ambassador campaigns with USDC payouts, the inbox and analytics. The hub screens label these as coming soon.

## Architecture
| Part | What | Where |
|---|---|---|
| Web app | Vite + React SPA on design tokens ([ADR-005](./.agentic/what/decisions/adr_005_ui_component_system.md)) | `web/src` |
| API | Cloudflare Worker: `/api/*`, with static assets for everything else | `web/worker` |
| Data | Supabase Postgres, with RLS on and no policies, so only the Worker's server key can read or write | `spec/db` |
| Auth | Supabase email OTP. The Worker checks every token with Supabase Auth | `web/worker/auth.ts` |
| AI | OpenRouter (default `openrouter/auto`) behind one gateway with retries and logging | `web/worker/llm.ts` |
| Proof | SAS on Solana devnet: credential `WATERLILY`, schema `WL-KIT` v1, Registrar-signed | `web/worker/registry.ts`, `spike/` |
| Deploy | GitHub Actions to Cloudflare (custom domain jamjam.tech), followed by Playwright and registry checks | `.github/workflows` |

## Repo map
- [MANIFEST.md](./MANIFEST.md): what this project is, and an index of every doc
- [STATE.md](./STATE.md): current phase, decisions, blockers and next steps
- [UI build mission](./.agentic/how/missions/mission_ui_build.md): slices S0–S8 and their done-when checks
- [Brand Builder architecture](./.agentic/what/context/brand_builder_architecture.md) and [backend map](./.agentic/what/context/backend_map.md)
- [Issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4): the build plan, with deploy proofs posted by CI

## Run it locally
```sh
cd web
npm ci && npm ci --prefix worker
npm test               # unit, behaviour and axe tests (no services needed)
npm run lint:tokens    # no raw colours or px; contrast checked for every theme
npm run dev            # the SPA alone on Vite; API calls fail without the Worker
```

To run the app and API together you need a Supabase project with the schema applied: run the migrations in `spec/db/` in order (`001` to `007`). Then put the Worker settings in `web/.dev.vars`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `OPENROUTER_API_KEY`, `REGISTRAR_KEY`, `RPC_URL` (your own values; never commit them). The SPA reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time, so put those in `web/.env.local`. Then build and serve both from Wrangler:

```sh
npm run build && npx wrangler dev   # serves dist/ and /api/* on http://localhost:8787
```

Registering a kit or post also needs a provisioned Registrar: `REGISTRAR_KEY` is a 64-byte Solana keypair as a JSON array of numbers, funded with devnet SOL, that has already created the `WATERLILY` credential and `WL-KIT` schema (the devnet spike in [`spike/`](./spike/) does this). Kits and posts are both attested under `WL-KIT` in this build; the separate `WL-CONTENT` schema in the SAS design (`spec/api/lib/clients.ts`) is not used yet, so nothing else needs provisioning. With an unprovisioned key, every step up to registration works and registration fails.

This repo is structured with aDNA ([adna.network](https://adna.network)), an open standard for agentic project context.
