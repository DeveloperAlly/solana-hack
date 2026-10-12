import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe on a rendered container and expects 0 violations.
 * jsdom cannot compute colours, so colour contrast is off here. It is checked instead by the token build
 * (every theme, every contrast pair in semantic.json) and in a real browser by scripts/check-gallery.mjs
 * (every gallery screen in every theme, colour contrast on).
 */
export async function expectNoAxeViolations(container: Element) {
  const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  if (r.violations.length) console.error(JSON.stringify(r.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })), null, 2));
  expect(r.violations).toHaveLength(0);
}
