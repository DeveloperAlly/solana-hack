import axe from 'axe-core';
import { expect } from 'vitest';

// axe-core allows one run at a time per document ("Axe is already running"). A run left in flight by a timed-out
// test would make every later run in the file fail, so every run goes through this queue: each starts only after
// the previous one has settled, whatever its outcome.
let queue: Promise<unknown> = Promise.resolve();

function runAxe(container: Element, options: axe.RunOptions): Promise<axe.AxeResults> {
  const run = queue.then(() => axe.run(container, options));
  queue = run.catch(() => undefined);
  return run;
}

/**
 * Runs axe on the rendered container only, and expects 0 violations.
 * Rules jsdom cannot evaluate are off, and only those:
 * - color-contrast: jsdom does not compute styles or paint, so axe cannot read colours. Contrast is checked by the
 *   token build (every theme, every pair in semantic.json) and in a real browser by scripts/check-gallery.mjs
 *   (every gallery screen in every theme, colour contrast on).
 * iframes are not entered: jsdom cannot message frames (the /system PublicShell preview); the browser check covers them.
 */
// Rules that judge the page as a whole rather than one component: landmarks, headings, ids. A page made of
// components that are each checked with every rule elsewhere (the /system workbench: gallery.test.tsx runs every
// example through the full rule set) needs only these at page level, so the jsdom run stays fast as the workbench grows.
// The real-browser run (scripts/check-gallery.mjs) still checks /system with every rule.
const pageLevelRules = [
  'landmark-banner-is-top-level', 'landmark-complementary-is-top-level', 'landmark-contentinfo-is-top-level',
  'landmark-main-is-top-level', 'landmark-no-duplicate-banner', 'landmark-no-duplicate-contentinfo',
  'landmark-no-duplicate-main', 'landmark-one-main', 'landmark-unique', 'heading-order', 'page-has-heading-one',
  'duplicate-id', 'duplicate-id-aria', 'bypass', 'region',
];

export async function expectNoAxeViolations(container: Element, { scope = 'all' }: { scope?: 'all' | 'page' } = {}) {
  const options: axe.RunOptions = scope === 'page'
    ? { iframes: false, runOnly: { type: 'rule', values: pageLevelRules } }
    : { iframes: false, rules: { 'color-contrast': { enabled: false } } };
  const r = await runAxe(container, options);
  if (r.violations.length) console.error(JSON.stringify(r.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })), null, 2));
  expect(r.violations).toHaveLength(0);
}
