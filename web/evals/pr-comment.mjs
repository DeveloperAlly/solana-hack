#!/usr/bin/env node
// Renders the one PR comment for an eval run. Runs in the trusted posting job with this repository's own code: the
// results file may come from fork code, so it is strictly validated (lib/validate.mjs) and only escaped, bounded
// fields are shown; the only links are the ones built here from trusted arguments. The tested commit and time come
// from the caller (the workflow run's own metadata), never from the file.
// Usage: node evals/pr-comment.mjs --results results.json --kind pr|deployed --sha <commit> --tested-at <ISO time>
//          --run-url <https://github.com/.../actions/runs/N> [--live-url <url>] > comment.md
// The second line is a machine-readable stamp the poster uses to refuse stale overwrites.
import fs from 'node:fs';
import { validateResults } from './lib/validate.mjs';

const args = process.argv.slice(2);
const arg = (k, d = '') => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const fail = (m) => { console.error(`pr-comment: ${m}`); process.exit(1); };

const kind = arg('--kind', 'pr');
if (!['pr', 'deployed'].includes(kind)) fail('--kind must be pr or deployed');
const sha = arg('--sha');
if (!/^[0-9a-f]{40}$/.test(sha)) fail('--sha must be a full commit sha');
const testedAt = arg('--tested-at');
if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/.test(testedAt)) fail('--tested-at must be an ISO UTC time');
const runUrl = arg('--run-url');
if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/\d+$/.test(runUrl)) fail('--run-url must be a GitHub Actions run URL');
const liveUrl = arg('--live-url');
if (liveUrl && !/^https:\/\/[a-z0-9.-]+$/.test(liveUrl)) fail('--live-url must be a bare https origin');

let journeys;
try { journeys = validateResults(JSON.parse(fs.readFileSync(arg('--results'), 'utf8'))); } catch (e) { fail(e.message); }

const short = sha.slice(0, 7);
const L = ['<!-- outcome-evals -->', `<!-- outcome-evals-meta build=${sha} tested_at=${testedAt} -->`, '## Product outcomes', ''];
L.push(kind === 'pr'
  ? `Tested this PR's build \`${short}\` (${sha}), built from the PR head and served inside the CI runner. Run started ${testedAt}.`
  : `Tested the deployed preview, serving build \`${short}\` (${sha}), after merge. Run started ${testedAt}.`);
if (journeys.some((j) => j.section === 'live') && liveUrl) L.push(`The live product journey ran separately against ${liveUrl} (real integrations).`);
L.push('', 'User journeys in real Chromium, driven by clicking and typing, with the public test site. Each step\'s screenshot, verbatim page text and API calls are in the report in the workflow artifact.', '');
L.push('| Section | Journey | Result | First failing step | Expected | Actual |', '|---|---|---|---|---|---|');
for (const j of journeys) {
  const section = j.section === 'live' ? 'Live product' : kind === 'pr' ? "This PR's build (POC, sample data)" : 'Deployed preview (POC, sample data)';
  const f = j.firstFail;
  const first = f ? `${f.n}. ${f.did}` : j.status === 'NOT DEPLOYED' ? `missing: ${j.missing.join(', ')}` : '-';
  L.push(`| ${section} | \`${j.id}\` | **${j.status}** | ${first} | ${f ? f.expected : ''} | ${f ? `${f.label}: ${f.actual}` : ''} |`);
}
const counts = journeys.reduce((a, j) => ((a[j.status] = (a[j.status] || 0) + 1), a), {});
L.push('', `Totals: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}.`, '', `[Workflow run and report artifact](${runUrl})`);
process.stdout.write(L.join('\n') + '\n');
