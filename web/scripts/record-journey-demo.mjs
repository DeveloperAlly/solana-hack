// Real deployed-result playback for delivery #114; session stays in browser memory only.
import { chromium } from 'playwright-core';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function recordJourneyDemo({ base, supabaseUrl, session, brandId, post, directory }) {
  await mkdir(directory, { recursive: true });
  const notes = ['Demo: honest playback of persisted results after a successful live API journey.', 'Live scenes use deployed UI and real records. Preview scenes retain the visible Product preview/sample data label.'];
  const deadline = Date.now() + 2 * 60 * 1000;
  const viewport = { width: 1920, height: 1080 };
  const browser = await chromium.launch({ headless: true });
  let context, page, phase = 'browser setup', failed = false;
  try {
    context = await browser.newContext({ viewport, recordVideo: { dir: directory, size: viewport } });
    context.setDefaultTimeout(15000);
    context.setDefaultNavigationTimeout(20000);
    const origin = new URL(base).origin;
    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
    await context.addInitScript(({ origin, storageKey, session, brandId }) => {
      if (location.origin !== origin) return;
      localStorage.setItem(storageKey, JSON.stringify({ ...session, expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in || 3600) }));
      sessionStorage.setItem('jamjam.journey.brandId', brandId);
      sessionStorage.setItem(`jamjam:brand:${session.user.id}`, brandId);
    }, { origin, storageKey, session, brandId });
    page = await context.newPage();
    // Passive playback must not silently draft, re-approve or re-register anything.
    const forbidden = [];
    await page.route('**/api/**', async route => {
      const request = route.request();
      if (!['GET', 'HEAD'].includes(request.method()) && new URL(request.url()).pathname !== '/api/verify') {
        forbidden.push(new URL(request.url()).pathname);
        await route.abort();
      } else await route.continue();
    });
    async function hold(seconds = 3) {
      if (Date.now() + seconds * 1000 > deadline) throw new Error('Playback time limit exceeded');
      await page.waitForTimeout(seconds * 1000);
      if (forbidden.length) throw new Error('Playback attempted a write');
      if (await page.getByText(/Could not load your brand|This step needs attention|Complete the previous step first/).count()) throw new Error('Live scene failed');
    }
    async function scene(path, heading) {
      phase = path;
      await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: heading }).first().waitFor({ timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await hold();
      notes.push(`PASS live scene ${path}`);
    }
    await scene('/journey/read', /^Reading /);
    await scene('/journey/confirm', 'Confirm what we found');
    await scene('/journey/approveKit', 'Approve kit v1');
    for (const title of ['Purpose', 'Positioning', 'Voice', 'Audience', 'Origin', 'Messaging']) {
      phase = `kit section ${title}`;
      const heading = page.getByRole('heading', { name: title, exact: true }).first();
      await heading.scrollIntoViewIfNeeded();
      await hold(2);
      notes.push(`PASS persisted kit section ${title}`);
    }
    // /create reads the registered post without J6's automatic claims-model call.
    await scene('/create', 'Create');
    await page.getByText(post.body, { exact: false }).first().waitFor({ timeout: 30000 });
    await hold();
    await scene('/journey/proof', 'Your first post is registered');
    await scene('/verify', 'Check a post');
    for (const [text, expected, name] of [[post.body, true, 'exact text'], [post.body + ' (edited)', false, 'changed text']]) {
      phase = `verify ${name}`;
      await page.getByLabel('Post text').fill(text);
      const result = page.waitForResponse(response => new URL(response.url()).pathname === '/api/verify' && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Check', exact: true }).click();
      const response = await result;
      if (!response.ok() || (await response.json()).official !== expected) throw new Error('Actual verification failed');
      await page.getByText(expected ? /^Registered by / : 'Not an official post', { exact: !expected }).first().waitFor();
      await hold();
      notes.push(`PASS actual public verification ${name}: official=${expected}`);
    }
    for (const path of ['/preview/Today', '/preview/Brain', '/distribute', '/grow', '/learn']) {
      phase = path;
      await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded' });
      await page.getByText('Product preview', { exact: true }).waitFor();
      if (await page.getByText('This preview is not available.').count()) throw new Error('Preview unavailable');
      await hold();
      notes.push(`PASS labeled sample preview ${path}`);
    }
    notes.push('PASS recording; no application writes or additional AI calls during playback.');
  } catch {
    failed = true;
    notes.push(`FAIL recording scene: ${phase}. No successful recording claimed.`);
  } finally {
    const video = page?.video();
    if (context) await context.close();
    if (video) await rename(await video.path(), join(directory, failed ? 'demo-failed.webm' : 'demo.webm'));
    await browser.close();
    await writeFile(join(directory, 'demo-proof.txt'), notes.join('\n') + '\n');
  }
  if (failed) throw new Error(`Recording failed at ${phase}`);
}
