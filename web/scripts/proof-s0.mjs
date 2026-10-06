// S0 proof: changing one token value changes the page.
// Builds, serves with vite preview, screenshots /, edits one semantic token in the wireframe theme,
// rebuilds, reloads, asserts the "Build my brand" button background changed, reverts, screenshots /system, runs axe on / and /system.
// Browser: set CHROMIUM_PATH to a Chromium binary, or leave it unset and Playwright uses the browser it manages
// (install it once with `npx playwright install chromium`).
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const proofDir = join(web, 'proof');
const themePath = join(web, 'src', 'tokens', 'themes', 'wireframe.json');
const executablePath = process.env.CHROMIUM_PATH || undefined;
const port = Number(process.env.PROOF_PORT || 4173);
const base = `http://127.0.0.1:${port}`;
const TOKEN = 'action.primary.bg';
const NEW_VALUE = '#006633'; // white text on it is about 7:1, so the contrast gate passes
const ts = new Date().toISOString().replace(/[:.]/g, '-');

mkdirSync(proofDir, { recursive: true });
const lines = [];
const log = (...a) => {
  const s = a.join(' ');
  lines.push(`${new Date().toISOString()} ${s}`);
  console.log(s);
};
const shot = (name) => join(proofDir, `${ts}-${name}.png`);
const rel = (p) => p.slice(web.length + 1);

function build(label) {
  const r = spawnSync('npm', ['run', 'build'], { cwd: web, encoding: 'utf8' });
  log(`build (${label}): exit ${r.status}`);
  if (r.status !== 0) throw new Error(`build failed: ${r.stderr || r.stdout}`);
}

async function waitFor(url, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server not ready: ${url}`);
}

async function buttonBg(page) {
  const link = page.getByRole('link', { name: 'Build my brand' });
  await link.waitFor();
  return link.evaluate((el) => getComputedStyle(el).backgroundColor);
}

async function axeCount(page, label) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document);
    return { violations: res.violations.map((v) => `${v.id} (${v.nodes.length})`), passes: res.passes.length };
  });
  log(`axe in chromium (${label}, colour contrast on): ${r.violations.length} violations, ${r.passes} rules passed ${r.violations.join(', ')}`);
  return r.violations.length;
}

const original = readFileSync(themePath, 'utf8');
let server;
let browser;
let ok = false;
try {
  log(`proof-s0 start; token ${TOKEN} -> ${NEW_VALUE}; chromium from CHROMIUM_PATH or the default path`);
  build('original');
  server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: web, stdio: 'ignore' });
  await waitFor(base + '/');
  log(`vite preview ready at ${base}`);

  browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(base + '/');
  const before = await buttonBg(page);
  await page.screenshot({ path: shot('landing-before'), fullPage: true });
  log(`before: computed background-color of "Build my brand" = ${before}; screenshot ${rel(shot('landing-before'))}`);
  const axeLanding = await axeCount(page, '/');

  const theme = JSON.parse(original);
  log(`edit themes/wireframe.json: ${TOKEN} "${theme.tokens[TOKEN]}" -> "${NEW_VALUE}"`);
  theme.tokens[TOKEN] = NEW_VALUE;
  writeFileSync(themePath, JSON.stringify(theme, null, 2) + '\n');
  build('edited');

  await page.reload();
  const after = await buttonBg(page);
  await page.screenshot({ path: shot('landing-after'), fullPage: true });
  log(`after: computed background-color of "Build my brand" = ${after}; screenshot ${rel(shot('landing-after'))}`);

  const expected = 'rgb(0, 102, 51)';
  if (before === after) throw new Error(`ASSERT FAILED: background did not change (${before})`);
  if (after !== expected) throw new Error(`ASSERT FAILED: expected ${expected}, got ${after}`);
  log(`ASSERT PASS: background changed ${before} -> ${after}`);

  writeFileSync(themePath, original);
  log('reverted themes/wireframe.json');
  build('reverted');
  await page.reload();
  const reverted = await buttonBg(page);
  if (reverted !== before) throw new Error(`ASSERT FAILED: revert did not restore ${before}, got ${reverted}`);
  log(`ASSERT PASS: reverted background = ${reverted}`);

  await page.goto(base + '/system');
  await page.getByRole('heading', { name: 'Workbench' }).waitFor();
  await page.screenshot({ path: shot('system'), fullPage: true });
  log(`/system screenshot ${rel(shot('system'))}`);
  const axeSystem = await axeCount(page, '/system');

  if (axeLanding !== 0) throw new Error(`ASSERT FAILED: axe found ${axeLanding} violations on /`);
  if (axeSystem !== 0) throw new Error(`ASSERT FAILED: axe found ${axeSystem} violations on /system`);
  ok = true;
  log('proof-s0 PASS');
} catch (e) {
  log(`proof-s0 FAILED: ${e.message}`);
} finally {
  if (readFileSync(themePath, 'utf8') !== original) {
    writeFileSync(themePath, original);
    log('reverted themes/wireframe.json (finally)');
  }
  if (browser) await browser.close();
  if (server) server.kill();
  writeFileSync(join(proofDir, `${ts}-proof-output.txt`), lines.join('\n') + '\n');
  process.exit(ok ? 0 : 1);
}
