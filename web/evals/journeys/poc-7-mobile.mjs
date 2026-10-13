// Journey 7 (POC): at 390 px, the first-run journey and the ambassador mobile flow M-1 to M-5.
import { controlState, urlIs, seesText, visibleText, q } from '../lib/harness.mjs';
import { EMAIL, btn, link, click } from './poc-common.mjs';
import { firstRunSteps } from './poc-1-first-run.mjs';

const MOBILE = { viewport: { width: 390, height: 844 }, mobile: true };
async function noHScroll(p) {
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  return { label: 'No horizontal scroll', pass: r.sw <= r.cw, actual: `document scrollWidth ${r.sw}px, viewport ${r.cw}px` };
}
async function tapTargets(p) {
  const small = await p.locator('main button, main input, main select, main textarea').evaluateAll((es) => es.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24) && e.type !== 'radio' && e.type !== 'checkbox'; }).map((e) => `${e.tagName.toLowerCase()} "${(e.innerText || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
  return { label: 'Buttons and fields at least 24 px (WCAG 2.2 target size; inline text links exempt)', pass: small.length === 0, actual: small.length ? small.slice(0, 8).join('; ') + (small.length > 8 ? `; +${small.length - 8} more` : '') : 'all controls 24 px or larger' };
}

export default [
  {
    id: 'poc-7a-mobile-first-run',
    title: 'Mobile 390 px: first-run journey (Main, J1 to J8)',
    section: 'poc',
    target: 'preview',
    ...MOBILE,
    run: (j) => firstRunSteps(j, { mobile: true }),
  },
  {
    id: 'poc-7b-mobile-ambassador',
    title: 'Mobile 390 px: ambassador flow M-1 to M-5',
    section: 'poc',
    target: 'preview',
    ...MOBILE,
    async run(j) {
      await j.step({
        did: 'Open /screens/M-1-Campaigns at 390 px (first screen, by URL).',
        expected: 'Cards stack; filter chips scroll sideways inside their row; no page-wide horizontal scroll (n-m1).',
        source: 'n-m1',
        action: (p) => p.goto(j.url('/screens/M-1-Campaigns'), { waitUntil: 'networkidle' }),
        checks: async (p) => [await noHScroll(p), await tapTargets(p)],
      });
      await j.step({
        did: 'Tap the "aDNA launch week" card.',
        expected: 'Detail with a sticky Join bar (n-m2).',
        source: 'n-m2',
        action: (p) => click(p.getByRole('link', { name: /aDNA launch week/ }).first()),
        checks: async (p) => [await urlIs(p, 'On M-2-Detail', /M-2-Detail/), await controlState(p, 'Join visible', btn(p, 'Join and start writing'), 'present'), await noHScroll(p)],
      });
      await j.step({
        did: `Tap "Join and start writing", type "${EMAIL}", tap "Email me a code", type the code "12345678", tap "Join and start writing".`,
        expected: 'Joined; the writer opens (n-m2, n-a2; the project sends 8-digit codes, n-ob1).',
        source: 'n-m2, n-a2, n-ob1',
        action: async (p) => {
          await click(btn(p, 'Join and start writing')); await j.settle();
          await p.locator('input[type=email]').first().fill(EMAIL); await click(btn(p, 'Email me a code')); await j.settle();
          await p.locator('input:not([type=email])').last().fill('12345678'); await click(btn(p, 'Join and start writing'));
        },
        checks: async (p) => [await urlIs(p, 'On M-3-Generate', /M-3-Generate/), await noHScroll(p)],
        continueOnError: true,
      });
      await j.step({
        did: 'If the code was refused, type "123456" and tap "Join and start writing".',
        expected: 'Writer opens; the on-brand meter is pinned at the top; Publish disabled while flags remain (n-m3).',
        source: 'n-m3',
        action: async (p) => { if (/M-2-Detail/.test(p.url())) { await p.locator('input:not([type=email])').last().fill('123456'); await click(btn(p, 'Join and start writing')); } },
        checks: async (p) => [await urlIs(p, 'On M-3-Generate', /M-3-Generate/), await controlState(p, 'Publish disabled', btn(p, 'Publish', true), 'disabled'), await noHScroll(p), await tapTargets(p)],
      });
      await j.step({
        did: 'Tap "4 flags" and tap each fix in the sheet.',
        expected: 'Flags open as a bottom sheet; fixing them enables Publish (n-m3).',
        source: 'n-m3',
        action: async (p) => {
          await click(btn(p, /flags/)); await j.settle();
          for (let i = 0; i < 6; i++) {
            const fix = p.getByRole('button', { name: /^(Remove|Replace|Add)\b/ }).filter({ visible: true }).first();
            if (!(await fix.count())) break;
            await click(fix); await j.settle(200);
          }
          const close = p.getByRole('button', { name: /Close|Done/ }).filter({ visible: true }).first();
          if (await close.count()) await click(close);
        },
        checks: async (p) => [await controlState(p, 'Publish enabled', btn(p, 'Publish', true), 'enabled'), await noHScroll(p)],
      });
      await j.step({
        did: 'Tap "Publish".',
        expected: 'Same three routes as desktop; paste URL accepts share-sheet links (n-m4).',
        source: 'n-m4',
        action: (p) => click(btn(p, 'Publish', true)),
        checks: async (p) => [await urlIs(p, 'On M-4-Publish', /M-4-Publish/), await controlState(p, 'Paste URL field', p.locator('input[type=url]'), 'present'), await noHScroll(p), await tapTargets(p)],
      });
      await j.step({
        did: 'Type "https://www.linkedin.com/posts/evals-123", tap "Submit URL".',
        expected: 'Status steps shown vertically; receipt opens in a sheet (n-m5).',
        source: 'n-m5',
        action: async (p) => { await p.locator('input[type=url]').first().fill('https://www.linkedin.com/posts/evals-123'); await click(btn(p, 'Submit URL')); },
        checks: async (p) => [await urlIs(p, 'On M-5-Status', /M-5-Status/), await noHScroll(p), await tapTargets(p)],
      });
      await j.step({
        did: 'Tap the outcome "Approved and paid", then "Receipt".',
        expected: 'Receipt opens in a sheet (n-m5).',
        source: 'n-m5',
        action: async (p) => { await click(link(p, 'Approved and paid')); await j.settle(); await click(btn(p, 'Receipt', true)); },
        checks: async (p) => [await seesText(p, 'Receipt sheet shown', /receipt|transaction|signature/i, { actualFrom: (pp) => pp.locator('[role=dialog]').first() }).then(async (c) => ({ ...c, pass: (await p.locator('[role=dialog]').filter({ visible: true }).count()) > 0, actual: 'dialog: ' + (await visibleText(p.locator('[role=dialog]'), 200)) })), await noHScroll(p)],
      });
    },
  },
];
