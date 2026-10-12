---
type: audit
status: active
created: 2026-10-13
updated: 2026-10-13
last_edited_by: codex
tags: [audit, architecture, engineering, release, hackathon]
---
> **Status: active, dated evidence snapshot.** Engineering audit of main `e2387db` and the open PR heads observed on 2026-10-13. Current delivery status belongs in [STATE.md](../STATE.md). Tracking: [#92](https://github.com/DeveloperAlly/solana-hack/issues/92); master plan: [#38](https://github.com/DeveloperAlly/solana-hack/issues/38).

# Engineering architecture and release readiness

## Owner direction and editorial boundaries

The owner requests the complete UI vision, a preferably real critical path usable personally, and a completed submission. A scripted preview using sample data is acceptable for unfinished features. The audit publication was authorized in [the tracking comment](https://github.com/DeveloperAlly/solana-hack/issues/92#issuecomment-6130263630).

**The pitch deck is a sales pitch, not an engineering specification. Keep its sales voice and full ambition. Do not change the pitch deck without explicit owner authorization.** Suggestions may be offered separately as comments. The demo may be changed to reflect the working flow and show the full UI vision. These are the owner's explicit instructions in the publication session on 2026-10-13; this section records them for subsequent agents.

Engineering acceptance applies to code, API behavior, deployment, README implementation status and runtime proof. Persuasive positioning and future product outcomes in the sales deck are not automatically defects because the backend is incomplete. A recorded demonstration should identify actual operations and preview interactions accurately without rewriting the pitch into a technical status report.

## Method and limits

Reviewed repository governance, README, MANIFEST, STATE, accepted Brand Builder architecture, backend map, backlog, submission mission, proposed ADR-012/013, existing CPO audit, pitch/demo scripts and GTM, all 12 open PRs' metadata/checks/review findings, core API/auth/ingest/claims/posts/registration code and relevant pending modules. Browser inspected deployed landing, gallery and J5. Ran main's dependencies, tests, typecheck, token lint, build and dependency audit. No product code, cloud state, registrations, merges or submissions were changed by this audit.

This is not a claim that every source line or every fixture screen was exercised. Authenticated browser completion, production database inspection, cloud billing/permissions, private slide artifacts and submission portal state were not verified. Remote observations: `/api/health` reported AI/RPC configured and a usable Registrar; `/api/ledger` returned empty kits/content. The browser gallery showed 99 registered sample screens and zero loop screens. Observations were made around 05:20 AEDT on 2026-10-13.

Sources: [main snapshot](https://github.com/DeveloperAlly/solana-hack/tree/e2387db2a421ac3e6050ae03ef744f977bca94e8), [live site](https://jamjam.tech), [health](https://jamjam.tech/api/health), [gallery](https://jamjam.tech/screens), [live journey failure](https://github.com/DeveloperAlly/solana-hack/actions/runs/38283878925), [successful deploy](https://github.com/DeveloperAlly/solana-hack/actions/runs/38283804302).

## Verdict

The foundation can support a real core product, but completion is blocked by integration and missing live end-to-end proof. Ship a real Build -> Create -> Approve -> Register -> Verify path, surrounded by the complete six-stage UI with explicit previews. Finish recording/submission independently of the new backend stack.

## Observed readiness

| Surface | Evidence | Conclusion |
|---|---|---|
| Hosting | Successful main deployment; live browser landing | Working |
| Configuration | Health reports AI/RPC configured and Registrar | Configuration verified, not every operation |
| Migrations | Successful deploy reports database up to date | Old 009-blocker notes are stale |
| Solana | Deployment registry self-test registers and reads back | Real devnet integration |
| Ingestion | Live journey kept six quoted facts | One read proven |
| Ownership | Live journey transferred anonymous brand; old session refused | API allowed/refusal cases proven |
| Voice | Live journey J4 returns 502 | Blocking new Journey |
| Kit/post/Verify | Live journey stops before those steps; empty ledger | Complete product path unproven |
| UI vision | 99 sample gallery screens | Broad preview exists |
| Today/Brain/loop | Zero deployed loop screens; PRs #111/#102 | Pending |
| Journey UI | Local actions simulate sign-in/registration | API integration missing |
| Distribute/Grow/Learn | Fixture actions and planned integrations | Preview |

Evidence: links in Method; [Journey actions](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/src/screens/journey/useJourneyFlow.ts), [J5](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/src/screens/journey/J5-Approve-Kit.tsx), [routes](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/src/config/routes.ts).

## Priority fix queue

Estimates are planning ranges, not measured commitments. Owners below are proposed work roles.

| ID | Priority | Root issue and fix | Exit proof | Owner / estimate |
|---|---|---|---|---|
| R01 | P0 | No complete live product proof. Rehearse actual sign-in through public Verify. | Kit/post transactions; exact text accepted, changed text refused | Core / 1-2h |
| R02 | P0 | Journey screens update local state. Implement API adapter, persisted brand ID and reload recovery. | Browser journey; registration success follows server response | Integration / 3-5h |
| R03 | P0 | #113 is red: flow mock returns old template IDs. Answer actual offered templates. | Both voice rounds and flow tests pass | Core / 30-60m |
| R04 | P0 | #113 unknown explicit ID falls through to positional mapping. Restrict fallback. | Wrong explicit ID never gains another voice's label/dials | Core / 20-40m |
| R05 | P0 | #111/#102 conflict and share dependent boards. Deliver one reconciled UI release. | All stage links and gallery gates pass together | UI / 1-2h |
| R06 | P0 | Loop singleton mixes brand decisions. Use existing brand-scoped store. | A -> B -> A isolation test | UI / 30-60m |
| R07 | P0 | Deploy triggers independently from CI; classic main protection absent. Gate exact revision. | Deploy SHA equals successful checked SHA | Release / 30-60m |
| R08 | P0 | Scripts exist but uploaded videos/portal receipt unverified. Finish package now. | Videos playable signed out; submission receipt | Submission / 2-3h |
| R09 | P1 | Claims API absent from live Create display. Render revision-bound map. | Edited claim invalidates map; unsupported claim blocks | Core / 45-90m |
| R10 | P1 | Stored quotes missing in old intake evidence view. Render quotes/source and proposed-fact review. | Quote visible; accept/reject persists | Integration / 30-60m |
| R11 | P1 | Drafter omits evidence list; quality scores self-generated. Ground inputs; represent scores accurately. | Supported drafting fixtures; no independent-score claim in runtime | Core / 45-90m |
| R12 | P1 | Live useBrand loads first brand. Carry selected brand and reject stale responses. | Multi-brand browser switch/reload | Integration / 1-2h |
| R13 | P1 | Today approval fingerprint excludes checks. Bind checks/text/Brain. | Newly blocking check invalidates approval | UI / 30-60m |
| R14 | P1 | Adapt approves edited original without checks. Share original gate across approval/schedule. | Empty/blocked original cannot schedule | UI / 30-60m |
| R15 | P1 | STATE and old audit describe superseded deployment. Refresh against proof. | Status links observed deploy/flow evidence | Orchestrator / 30-45m |

Sources: [#113](https://github.com/DeveloperAlly/solana-hack/pull/113), [#111](https://github.com/DeveloperAlly/solana-hack/pull/111), [#102](https://github.com/DeveloperAlly/solana-hack/pull/102), [Create](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/src/screens/create/Create.tsx), [Build](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/src/screens/build/Build.tsx), [posts](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/worker/posts.ts), [useBrand](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/src/lib/useBrand.ts), [deploy](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/.github/workflows/web-deploy.yml).

## Architecture

Keep React/Vite, the Cloudflare API Worker, Supabase and Registrar-signed SAS attestations. Existing useful primitives include registered kit snapshots, post revision compare-and-swap, approval invalidation, registration recovery, evidence allow-lists and redacted logs ([posts](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/worker/posts.ts), [api](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/worker/api.ts)).

Required boundaries:
1. One product nav: #111's nav explicitly leaves old live hub nav intact. Integrate both through one registry.
2. Explicit UI/domain/persistence mappings; fixtures cannot become a competing approval implementation.
3. Live and preview adapters behind the same screen contracts.
4. Server-authoritative approvals/registrations/payments and versioned approval inputs.
5. One retry/budget policy, rather than nested retries that escape metering.
6. Versioned verification normalizers. Current NFC/whitespace hashing differs from proposed richer norm_v1; preserve registered historical behavior.

[ADR-012](https://github.com/DeveloperAlly/solana-hack/pull/86) and [ADR-013](https://github.com/DeveloperAlly/solana-hack/pull/88) describe a useful destination. Persisted Learn proposals/signals/provenance, distribution adapters and wallet-confirmed payouts remain implementation work. Verification currently proves approved text recorded by JamJam for a self-declared brand, not domain ownership or publishing-account authenticity ([existing CPO audit](./2026-10-13_cpo-audit-deck-plan-build.md)). This is an engineering/API boundary, not an instruction to rewrite the sales deck.

## Backend stack release blockers

Main already has `010_evidence_edited_from.sql`; #70 has `010_workflow_engine.sql`; #91 adds 011 extraction and 012 intake; #99 adds 013 Create. Preserve applied migration identities and renumber unapplied work with references/seeds/tests reconciled. The [migration runner](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/scripts/migrate.mjs) refuses duplicate or mismatched identities.

| Finding | Fix before stack deployment | Source |
|---|---|---|
| Provider retry loop bypasses per-step meter | Meter each HTTP call or centralize retries | [#91](https://github.com/DeveloperAlly/solana-hack/pull/91) |
| Exa empty/shell fallback loses cost | Accumulate spend before every exit | [#91](https://github.com/DeveloperAlly/solana-hack/pull/91) |
| Superseded run can spend another call | Validate live status atomically before consumption | [#91](https://github.com/DeveloperAlly/solana-hack/pull/91) |
| Evidence confidence stale after removal/rejection | Recompute derived confidence on all mutations | [#91](https://github.com/DeveloperAlly/solana-hack/pull/91) |
| Distinct facts sharing quote span collapse | Deduplicate by fact identity | [#91](https://github.com/DeveloperAlly/solana-hack/pull/91) |
| Chunk omissions absent from final output | Propagate partial-processing counts/status | [#91](https://github.com/DeveloperAlly/solana-hack/pull/91) |
| Conflict keep path excludes owner answers SQL may reject | Reconcile invariant and retain/report appropriate owner rows | [#101](https://github.com/DeveloperAlly/solana-hack/pull/101) |
| Build does not follow async source runs | Shared polling/reload recovery | [#99](https://github.com/DeveloperAlly/solana-hack/pull/99) |
| New Workflows/AI/Browser bindings not proven live | Verify account permissions/limits and deployed path | [#91](https://github.com/DeveloperAlly/solana-hack/pull/91) |
| Loaded viewer rating ignored | Recover current rating before enabling creation | [#102](https://github.com/DeveloperAlly/solana-hack/pull/102) |
| Paid quest row displays missing-quest error | Preserve resolved quest/non-slot checks for completed rows | [#102](https://github.com/DeveloperAlly/solana-hack/pull/102) |

Fresh review findings were compared with branch code; a reply saying fixed is not itself proof. Green checks on stacked branches do not prove compatibility with main or live infrastructure.

## PR disposition at audit time

| PR | Observed state | Recommendation |
|---|---|---|
| #113 | Mergeable; latest CI failed | Fix first, prove voice |
| #111 / #102 | Conflicting; no current-head checks listed | One reconciled UI release |
| #69 | Conflicting | Reconcile assets; pitch deck edits prohibited without owner authorization |
| #86 / #88 | Mergeable; proposed ADRs | Owner ratification; implementation separate |
| #94 | Mergeable | Add this audit and preserve older snapshot as history |
| #71 | Conflicting | Reconcile adapters into backend stack |
| #70 | Conflicting; older green check | Defer unless reconciled and proven |
| #91 | Green against #70 | Fix stack blockers first |
| #101 | Green but conflicting against #91 | Reconcile dependencies and owner-answer invariant |
| #99 | Green against #91 | Deploy only with proven complete stack |

These are dated observations, not live tracking. [Open PRs](https://github.com/DeveloperAlly/solana-hack/pulls). Main's governance at audit time limits open PRs to three. [#38](https://github.com/DeveloperAlly/solana-hack/issues/38) puts workflow-engine work after submission.

## Proposed release and submission plan

| Gate | Deliverable | Exit proof |
|---|---|---|
| A | Stable current core; voice fix; submission inventory | Focused tests; real kit/post/Verify rehearsal |
| B | Complete six-stage UI with scoped state and shared gates | Gallery links, accessibility, mobile and isolation checks |
| C | Live Journey adapter and common shell | Reload-safe browser flow, server-backed success |
| D | Exact checked revision deployed | CI/deploy revision match; real allowed/refusal flow |
| E | Demo recorded, pitch retained, assets uploaded, submission completed | Public playable videos and portal receipt |

Suggested schedule: fixes/UI/core proof through 09:00 AEDT; integration through 11:30; release decision at 11:30; deploy/rehearsal by 12:30; record by 14:30; submit by 16:00; retain buffer to 17:59. These are proposed deadlines, not measured completion times. If new Journey integration is unproven at cutoff, keep the real existing intake within the six-stage shell while broader features remain previews. The full UI requirement stays; backend integration scope follows owner priorities.

The official deadline is 17:59 AEDT on 2026-10-13 (October 12 23:59 Pacific; [rules](https://colosseum.com/legal/Crypto%20World's%20Fair%20Hackathon%20Rules.pdf)). Required package: description, chain/tools, team/location, logo, repo, 2-3 minute presentation, <=3 minute demo, GTM/demand/distribution ([FAQ](https://colosseum.com/hackathon)). Use existing #69 assets; revise the demo to include real core proof plus a short full-vision preview. Verify links signed out and save receipt. Portal state and uploaded video availability were not observed.

## Local validation snapshot

At main `e2387db`: `npm ci` and Worker dependency install succeeded; `npm run typecheck`, `npm run lint:tokens`, `npm test`, `npm run build` passed. Tests: 100 files, 1,421 passed, 15 TODO. Token lint: 798 files, no raw colours/px/screen stylesheets. Build: JS 858.24 KB, gzip 261.11 KB; gallery eagerly imports screens. Recommendation: split gallery/stage bundles after deadline. Dependency audit: three high findings in dev-tool chain wrangler -> miniflare -> sharp (GHSA-wq5f-xc86-pv6w); Worker audit zero findings. These are recorded local command observations, not a claim of deployed E2E success.

Current journey script substitutes admin-created password sign-in for emailed sign-in and exercises API calls, not the actual Journey browser ([script](https://github.com/DeveloperAlly/solana-hack/blob/e2387db/web/scripts/journey-e2e.mjs)). Add browser proof separately. Release tests must run on the combined final revision, not only each contributor branch.
