// S0 done-when (1): the deployed app loads, checked from a GitHub Actions Playwright run.
// Usage: BASE_URL=https://jamjam.tech node scripts/check-deployed.mjs  (optional CHROMIUM_PATH)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const base = (process.env.BASE_URL || '').replace(/\/$/, '');
if (!base) throw new Error('BASE_URL is required');
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'proof');
mkdirSync(out, { recursive: true });
const lines = [];
const log = (s) => (lines.push(`${new Date().toISOString()} ${s}`), console.log(s));

// A fresh custom domain can take a few minutes for DNS and the certificate; retry the first load.
async function gotoWithRetry(page, url, tries = 20) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await page.goto(url, { waitUntil: 'load', timeout: 20000 });
      if (res && res.ok()) return res;
      log(`try ${i}: ${url} -> HTTP ${res ? res.status() : 'none'}`);
    } catch (e) {
      log(`try ${i}: ${url} -> ${e.message.split('\n')[0]}`);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error(`ASSERT FAILED: ${url} did not load`);
}

async function axe(page, label) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const n = await page.evaluate(async () => (await window.axe.run(document)).violations.length);
  log(`axe ${label}: ${n} violations`);
  return n;
}

let ok = false;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await gotoWithRetry(page, base + '/');
  await page.getByRole('link', { name: 'Build my brand' }).first().waitFor({ timeout: 10000 });
  log(`PASS: ${base}/ loads and shows "Build my brand"`);
  await page.screenshot({ path: join(out, 'deployed-landing.png'), fullPage: true });
  const axeLanding = await axe(page, '/');

  // Deep link: the SPA fallback must serve the app, not a 404.
  const res = await gotoWithRetry(page, base + '/system', 3);
  await page.getByRole('heading', { name: 'Workbench' }).waitFor({ timeout: 10000 });
  log(`PASS: ${base}/system deep link loads the app (HTTP ${res.status()})`);

  if (axeLanding !== 0) throw new Error(`ASSERT FAILED: axe found ${axeLanding} violations on /`);
  ok = true;
  log('check-deployed PASS');
} catch (e) {
  log(`check-deployed FAILED: ${e.message}`);
} finally {
  await browser.close();
  writeFileSync(join(out, 'deployed-check.txt'), lines.join('\n') + '\n');
  process.exit(ok ? 0 : 1);
}
