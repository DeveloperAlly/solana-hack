import { visibleText, q } from '../lib/harness.mjs';
import { evalConfig } from '../lib/config.mjs';
// The test site and brand name are configuration (EVAL_SITE, EVAL_BRAND_NAME), never committed values.
export const { site: SITE, host: HOST, brandName: BRAND_NAME } = evalConfig();
export const SITE_BARE = HOST; // what the user types where a journey asks for a site or domain
export const EMAIL = 'evals@example.com';

export const btn = (p, name, exact = false) => p.getByRole('button', { name, exact }).first();
export const link = (p, name, exact = false) => p.getByRole('link', { name, exact }).first();
export const main = (p) => p.locator('main').first();

/** Clicks a control only if it is enabled; otherwise throws, so the journey records a dead end. */
export async function click(loc) {
  await loc.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if ((await loc.count()) === 0) throw new Error('control not on page: ' + String(loc).replace(/^Locator@/, ''));
  if (await loc.isDisabled().catch(() => false)) throw new Error(`${q(await loc.innerText().catch(() => ''), 60)} is disabled`);
  await loc.click({ timeout: 5000 });
}

/** Do the fact sources on screen come from the site the user entered? */
export async function factSourcesFromSite(p, label = `Facts quote ${HOST}, not demo data`) {
  const hrefs = await p.locator('main a').evaluateAll((as) => as.filter((a) => /Open the page/.test(a.innerText)).map((a) => a.href));
  const cite = await visibleText(p.locator('main').getByText(/· (home page|How it works)/), 160);
  const firstFact = await visibleText(p.locator('main').getByText(/^“/), 200);
  const own = hrefs.length > 0 && hrefs.every((h) => h.includes(HOST));
  return { label, pass: own, actual: `first quote ${firstFact}; cited as ${cite}; source links: ${hrefs.join(', ') || 'none'}` };
}

/** Does the given region name the entered site/brand rather than a demo brand? */
export async function namesEnteredBrand(p, label, locator, demo = /JamJam|aDNA/) {
  const t = await visibleText(locator, 300);
  const low = t.toLowerCase();
  return { label, pass: (low.includes(HOST.split('.')[0]) || low.includes(BRAND_NAME.toLowerCase())) && !demo.test(t), actual: t };
}
