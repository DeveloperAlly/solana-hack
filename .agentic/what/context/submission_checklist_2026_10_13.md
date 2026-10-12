---
type: plan
status: draft
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [submission, checklist, colosseum]
---
> **Status: draft.** Submission handoff checklist, not a claim of completion. Live progress remains in [STATE.md](../../../STATE.md). Owner: Ally Haire; coordination: [#114](https://github.com/DeveloperAlly/solana-hack/issues/114), master [#38](https://github.com/DeveloperAlly/solana-hack/issues/38).

# Submission package: reuse, record, submit

Target submission time is **4:00 pm Melbourne, 13 October 2026**, leaving a buffer before **5:59 pm**. Deadline source: [submission mission](../../how/missions/mission_hackathon_submission.md). The actual portal fields and [official requirements](https://colosseum.com/hackathon) govern the final form.

## Existing assets to reuse

| Portal item | Existing source | Remaining action / owner |
|---|---|---|
| Product name and description | [README](../../../README.md), existing [GTM](https://github.com/DeveloperAlly/solana-hack/blob/791d01bf40d6cada78b1885ba314a2fd33fea3ad/.agentic/what/context/gtm_2026_10_12.md) §1 | Codex: fill from existing copy within the portal's length limit; retain the sales voice |
| Chain and tools | README Architecture | Codex: confirm the shipped stack/devnet designation and fill the field |
| Team background | GTM §9; [#60](https://github.com/DeveloperAlly/solana-hack/issues/60) | Codex: populate the recorded biography and account fields; isolate any genuinely missing identity/location detail |
| Logo / graphic | [Exact deployed JamJam wordmark PNG](./submission-assets/jamjam-logo.png), 368 × 72 | Codex: supply this existing mark to the portal; use the approved deck mark if its original asset becomes accessible |
| Repository | [DeveloperAlly/solana-hack](https://github.com/DeveloperAlly/solana-hack) | Codex: identify release SHA and enter the public repository URL |
| Presentation video, 2–3 minutes | Existing deck and [pitch script](https://github.com/DeveloperAlly/solana-hack/blob/791d01bf40d6cada78b1885ba314a2fd33fea3ad/.agentic/what/context/pitch_script_2026_10_12.md) from [#69](https://github.com/DeveloperAlly/solana-hack/pull/69) | Codex: capture, export, upload and validate; Ally provides narration or an existing recording where needed; deck, mirror and script are locked against agent edits without explicit authorization |
| Demo video, at most 3 minutes | [Revised demo runbook](./demo_script_2026_10_13.md) | Codex: capture the rehearsed release, edit waits, export, upload and validate; narration uses the demo runbook |
| GTM, demand and distribution | Existing GTM §§3–8 | Codex: fill from existing GTM; commercial changes remain owner decisions |
| Prior development / eligibility | [Official requirements](https://colosseum.com/hackathon) | Codex: prepare disclosure from repo history; account holder confirms eligibility attestations where required |

No new pitch deck, GTM, branding package or demo application is requested. Pitch suggestions remain separate comments requiring owner authorization before edits. This checklist is document-only and does not alter the [wireframe specification](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).

## Concrete acceptance ledger

This is the artifact acceptance record for [#114](https://github.com/DeveloperAlly/solana-hack/issues/114); deployment and overall completion remain in [STATE.md](../../../STATE.md). An independently checked upload and portal receipt are the completion gate.

| Acceptance | Owner / dependency | Artifact and reproducible evidence | Next action |
|---|---|---|---|
| Use the existing approved pitch unchanged | Codex asset preparation; approved source | [Current read-only 24-slide artifact](https://claude.ai/artifact/4QPRrRAXx8VF4PsKf5qZ8d), title “JamJam: build, create, prove”; Playwright browser snapshot showed 24 slide options and cover mark. [Recording cue sheet](./submission-assets/recording_cues.md) references the existing 441-word script | Orchestrator independently opens Present mode and checks captured source; no pitch or appendix edits |
| Supply an actual logo graphic | Codex; existing deployed identity | [PNG](./submission-assets/jamjam-logo.png), captured from the `img` with accessible name `JamJam` at [jamjam.tech](https://jamjam.tech), 4× device scale; `sips -g pixelWidth -g pixelHeight` → 368 × 72; SHA-256 `9d12d84170266cdeddbee63efc3f3a3dd72bf76ffbe150d3f55120395a5082fa` | Orchestrator independently opens the PNG and supplies it to the portal; replace only with another existing approved asset if appropriate |
| Prepare timed recordings | Codex capture/edit preparation; Ally narration | [Cue sheet](./submission-assets/recording_cues.md), existing pitch script (2:45 target), revised demo runbook (2:50 target); installed Playwright and ffmpeg identified | Capture original deck and rehearsed release; record narration; export MP4 and inspect actual duration/playback |
| Complete form copy and business inputs | Codex portal preparation; confirmed owner/account fields | Ready-to-paste product/stack/links below; existing GTM §3–9 supplies business and team content | Inspect the authenticated portal, fill from recorded sources, isolate only genuinely missing account/identity fields |
| Prove real core before recording | Codex orchestrator; cloud configuration and integration | Journey commits and targeted tests are code evidence; actual deployed transaction evidence belongs on #114 | Complete browser core rehearsal, record release SHA and kit/post transactions |
| Upload and submit | Codex execution where connected access allows; account holder for inaccessible authenticated controls | Public video URLs and portal confirmation are not yet recorded here | Test links signed out, submit through the portal and retain confirmation URL/time |

## Ready-to-paste portal inputs

**Product:** JamJam.

**Description:** JamJam is your brand team, in one app. Build your voice and launch your brand, create content in that voice, approve what goes out, and give anyone a way to check the approved text on Solana. Build, create, distribute, verify, grow and learn—one workflow for founders who need a brand team. Source: existing [GTM §1](./gtm_2026_10_12.md#1-what-we-sell), with the [demo](./demo_script_2026_10_13.md) showing the real core and full-vision previews.

**Product URL:** https://jamjam.tech

**Repository:** https://github.com/DeveloperAlly/solana-hack

**Chain/tools:** Solana devnet; Solana Attestation Service; Cloudflare Workers; React/Vite; Supabase; OpenRouter; Exa. Sources: [README Architecture](../../../README.md#architecture), [backend map](./backend_map.md). Confirm the final deployed revision before entering runtime-specific details.

**Business/team content:** use the existing [GTM](https://github.com/DeveloperAlly/solana-hack/blob/791d01bf40d6cada78b1885ba314a2fd33fea3ad/.agentic/what/context/gtm_2026_10_12.md) sections 3–9. The pitch deck, mirror, script and appendix are locked; this package does not edit them.

## Repository artifact check

The tracked-file inventory of [PR #69's asset revision `791d01b`](https://github.com/DeveloperAlly/solana-hack/tree/791d01b) contains no MP4, MOV or WebM recording and no standalone logo SVG, PNG, JPEG, PDF or PPTX. Its image files are product proof screenshots under `web/proof/`. This package now adds an exact deployed wordmark capture, linked above. The script's Claude deck URL is a presentation reference, not an uploaded presentation-video URL. No final public video links are recorded in this package. This check covers repository files; owner-held files and the portal need separate confirmation.

## Remaining acceptance evidence

The following are **not verified by this document**: a final portal logo upload; recorded/exported videos; public video URLs; confirmed team location and portal membership; completed portal fields; an accepted submission receipt. Existing drafts are inputs, not proof that these actions happened.

- [ ] Join/sign in to the correct competition and open its product-submission form.
- [ ] Capture the form's exact remaining fields and any length/upload restrictions.
- [ ] Finish the pitch recording using the existing authorized deck and script.
- [ ] Finish the demo against the frozen release; exported duration is at most 3:00.
- [ ] Upload both videos; test playback in a signed-out browser without an access request.
- [ ] Upload the chosen logo; confirm product, stack, team, location, repo and business fields.
- [ ] Review the final form and submit. Save the receipt or confirmation URL/time.
- [ ] Orchestrator links the receipt, deployed SHA, video URLs and transaction proofs to #114 and updates STATE; index this checklist in MANIFEST.

## Handoff record

Fill these only when evidence exists; do not replace blanks with assumptions.

| Evidence | Value |
|---|---|
| Release SHA / deploy run | Pending release handoff |
| Kit / post devnet transactions | Pending real-core rehearsal |
| Pitch URL / exported duration | Pending recording export and upload evidence |
| Demo URL / exported duration | Pending recording export and upload evidence |
| Logo selected / portal upload | Exact deployed wordmark PNG prepared; portal upload unverified |
| Portal submission confirmation / time | Pending authenticated submission evidence |

If upload or portal access blocks submission, escalate the exact error immediately. A code freeze does not prevent asset preparation, and an asset problem does not justify reopening the feature backlog.
