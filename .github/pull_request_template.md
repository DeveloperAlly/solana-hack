## What changed

<!-- One or two lines. Link the issue or ADR. -->

## Product outcomes (required)

Every PR carries a product-outcome report: user journeys driven in real Chromium against a deployed preview, with screenshots and expected versus actual for each step. The `outcome evals` workflow posts the scorecard on this PR; run it yourself with `cd web && npm run evals -- --base <preview url>` (add `--live https://jamjam.tech` to include the live-product journey).

**Journeys affected**

<!-- Which journeys this PR changes, e.g. "1 First run (J3, J5)", "3 Superhub (Draft-Review)". Write "none" only for changes no user can see. -->

**Scorecard**

<!-- Paste the scorecard table from the outcome-evals comment or report.md, before and after this PR. -->

| Journey | Before | After |
|---|---|---|
| | | |

**Screenshots of the changed screens**

<!-- Raw captures from the report (no mock-ups), with the URL each was loaded from. -->

## Checks

- [ ] `npm run lint:tokens`, `npm run typecheck`, `npm test`, `npm run build`
- [ ] `npm run check:gallery`
- [ ] Outcome-evals report linked above
