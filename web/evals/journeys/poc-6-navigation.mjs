// Journey 6 (POC): from every app screen, the nav and tabs reach the other steps and Back works. Lists every dead end.
import { q } from '../lib/harness.mjs';

const LOOP_NAV = ['Today', 'Brand', 'Create', 'Distribute', 'Verify', 'Grow', 'Learn', 'Inbox', 'Settings']; // ADR-012 decision 2

async function screenNames(page, base) {
  await page.goto(base + '/screens', { waitUntil: 'networkidle' });
  return page.$$eval('main a[href^="/screens/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href').split('?')[0].replace('/screens/', '')))].filter(Boolean));
}

async function inspect(page, base, name) {
  await page.goto(`${base}/screens/${name}`, { waitUntil: 'networkidle' });
  return page.evaluate((loop) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const gallery = (a) => a.closest('[data-gallery-chrome]') || /^(All screens|Success|Empty|Error|Loading|wireframe|wireframe-dark)$/.test(a.innerText.trim()) || /[?&](state|theme)=/.test(a.getAttribute('href') || '');
    const links = [...document.querySelectorAll('a[href]')].filter((a) => vis(a) && !gallery(a));
    const navLinks = links.filter((a) => !a.closest('main'));
    const navLabels = navLinks.map((a) => a.innerText.trim());
    const mainLinks = links.filter((a) => a.closest('main')).map((a) => ({ text: a.innerText.trim().replace(/\s+/g, ' ').slice(0, 60), href: a.getAttribute('href') }));
    const buttons = [...document.querySelectorAll('main button')].filter((b) => vis(b) && !b.disabled).length;
    const isApp = loop.every((l) => navLabels.includes(l)) || (navLabels.includes('Today') && navLabels.includes('Learn'));
    return { navLabels, nav: navLinks.map((a) => ({ text: a.innerText.trim(), href: a.getAttribute('href') })), mainLinks, buttons, isApp, title: document.querySelector('main h1')?.innerText.trim() || '' };
  }, LOOP_NAV);
}

export default {
  id: 'poc-6-navigation',
  title: 'Navigation: nav, tabs and Back from every app screen; every dead end',
  section: 'poc',
  target: 'preview',
  notes: 'Each screen is opened by URL as the start of its own mini-journey; the nav and tab links on it are then followed by clicking, and Back is tested with the browser back button.',
  async run(j) {
    const crawl = await j.context.newPage();
    const names = await screenNames(crawl, j.base);
    const info = {};
    for (const n of names) info[n] = await inspect(crawl, j.base, n);
    const app = names.filter((n) => info[n].isApp);

    // Every distinct link target found on any screen, checked once.
    const targets = new Map();
    for (const n of names) for (const l of [...info[n].nav, ...info[n].mainLinks]) if (l.href && !l.href.startsWith('#') && !/^(https?|mailto|tel):/.test(l.href)) { if (!targets.has(l.href.split('#')[0])) targets.set(l.href.split('#')[0], []); targets.get(l.href.split('#')[0]).push(`${n} › ${q(l.text, 40)}`); }
    const broken = [];
    const leaves = [];
    for (const [href, from] of targets) {
      if (!href.startsWith('/screens/')) { leaves.push(`${href} (from ${from.slice(0, 3).join('; ')}${from.length > 3 ? `; +${from.length - 3} more` : ''})`); continue; }
      await crawl.goto(j.base + href, { waitUntil: 'networkidle' });
      if (await crawl.getByText('No such screen').count()) broken.push(`${href} (from ${from.slice(0, 3).join('; ')})`);
    }
    const noWayOn = names.filter((n) => info[n].nav.length === 0 && info[n].mainLinks.length === 0 && info[n].buttons === 0);

    await j.step({
      did: `Open the gallery index and every screen it lists (${names.length}); on each app-shell screen (${app.length}) read the nav.`,
      expected: 'Every app screen shows the one loop nav from config/nav.ts: Today, Brand, Create, Distribute, Verify, Grow, Learn, then Inbox and Settings (ADR-012 decision 2).',
      source: 'ADR-012 decision 2',
      action: (p) => p.goto(j.url('/screens/Today'), { waitUntil: 'networkidle' }),
      checks: async () => {
        const wrong = app.filter((n) => LOOP_NAV.some((l) => !info[n].navLabels.includes(l)));
        const navSets = new Map();
        for (const n of app) { const k = info[n].nav.filter((x) => LOOP_NAV.includes(x.text)).map((x) => `${x.text}→${x.href}`).join(', '); navSets.set(k, [...(navSets.get(k) || []), n]); }
        return [
          { label: 'All 9 loop nav items on every app screen', pass: wrong.length === 0, actual: wrong.length ? 'missing items on: ' + wrong.map((n) => `${n} (has ${info[n].navLabels.filter((x) => x).join(', ')})`).join('; ') : `all ${app.length} app screens` },
          { label: 'Nav targets identical on every app screen', pass: navSets.size === 1, actual: [...navSets.entries()].map(([k, v]) => `${v.length} screens: ${k}`).join(' || ') },
        ];
      },
    });

    // Click each loop nav item from Today, then Back.
    for (const label of LOOP_NAV.slice(1)) {
      await j.step({
        did: `On Today, click "${label}" in the nav, then press the browser Back button.`,
        expected: `"${label}" opens that step's home screen (a real screen); Back returns to Today.`,
        source: 'ADR-012 decision 2; brief journey 6',
        action: async (p, jj) => {
          await p.goto(jj.url('/screens/Today'), { waitUntil: 'networkidle' });
          await p.getByRole('link', { name: label, exact: true }).first().click();
          await jj.settle();
          jj.landed = { url: p.url(), missing: await p.getByText('No such screen').count(), h1: (await p.locator('main h1').first().innerText().catch(() => '')).trim() };
          await p.goBack(); await jj.settle();
        },
        checks: async (p, jj) => [
          { label: `"${label}" lands on a real screen`, pass: !jj.landed.missing && !/\/screens\/Today$/.test(jj.landed.url), actual: `landed on ${jj.landed.url}, heading ${q(jj.landed.h1)}` },
          { label: 'Back returns to Today', pass: /\/screens\/Today$/.test(p.url()), actual: 'after Back: ' + p.url() },
        ],
      });
    }

    // Sub-tabs within each step: every tab on every app screen goes to a real screen.
    await j.step({
      did: 'On every app screen, collect the step tabs under the nav and follow each.',
      expected: 'Every tab opens a real screen; none is "No such screen".',
      source: 'ADR-012 decision 2 (inside a step, sections use tabs)',
      action: async () => {},
      checks: async () => [{ label: 'No broken in-gallery link anywhere', pass: broken.length === 0, actual: broken.length ? 'broken: ' + broken.join('; ') : `${targets.size} distinct link targets checked` }],
    });

    await j.step({
      did: 'List links that leave the screen gallery for a route outside /screens.',
      expected: 'Inside the POC, a click keeps the user in the POC; links out of /screens are dead ends for the journey (brief journey 6).',
      source: 'brief journey 6',
      action: async () => {},
      checks: async () => [{ label: 'No link leaves the POC', pass: leaves.length === 0, actual: leaves.length ? `${leaves.length} targets leave /screens: ` + leaves.join('; ') : 'none' }],
    });

    await j.step({
      did: 'List screens with no nav, no link and no enabled button in the page.',
      expected: 'No screen is a dead end (brief journey 6).',
      source: 'brief journey 6',
      action: async (p) => { if (noWayOn[0]) await p.goto(j.url('/screens/' + noWayOn[0]), { waitUntil: 'networkidle' }); },
      checks: async () => [{ label: 'No screen without a way on', pass: noWayOn.length === 0, actual: noWayOn.length ? 'dead ends: ' + noWayOn.join(', ') : 'none' }],
    });

    // Back works after an in-page link, on a sample of app screens across steps.
    const sample = ['Brand-Build', 'Content-Dashboard', 'Platforms', 'Verify-Home', 'Grow-Home', 'Analytics', 'Inbox-All', 'Settings-AI'].filter((n) => names.includes(n));
    for (const n of sample) {
      const tabs = info[n].nav.filter((l) => !LOOP_NAV.includes(l.text) && l.href?.startsWith('/screens/') && !l.href.includes(n) && !/switch brand|▾|JamJam$/.test(l.text));
      const first = info[n].mainLinks.find((l) => l.href?.startsWith('/screens/') && !l.href.includes(n)) || tabs[0];
      await j.step({
        did: first ? `Open /screens/${n}, click "${first.text}", then Back.` : `Open /screens/${n} and look for a link in the page.`,
        expected: 'The link opens its screen and Back returns to the screen it came from.',
        source: 'brief journey 6',
        action: async (p, jj) => {
          await p.goto(jj.url('/screens/' + n), { waitUntil: 'networkidle' });
          if (!first) return;
          await p.getByRole('link', { name: first.text }).filter({ visible: true }).first().click(); await jj.settle();
          jj.landed = { url: p.url(), missing: await p.getByText('No such screen').count() };
          await p.goBack(); await jj.settle();
        },
        checks: async (p, jj) => first ? [
          { label: 'Link opens a real screen', pass: !jj.landed.missing && jj.landed.url !== j.url('/screens/' + n), actual: 'landed on ' + jj.landed.url },
          { label: 'Back returns', pass: p.url().split('#')[0] === j.url('/screens/' + n), actual: 'after Back: ' + p.url() },
        ] : [{ label: 'Has an in-page link', pass: false, actual: 'no in-page link or tab to another screen' }],
      });
    }
    await crawl.close();
  },
};
