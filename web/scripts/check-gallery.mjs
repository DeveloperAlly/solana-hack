// Gallery check in a real browser (issue #46): axe with colour contrast ON, on /screens and every registered screen,
// in every state and every theme. jsdom unit tests cannot check contrast (src/test/axe.ts); this does.
// Routes are discovered, not listed: the /screens index links every screen from every src/screens/*/registry.ts,
// and each screen's state switcher (C28) links its states, so page screens are covered as they merge.
// Themes come from src/tokens/themes/*.json (the same files the token build reads).
//
// Usage:
//   npm run build && npm run check:gallery                       (serves dist with vite preview)
//   BASE_URL=https://jamjam-preview.<sub>.workers.dev npm run check:gallery   (a deployed preview)
// Browser: CHROMIUM_PATH, else the browser Playwright manages. This script never installs one.
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesDir = join(web, 'src', 'tokens', 'themes');
const themes = readdirSync(themesDir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(themesDir, f), 'utf8')).name).sort();
const port = Number(process.env.GALLERY_PORT || 4174);
const external = (process.env.BASE_URL || '').replace(/\/$/, '');
const base = external || `http://127.0.0.1:${port}`;
const concurrency = Number(process.env.GALLERY_CONCURRENCY || 4);
const outDir = join(web, 'proof');
mkdirSync(outDir, { recursive: true });

const lines = [];
const log = (s) => (lines.push(`${new Date().toISOString()} ${s}`), console.log(s));

async function waitFor(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server not ready: ${url}`);
}

async function load(page, path) {
  const res = await page.goto(base + path, { waitUntil: 'load', timeout: 30000 });
  if (!res || !res.ok()) throw new Error(`${path}: HTTP ${res ? res.status() : 'none'}`);
  await page.locator('main').first().waitFor({ timeout: 15000 });
}

async function axe(page, exclude) {
  const builder = new AxeBuilder({ page }); // every rule, colour contrast included
  if (exclude) builder.exclude(exclude);
  const r = await builder.analyze();
  return r.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

let server;
let browser;
let ok = false;
try {
  if (!external) {
    server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: web, stdio: 'ignore' });
    await waitFor(base + '/');
  }
  log(`check-gallery: ${base}, themes ${themes.join(', ')}`);
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // The gallery makes no network calls of its own; any /api request is a failure.
  const apiCalls = [];
  context.on('request', (req) => {
    if (new URL(req.url()).pathname.startsWith('/api/')) apiCalls.push(req.url());
  });

  // Discover screens from the index, then states from each screen's switcher.
  const page = await context.newPage();
  await load(page, '/screens');
  const screens = [...new Set(await page.locator('main a[href^="/screens/"]').evaluateAll((as) => as.map((a) => new URL(a.href).pathname)))];
  if (!screens.length) throw new Error('no screens linked from /screens');
  const targets = ['/screens'];
  for (const s of screens) {
    await load(page, s);
    const states = await page.getByRole('navigation', { name: 'Screen state' }).getByRole('link').evaluateAll((as) => as.map((a) => new URL(a.href).searchParams.get('state')));
    for (const st of states) targets.push(`${s}?state=${st}`);
  }
  const jobs = themes.flatMap((t) => targets.map((p) => `${p}${p.includes('?') ? '&' : '?'}theme=${t}`));
  log(`${screens.length} screens, ${targets.length} views, ${jobs.length} checks (views x themes)`);

  // Deep link and back button: the SPA fallback must serve a screen URL directly, and history must work.
  await load(page, screens[0]);
  await page.locator('a[href^="/screens?"], a[href="/screens"]').first().click();
  await page.getByRole('heading', { level: 1, name: 'Screens' }).waitFor();
  await page.goBack();
  await page.waitForURL((u) => u.pathname === screens[0]);
  log(`PASS: deep link ${screens[0]} loads, in-app link to /screens works, back returns to ${screens[0]}`);

  // The theme survives navigation: open the index in the last theme, follow a screen link, follow the screen's
  // own first link to another screen if it has one, and the document must still carry that theme.
  const persist = themes[themes.length - 1];
  await load(page, `/screens?theme=${persist}`);
  await page.locator('main a[href^="/screens/"]').first().click();
  await page.locator('main').first().waitFor();
  const inScreen = page.locator('main a[href^="/screens/"]').first();
  if (await inScreen.count()) {
    await inScreen.click();
    await page.locator('main').first().waitFor();
  }
  const kept = await page.evaluate(() => [document.documentElement.getAttribute('data-theme'), location.pathname + location.search]);
  if (kept[0] !== persist) throw new Error(`theme ${persist} lost after navigating to ${kept[1]} (data-theme=${kept[0]})`);
  log(`PASS: theme ${persist} kept after in-gallery navigation to ${kept[1]}`);

  const failures = [];
  let next = 0;
  async function worker() {
    const p = await context.newPage();
    while (next < jobs.length) {
      const path = jobs[next++];
      try {
        await load(p, path);
        const theme = new URL(base + path).searchParams.get('theme');
        const applied = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
        if (applied !== theme) throw new Error(`theme ${theme} not applied (data-theme=${applied})`);
        const v = await axe(p);
        if (v.length) failures.push(`${path}: ${v.join('; ')}`);
      } catch (e) {
        failures.push(`${path}: ${e.message.split('\n')[0]}`);
      }
    }
    await p.close();
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  // The workbench shows every component example (every *.example.tsx); check it in every theme too.
  for (const theme of themes) {
    try {
      await load(page, '/system');
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      // The PublicShell preview frame holds the landing page, a separate document with its own <main>; AxeBuilder
      // merges frame results, so landmark-unique would count two mains. The landing page is checked on its own by
      // scripts/proof-s0.mjs and scripts/check-deployed.mjs.
      const v = await axe(page, 'iframe[data-theme-preview]');
      if (v.length) failures.push(`/system (theme ${theme}): ${v.join('; ')}`);
      else log(`PASS: /system workbench, theme ${theme}, axe 0`);
    } catch (e) {
      failures.push(`/system (theme ${theme}): ${e.message.split('\n')[0]}`);
    }
  }

  for (const f of failures) log(`FAIL ${f}`);
  if (apiCalls.length) log(`FAIL: the gallery called the API: ${apiCalls.slice(0, 5).join(', ')}`);
  const total = jobs.length + themes.length;
  log(`axe (colour contrast on): ${total - failures.length} of ${total} checks with 0 violations (screens and /system, every theme); /api calls: ${apiCalls.length}`);
  ok = failures.length === 0 && apiCalls.length === 0;
  log(ok ? 'check-gallery PASS' : 'check-gallery FAILED');
} catch (e) {
  log(`check-gallery FAILED: ${e.message}`);
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
  writeFileSync(join(outDir, external ? 'deployed-gallery.txt' : 'gallery-check.txt'), lines.join('\n') + '\n');
  process.exit(ok ? 0 : 1);
}
