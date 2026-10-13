# Product-outcome evals

These evals check what the product does for a user, not whether the code compiles. Each journey drives real Chromium by clicking and typing, and opens only its first screen by URL. Every step records:

- what the user did;
- the expected outcome, citing the canvas note or ADR it comes from;
- the page text, verbatim;
- a raw screenshot;
- on live runs, every API call with its request and response bodies, with auth tokens, cookies and keys redacted.

## Run

```sh
cd web
EVAL_SITE=<https://site> EVAL_BRAND_NAME=<name> npm run evals -- --base <url> [--live <live app url>] [--only id,id] [--out dir]
```

- `--base` is the build whose `/screens` gallery is driven. It can be a deployed preview, or a local build served with `npm run build && npx vite preview`.
- `--live` also runs the live-product journey there. This uses real integrations and creates a brand in that app.
- `EVAL_SITE` and `EVAL_BRAND_NAME` are the site and brand name the journeys type wherever they ask for one. Both are required, and the harness stops if either is missing.
- `EVAL_MODE` decides what a missing screen means:
  - `pr-head`: the target is the build of the commit under review, so a missing screen is a regression and fails the journey.
  - Otherwise: the target is a deployed build that may be older, so a missing screen means NOT DEPLOYED.
- `EXPECT_BUILD=<commit>` makes the run wait until the target serves that build (`<meta name="jamjam-build">`). The run stops if the build never appears.

The output goes to `proof/evals/<timestamp>/`, which is gitignored:

- `report.html`: one self-contained file with the screenshots inlined;
- `report.md`;
- `results.json`.

## Public CI and private runs

This repository is public, and so are its workflow artifacts and comments. Public CI (`.github/workflows/outcome-evals*.yml`) therefore always types a neutral test site the project owns: `https://jamjam.tech`, brand name `JamJam`.

On those screens the gallery's fixtures are about the same brand. So checks of the form "the screen uses what I entered" report INCONCLUSIVE in CI instead of a PASS they have not earned.

To test with a real person's or customer's site, run the command above outside the public repo. Use a local machine or a private workspace, with that site in `EVAL_SITE`, and share the report privately. Never commit such a report, and never pass such a site to CI.

## CI

- **Every PR** runs `outcome-evals-pr.yml`, with no path filter, into any base, forks included. It builds the PR head with its commit stamped, serves it inside the runner and runs the journeys against it. PRs into main also run the live journey on jamjam.tech as a separate section.
- **After merge into ui/integration**, `web-preview.yml` tests the newly deployed preview once it serves the merge commit, plus the live journey.
- **The comment.** `outcome-evals-post.yml` posts one comment per PR and updates it in place.
  - It validates `results.json` strictly and renders the comment with this repository's code.
  - It takes the tested commit and time from the run's own metadata.
  - It refuses to overwrite a comment from a run that started later.
  - Fork PRs are posted by `outcome-evals-comment.yml`, using `workflow_run`.

Journey FAILs are findings and do not fail the workflow. A harness crash, missing configuration or a build mismatch does.
