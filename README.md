# Waterlily

**Waterlily: build your brand, run it, prove it.**

Waterlily builds a brand from scratch through a short guided interview. It then drafts content in that brand's voice, and a person approves everything. A proof layer on Solana records what is official, so anyone can check that a post really came from the brand.

**Live (devnet):** https://jamjam.tech
**Built for:** Colosseum Crypto World's Fair (submissions close Oct 12, 11:59pm PT).

## What works today
1. **Sign in with an email code.** There is no password, no wallet and no seed phrase. A server Registrar signs every on-chain registration ([ADR-006](./.agentic/what/decisions/adr_006_wallet_identity_split.md)).
2. **Read before asking.** Paste your site and Waterlily extracts facts. It keeps only the facts it can quote word for word from the page, and each one keeps its source.
3. **Short interview** (about 15 minutes):
   - basics and origin;
   - why, how and what;
   - alternatives and audience;
   - voice: 12 templates and 8 dials, with claims treated as a gate rather than a slider ([research 06](./.agentic/what/context/research/06_voice_templates.md)).

   You can skip any step and resume later.
4. **AI-drafted kit.** Purpose, positioning, audience, voice, origin and messaging are drafted from your answers and sources. Each draft cites the evidence it used. Unsupported points are labelled as assumptions.
5. **Three decision gates.** Purpose, positioning and voice must each be approved by a person. Each approval records who approved it and when.
6. **Kit v1 on Solana.** The kit is hashed (canonical JSON, SHA-256). The hash, version and approver id are written as a Solana Attestation Service (SAS) attestation signed by the Registrar. Only hashes and ids go on chain.
7. **Create in your voice.**
   - Posts are drafted from a brief against the registered kit version.
   - Every AI draft passes a no-AI-slop check before you see it. A failing draft is hidden.
   - Each draft shows voice-fit and platform scores.
   - Polish actions: Review, Shorten, Clarify, Beautify, and Beautify (accessible). Every change can be undone.
8. **Approve, then register.** Nothing is registered without approval. You publish the post yourself (copy, then paste the link back), and its content hash is registered.
9. **Verify and Ledger (public).** Paste a post to check whether it is official. Changing a single word breaks the match. The ledger lists every registered kit and post with explorer links.
10. **Export.** The kit downloads as aDNA-style Markdown.

Coming soon (labelled in the app): X and LinkedIn publishing, ambassador campaigns with USDC payouts, the inbox and analytics.

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
npm run dev            # SPA only. /api needs `npx wrangler dev` plus secrets in .dev.vars
npm test               # unit, behaviour and axe tests
npm run lint:tokens    # no raw colours or px; contrast checked for every theme
```

This repo is structured with aDNA ([adna.network](https://adna.network)), an open standard for agentic project context.
