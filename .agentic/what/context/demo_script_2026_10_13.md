---
type: script
status: draft
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [demo, script, colosseum, release]
---
> **Status: draft.** Recording runbook for a product demo of at most three minutes. Live readiness lives only in [STATE.md](../../../STATE.md). Delivery: [#114](https://github.com/DeveloperAlly/solana-hack/issues/114), master [#38](https://github.com/DeveloperAlly/solana-hack/issues/38). The separate [pitch script](https://github.com/DeveloperAlly/solana-hack/blob/791d01bf40d6cada78b1885ba314a2fd33fea3ad/.agentic/what/context/pitch_script_2026_10_12.md) and deck retain the owner's sales voice and require explicit authorization to edit.

# Demo script: JamJam, live core and full vision

**Story:** build JamJam's brand, create a launch post, approve it, register it on Solana, then check it publicly. End by showing the complete Build → Create → Distribute → Verify → Grow → Learn experience. Reuse the existing [wireframes](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn) and the screens delivered in [#111](https://github.com/DeveloperAlly/solana-hack/pull/111) and [#102](https://github.com/DeveloperAlly/solana-hack/pull/102), rather than building a separate demo application.

**Target runtime: 2:50**, leaving ten seconds below the [three-minute limit](https://colosseum.com/hackathon). AI, email and chain waits are edited out. A cut compresses waiting; it must preserve the actual result. This script is a recording plan, not evidence that a feature already works.

## Recording sequence

Use the deployed release revision that the orchestrator has rehearsed. Record real core actions and results. The integrated Journey can replace the existing Build screens if it completes the same real path; do not switch to sample registration to conceal a failed action. Confirm exact routes and button labels during rehearsal rather than copying stale labels into the video.

| Time | Screen and action | Voice-over |
|---|---|---|
| 0:00–0:08 | Landing at jamjam.tech; Read my site | This is JamJam: your brand team, in one app. I'll build our voice, create a post, and prove what we approved on Solana. Waits are cut. |
| 0:08–0:15 | Actual email sign-in; hide inbox and private account details | I sign in with email. No password, no wallet. |
| 0:15–0:35 | Build or integrated Journey: JamJam, jamjam.tech; read the site; show one fact with its quote and source | I give it our website. It reads what we say about ourselves and keeps the supporting quote beside each fact. Our own words are the starting point. |
| 0:35–0:50 | One interview question; chosen voice and strict claims setting | A few questions fill the gaps. I choose our voice and set the claims gate to strict. |
| 0:50–1:10 | Draft purpose; show evidence; approve purpose, positioning, voice and the supporting kit sections | JamJam drafts the kit. I review the source, edit what needs changing, and approve the decisions. The AI does the first draft; I keep the final say. |
| 1:10–1:25 | Register kit; actual success and devnet explorer transaction | Our approved kit gets a fingerprint on Solana. The words stay off chain. Here's the transaction. |
| 1:25–2:00 | Create LinkedIn launch post; add unsupported claim; show refusal; remove claim; approve; register post | Now a launch post in our voice. Watch what happens when I add “Used by ten thousand brands.” We have no evidence for that. JamJam blocks approval. I remove it, approve the post, and register the version we chose. |
| 2:00–2:25 | Public Verify: exact approved text succeeds; substantive word change fails; brief Ledger view | Anyone can check that text against our approved version on Solana. Change a word, and it no longer matches. The public ledger carries the record. This checks approved content; domain and account verification come next. |
| 2:25–2:45 | Six-stage shell; brief Distribute, Grow and Learn preview sequence | That's the core. The full experience is build, create, distribute, verify, grow and learn. These previews show publishing, creator campaigns and feedback improving the next draft—all around the same brand and approval flow. |
| 2:45–2:50 | End card: JamJam · jamjam.tech | JamJam: your brand team, in one app. Every post provably yours. |

## Shot notes

- **Build:** pre-answer routine questions before the take; show a real evidence review and approval. Keep the quote and source readable. If the shipped screen does not show a quote, say “It reads our site and saves facts with supporting quotes,” and show the source-review screen that exists; do not fabricate a quote panel.
- **Voice:** use the voice interaction that actually ships. The new preference rounds and the existing template selection are alternate UI routes through this beat; no extra demo-only interaction is needed.
- **Kit:** capture the real kit registration and its transaction. Explorer must use devnet. Keep IDs and approved versions consistent across subsequent shots.
- **Create:** rehearse the exact unsupported sentence under Strict before recording. Display the claim result, not a substitute edited warning. If refusal does not work, escalate the defect; the beat cannot claim a successful refusal.
- **Post:** retain exact approved text for Verify. If the UI asks for a publication link, publish/copy manually and use a real link or leave an optional field empty. Do not claim direct publishing from a copy action.
- **Verify:** change a substantive word, rather than whitespace that the normalizer may discard. Leave the self-declared identity limitation visible. Proof is Registrar-signed approved-content provenance ([ADR-006](../decisions/adr_006_wallet_identity_split.md)), not proof that the publisher owns the brand name.
- **Vision:** leave “Preview” or equivalent labels visible. Use the delivered screens with sample data for Distribute, Grow and Learn when those adapters are previews. Show outcomes and interaction, rather than a long screen gallery. Real USDC settlement requires transaction evidence; a preview payout is labelled a preview.
- **Timing:** prefer one clean sequence, readable text and short cursor movements. Trim pauses before trimming the six-stage vision. Measure the exported file, not just the script estimate.

## Rehearsal gate

The orchestrator records these results on [#114](https://github.com/DeveloperAlly/solana-hack/issues/114) and updates [STATE.md](../../../STATE.md). Historical migration and configuration notes are not current blockers; check the deployed revision.

1. Confirm deployed SHA, required checks and current migration state from deployment evidence.
2. Complete actual browser email authentication, source ingestion, voice, approvals and kit registration.
3. Draft, edit, demonstrate unsupported-claim refusal, approve and register a post.
4. Reload the real screens and confirm persisted state. Verify exact text and reject changed text; capture kit and post transaction links.
5. Open all six stages; check preview labels, brand isolation and navigation on the recording viewport.
6. Freeze the recording revision. Save a clean browser take before editing waits. Retain the unedited take and transaction evidence for the release handoff.

## Fallback without duplicating work

If the integrated Journey is unproven at the recording cutoff, use the existing real Build/Create/Verify path inside the delivered product shell. Keep the same story and full-vision preview. If a core action remains blocked, show its preview explicitly and describe it as a preview; report the blocker in release evidence. Do not substitute a local success flag for a chain transaction.

This revision changes the demo runbook only. It introduces no UI behaviour or new screen design, so it requires no canvas change under [AGENTS.md](../../../AGENTS.md).
