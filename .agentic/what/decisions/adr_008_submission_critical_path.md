---
type: adr
status: proposed
created: 2026-10-08
updated: 2026-10-08
last_edited_by: agent
tags: [adr, scope, hackathon, critical-path]
---
> **Status: proposed (awaiting the owner's ratification).** Until the Colosseum submission (Oct 12 2026, 11:59pm PT), the build follows one critical path: the spine, a thin Create, and Verify and Ledger, then the submission assets. Everything else waits, and the app should label it "coming soon" (deployment status lives in STATE.md).

# ADR-008: The submission critical path, and what is cut until after it

## Context
- Four days remained before the deadline, and the full phased plan in [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4) could not all ship and be proven live in that time.
- The submission needs a working product, a presentation video, a demo video of 3 minutes or less, a logo, a go-to-market strategy and demand validation ([Colosseum hackathon page](https://www.colosseum.com/hackathon)).
- The loop that makes the pitch ([ADR-007](./adr_007_pitch_positioning.md)) is build, run, prove. Pay depends on wallets and USDC payouts ([ADR-006](./adr_006_wallet_identity_split.md)), which are not needed to show the other three.

## Decision
1. **In order:**
   1. unblock chain registration (provider RPC);
   2. the spine: sign-in, intake, gates, kit v1 registered on Solana;
   3. a thin Create (draft, check, approve, register);
   4. public Verify and Ledger;
   5. the submission assets.
2. **Cut until after the submission:** ambassador payouts, X and LinkedIn OAuth publishing, quests, claims (licensing), the full settings, the remaining canvas batches, and the PRD and P0/P1 documentation rework. Where a cut feature has a screen, the screen should say "coming soon" or "roadmap" rather than be removed.
3. **Process:** review loops run on code PRs only; docs PRs are reviewed by the owner.

## Consequences
- The demo and README show build, run and prove, and say plainly which parts are coming soon.
- [ADR-003](./adr_003_superhub_business_model.md) is unchanged: the cut features remain in the product map and return after the submission.
- STATE.md's "Next" list follows this order.

## Ratification
Pending. This ADR records the plan the work has followed since 2026-10-08; it becomes accepted only when the owner ratifies it here.
