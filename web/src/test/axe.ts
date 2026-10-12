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
export async function expectNoAxeViolations(container: Element) {
  const r = await runAxe(container, { iframes: false, rules: { 'color-contrast': { enabled: false } } });
  if (r.violations.length) console.error(JSON.stringify(r.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })), null, 2));
  expect(r.violations).toHaveLength(0);
}
