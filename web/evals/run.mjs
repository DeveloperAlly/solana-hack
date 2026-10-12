#!/usr/bin/env node
// Product-outcome evals: user journeys in real Chromium against a deployed preview, with machine-captured evidence.
// Usage (from web/): npm run evals -- --base <preview url> [--live <live app url>] [--out <dir>] [--only id,id]
//   --base   the deployed preview whose /screens gallery is driven (default: the integration preview)
// Required env: EVAL_SITE (the site typed wherever a journey asks for one, e.g. https://example.org) and
//   EVAL_BRAND_NAME (the brand name typed where asked). CI reads them from repository variables of the same names.
//   --live   also run the live-product journeys against this app (real integrations; creates a brand there). Off unless given.
// Writes <out>/report.html (screenshots inlined), report.md and results.json; default out is proof/evals/<timestamp>/.
// Exit code: 0 when the run completed (journey FAILs are findings, not crashes); 1 if the harness crashed or EVAL_STRICT=1 and any journey failed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Journey, ensureDir } from './lib/harness.mjs';
import { renderHtml, renderMarkdown } from './lib/report.mjs';
import { evalConfig } from './lib/config.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const base = (arg('--base', process.env.EVAL_BASE || 'https://jamjam-preview.ally-b3e.workers.dev')).replace(/\/$/, '');
const liveBase = (arg('--live', process.env.EVAL_LIVE || '')).replace(/\/$/, '');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(arg('--out', path.join(here, '..', 'proof', 'evals', stamp)));
const only = arg('--only', '') ? arg('--only').split(',') : null;
const noLive = !liveBase;

evalConfig(); // fail fast, before any browser starts, if the test site or brand name is not configured
const files = fs.readdirSync(path.join(here, 'journeys')).filter((f) => /^(live|poc)-.*\.mjs$/.test(f) && !f.includes('common')).sort((a, b) => (a.startsWith('live') ? -1 : b.startsWith('live') ? 1 : a.localeCompare(b, undefined, { numeric: true })));
const defs = [];
for (const f of files) {
  const m = await import(path.join(here, 'journeys', f));
  for (const d of [].concat(m.default)) if ((!only || only.includes(d.id)) && !(noLive && d.target === 'live')) defs.push(d);
}

ensureDir(path.join(outDir, 'shots'));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pwVersion = JSON.parse(fs.readFileSync(path.join(here, '..', 'node_modules', 'playwright-core', 'package.json'), 'utf8')).version;
const run = { startedAt: new Date().toISOString(), base, liveBase: liveBase || '(not run: pass --live)', site: evalConfig().site, playwright: pwVersion, journeys: [] };

// A screen that is not on the preview renders "No such screen".
async function missingScreens(names = []) {
  if (!names.length) return [];
  const ctx = await browser.newContext(); const p = await ctx.newPage(); const missing = [];
  for (const n of names) {
    await p.goto(`${base}/screens/${n}`, { waitUntil: 'networkidle' });
    if (await p.getByText('No such screen').count()) missing.push(n);
  }
  await ctx.close();
  return missing;
}

for (const def of defs) {
  const j = new Journey(def, { browser, outDir, base, liveBase });
  const missing = await missingScreens(def.requires);
  if (missing.length) {
    run.journeys.push({ ...j.toJSON(), status: 'NOT DEPLOYED', notes: `Not deployed yet on ${base}: ${missing.join(', ')}` });
    console.log(`NOT DEPLOYED ${def.id}: ${missing.join(', ')}`);
    continue;
  }
  await j.open();
  try { await def.run(j); } catch (e) { j.status = 'FAIL'; j.stopped = 'journey crashed: ' + e.message.split('\n')[0]; }
  await j.close();
  run.journeys.push(j.toJSON());
  console.log(`${j.status} ${def.id}`);
}
await browser.close();
run.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(run, null, 2));
fs.writeFileSync(path.join(outDir, 'report.md'), renderMarkdown(run));
fs.writeFileSync(path.join(outDir, 'report.html'), renderHtml(run, outDir));
console.log('Report:', path.join(outDir, 'report.html'), (fs.statSync(path.join(outDir, 'report.html')).size / 1e6).toFixed(2), 'MB');
if (process.env.EVAL_STRICT === '1' && run.journeys.some((x) => x.status === 'FAIL')) process.exitCode = 1;
