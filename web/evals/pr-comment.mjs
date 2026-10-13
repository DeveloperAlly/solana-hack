#!/usr/bin/env node
// Builds the one PR comment for a product-outcome eval run: the scorecard and a link to the full report.
// Usage: EVAL_SITE=... EVAL_BRAND_NAME=... node evals/pr-comment.mjs --results <dir>/results.json [--artifact-url <url>] [--run-url <url>] > comment.md
// The comment is public, so the configured test site and brand name are replaced by "the configured test site" and "the configured brand name", and
// it carries no screenshots (they can show the site); the screenshots stay in the report inside the workflow artifact.
import fs from 'node:fs';
import { redactIdentity } from './lib/config.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const resultsPath = arg('--results');
if (!resultsPath) throw new Error('--results is required');
const run = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const cell = (s, n = 160) => String(s ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').slice(0, n);

const firstFail = (j) => j.steps.find((s) => !s.pass && !s.skipped);
const L = ['<!-- outcome-evals -->', '## Product outcomes', ''];
L.push(`Tested ${run.base}, serving build \`${run.build}\`, at ${run.startedAt} (live: ${run.liveBase}).${run.note ? ' ' + run.note : ''}`, '');
L.push(`Real Chromium, user journeys driven by clicking and typing; "actual" text is verbatim from the page. Screenshots, every step and every API call are in the report in the workflow artifact.`, '');
L.push('| Journey | Result | First failing step | Expected | Actual |', '|---|---|---|---|---|');
for (const j of run.journeys) {
  const f = firstFail(j);
  const failed = f ? (f.checks.find((c) => !c.pass) || { label: 'action', actual: f.error }) : null;
  L.push(`| ${cell(j.title, 90)}${j.section === 'poc' ? ' (POC, sample data)' : ''} | **${j.status}** | ${f ? `${f.n}. ${cell(f.did, 120)}` : j.status === 'NOT DEPLOYED' ? cell(j.notes) : '-'} | ${f ? cell(f.expected) : ''} | ${failed ? `${cell(failed.label, 60)}: ${cell(failed.actual)}` : ''} |`);
}
const counts = run.journeys.reduce((a, j) => ((a[j.status] = (a[j.status] || 0) + 1), a), {});
L.push('', `Totals: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}.`);

const links = [];
if (arg('--artifact-url')) links.push(`[Full report with every step, screenshot and API call (report.html in the artifact)](${arg('--artifact-url')})`);
if (arg('--run-url')) links.push(`[Workflow run](${arg('--run-url')})`);
if (links.length) L.push('', links.join(' · '));
process.stdout.write(redactIdentity(L.join('\n')) + '\n');
