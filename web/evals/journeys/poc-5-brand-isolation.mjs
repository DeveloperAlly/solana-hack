// Journey 5 (POC): switching brand with a pending selection or approval leaks nothing across brands.
import { seesText, controlState, urlIs, visibleText, q } from '../lib/harness.mjs';
import { btn, link, click } from './poc-common.mjs';

const PENDING = 'BRAND A PENDING EDIT, must not appear in brand B';
// The header switcher is a menu on some screens and a link to the Brand-Switcher screen on others.
async function switchTo(p, name) {
  const menuBtn = p.locator('header').getByRole('button', { name: /aDNA|JamJam|film\.fun|GamersLab/ }).first();
  if (await menuBtn.count()) {
    await click(menuBtn);
    await click(p.getByRole('menuitemradio', { name: new RegExp(name.replace('.', '\\.')) }));
    return;
  }
  await click(p.getByRole('link', { name: /switch brand/ }).first());
  await p.waitForLoadState('networkidle');
  await click(p.getByRole('button', { name: `Switch to ${name}` }));
}
const headerBrand = async (p) => (await p.locator('header').getByRole('button', { name: /aDNA|JamJam|film\.fun|GamersLab/ }).or(p.getByRole('link', { name: /switch brand/ })).first().innerText().catch(() => '')).trim();

export default {
  id: 'poc-5-brand-isolation',
  title: 'Brand isolation: switch brand mid-edit and mid-approval',
  section: 'poc',
  target: 'preview',
  requires: ['Today', 'Content-Dashboard', 'Draft-Review'],
  async run(j) {
    await j.step({
      did: 'Open /screens/Content-Dashboard (first screen, by URL), click "Review" on the X draft.',
      expected: 'Draft-Review for brand A (aDNA).',
      source: 'n-dr',
      action: async (p) => { await p.goto(j.url('/screens/Content-Dashboard'), { waitUntil: 'networkidle' }); await click(p.getByRole('button', { name: /Review/ }).first()); },
      checks: async (p) => [await urlIs(p, 'On Draft-Review', /Draft-Review/), { label: 'Header brand is aDNA', pass: /aDNA/.test(await headerBrand(p)), actual: 'header brand button ' + q(await headerBrand(p)) }],
    });
    await j.step({
      did: `Type "${PENDING}" into the post, choose "Copy, post it yourself, paste the URL back" (a pending selection), do not approve.`,
      expected: 'Pending edit and route selected; Approve enabled.',
      source: 'n-dr',
      action: async (p) => { await p.locator('main textarea').first().fill(PENDING); await p.locator('input[value=manual]').check(); },
      checks: async (p) => [await controlState(p, 'Approve enabled', btn(p, 'Approve', true), 'enabled')],
    });
    await j.step({
      did: 'Open the brand menu in the header ("aDNA ▾"), choose "film.fun · unverified".',
      expected: 'Brand B (film.fun) shown with nothing from aDNA: not the pending edit, not the selection, not aDNA labels (brief journey 5).',
      source: 'brief journey 5; ADR-012 shells',
      action: (p) => switchTo(p, 'film.fun'),
      checks: async (p) => {
        const body = await p.locator('main textarea').first().inputValue().catch(() => '');
        const manual = await p.locator('input[value=manual]').isChecked().catch(() => false);
        return [
          { label: 'Header shows film.fun', pass: /film\.fun/.test(await headerBrand(p)), actual: 'header brand button ' + q(await headerBrand(p)) },
          { label: 'Pending edit not carried into film.fun', pass: !body.includes('BRAND A'), actual: 'editor ' + q(body) },
          { label: 'Route selection not carried', pass: !manual, actual: `manual route checked: ${manual}` },
          await seesText(p, 'No aDNA content on film.fun\'s screen', /aDNA/, { absent: true }),
        ];
      },
    });
    await j.step({
      did: 'Switch back to "aDNA · verified" from the header menu.',
      expected: 'Back on aDNA; the screen shows aDNA again.',
      source: 'brief journey 5',
      action: (p) => switchTo(p, 'aDNA'),
      checks: async (p) => [{ label: 'Header shows aDNA', pass: /aDNA/.test(await headerBrand(p)), actual: 'header brand button ' + q(await headerBrand(p)) }],
    });
    await j.step({
      did: 'Click "Today" in the nav, click "Approve" on the first draft card (a pending approval), then switch to "JamJam" with the header brand control ("Switch" on Your brands), then click "Today".',
      expected: 'Today for JamJam: no aDNA queue items, greeting or counts (brief journey 5).',
      source: 'brief journey 5; ADR-012 decision 1',
      action: async (p) => {
        await click(p.getByRole('link', { name: 'Today', exact: true }).first()); await j.settle();
        await click(btn(p, 'Approve', true)); await j.settle();
        await switchTo(p, 'JamJam'); await j.settle();
        await click(p.getByRole('link', { name: 'Today', exact: true }).first());
      },
      checks: async (p) => [
        { label: 'Header shows JamJam', pass: /JamJam/.test(await headerBrand(p)), actual: 'header brand control ' + q(await headerBrand(p)) + ' on ' + p.url() },
        await seesText(p, 'No aDNA content on JamJam\'s Today', /aDNA/, { absent: true }),
        await (async () => { const h = await visibleText(p.locator('main h1').first()); return { label: 'Greeting names JamJam', pass: /JamJam/.test(h), actual: 'main heading ' + h }; })(),
      ],
    });
  },
};
