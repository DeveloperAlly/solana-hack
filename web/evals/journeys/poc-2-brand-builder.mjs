// Journey 2 (POC): Brand Builder. Sign in, domain, intake, three gates, coverage, kit v1, export.
import fs from 'node:fs';
import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { seesText, controlState, urlIs, visibleText, q } from '../lib/harness.mjs';
import { SITE_BARE, HOST, BRAND_NAME, EMAIL, btn, link, click, namesEnteredBrand } from './poc-common.mjs';

const NEW_POSITIONING = `For founders who need proof, ${BRAND_NAME} turns systems thinking into shipped product.`;
const cont = (p) => link(p, 'Continue', true);

export default {
  id: 'poc-2-brand-builder',
  title: 'Brand Builder: sign in, domain, intake, 3 gates, coverage, kit v1, export',
  section: 'poc',
  target: 'preview',
  requires: ['Onboard-1-SignIn', 'Onboard-2-Domain', 'BB-1-Basics', 'Onboard-3-Sources', 'Onboard-3b-Profiling', 'BB-2-Origin', 'BB-3-GoldenCircle', 'BB-Gate1-Purpose', 'BB-4-Alternatives', 'BB-Gate2-Positioning', 'BB-5-Audience', 'BB-6-Voice', 'BB-Gate3-Voice', 'Coverage-Map', 'Onboard-6-Published', 'Kit-Export'],
  async run(j) {
    await j.step({
      did: 'Open /screens/Onboard-1-SignIn (first screen, by URL).',
      expected: 'Sign in with email (n-ob1).',
      source: 'n-ob1',
      action: (p) => p.goto(j.url('/screens/Onboard-1-SignIn'), { waitUntil: 'networkidle' }),
      checks: async (p) => [await controlState(p, 'Email field', p.locator('input[type=email]'), 'present'), await controlState(p, '"Send code"', btn(p, 'Send code'), 'enabled')],
    });
    await j.step({
      did: `Type "${EMAIL}", click "Send code", type "12345678", click "Continue".`,
      expected: 'Domain step opens; fields empty or carrying what I entered, not a demo brand (n-ob2; owner: your brand from your site).',
      source: 'n-ob1, n-ob2',
      action: async (p) => {
        await p.locator('input[type=email]').fill(EMAIL); await click(btn(p, 'Send code'));
        await p.locator('input[autocomplete=one-time-code]').fill('12345678'); await click(btn(p, 'Continue', true));
      },
      checks: async (p) => {
        const vals = await p.locator('main input').evaluateAll((es) => es.map((e) => `${e.labels?.[0]?.innerText}: "${e.value}"`));
        return [await urlIs(p, 'On Onboard-2-Domain', /Onboard-2-Domain/), { label: 'Brand name and domain not prefilled with a demo brand', pass: !vals.some((v) => /JamJam|jamjam\.tech/.test(v)), actual: 'input values: ' + vals.join('; ') }];
      },
    });
    await j.step({
      did: 'Clear the Domain field.',
      expected: 'The DNS "Check now" is disabled until a domain is entered (brief journey 2).',
      source: 'brief; n-ob2',
      action: (p) => p.getByLabel('Domain', { exact: true }).fill(''),
      checks: async (p) => [await controlState(p, '"Check now" disabled', p.getByRole('button', { name: 'Check now' }).or(p.getByRole('link', { name: 'Check now' })), 'disabled'), await seesText(p, 'Prompt to enter a domain', /Enter your domain/)],
    });
    await j.step({
      did: `Type "${BRAND_NAME}" as Brand name and "${SITE_BARE}" as Domain.`,
      expected: `TXT record instructions name ${HOST}; "Check now" enabled.`,
      source: 'n-ob2',
      action: async (p) => { await p.getByLabel('Brand name').fill(BRAND_NAME); await p.getByLabel('Domain', { exact: true }).fill(SITE_BARE); },
      checks: async (p) => [await seesText(p, `TXT record for ${HOST}`, `TXT record for ${SITE_BARE}`), await controlState(p, '"Check now" enabled', p.getByRole('button', { name: 'Check now' }).or(p.getByRole('link', { name: 'Check now' })), 'enabled')],
    });
    await j.step({
      did: 'Click "Skip, continue unverified".',
      expected: 'Intake step 1 with my name and site carried in, and an "Unverified" chip (n-ob2: unverified brands carry an Unverified chip on every Brand Builder screen).',
      source: 'n-ob2, n-bb1',
      action: (p) => click(link(p, 'Skip, continue unverified')),
      checks: async (p) => {
        const vals = await p.locator('main input[type=text], main input:not([type]), main textarea').evaluateAll((es) => es.map((e) => e.value));
        return [
          await urlIs(p, 'On BB-1-Basics', /BB-1-Basics/),
          { label: 'Name and site carried in', pass: vals.some((v) => v.includes(BRAND_NAME)) && vals.some((v) => v.includes(SITE_BARE)), actual: 'field values: ' + vals.map((v) => q(v, 80)).join('; ') },
          await seesText(p, '"Unverified" chip', 'Unverified', { exact: true }),
          await (async () => { const v = await p.getByLabel('One-line description').inputValue().catch(() => '(no field)'); return { label: 'One-line description is not the JamJam demo line', pass: !/Build your brand, run it, prove it/.test(v), actual: 'field value ' + q(v) }; })(),
        ];
      },
    });
    await j.step({
      did: 'Click "Continue: read my links".',
      expected: `Sources lists ${HOST} prefilled from step 1 (n-ob3).`,
      source: 'n-ob3',
      action: (p) => click(btn(p, 'Continue: read my links')),
      checks: async (p) => [await urlIs(p, 'On Onboard-3-Sources', /Onboard-3-Sources/), await seesText(p, `${HOST} listed`, SITE_BARE, { exact: true, actualFrom: (pp) => pp.getByText('From step 1').first().locator('xpath=..') })],
    });
    await j.step({
      did: 'Click "Read my sources".',
      expected: `Each source read one by one with its own status; ${HOST} is the one being read (n-ob3b).`,
      source: 'n-ob3b',
      action: (p) => click(link(p, 'Read my sources')),
      checks: async (p) => [await urlIs(p, 'On Onboard-3b-Profiling', /Onboard-3b-Profiling/), await seesText(p, `${HOST} has a status`, SITE_BARE, { exact: true, actualFrom: (pp) => pp.getByText(/facts found/) .locator('xpath=../..') })],
    });
    await j.step({
      did: 'Click "Continue to the next question".',
      expected: `Origin: found facts shown for confirmation come from ${HOST} (n-bb2).`,
      source: 'n-bb2',
      action: (p) => click(link(p, 'Continue to the next question')),
      checks: async (p) => [await urlIs(p, 'On BB-2-Origin', /BB-2-Origin/), await seesText(p, `Found fact cites ${HOST}`, new RegExp(SITE_BARE.replace('.', '\\.') + ' · confirm'), { actualFrom: (pp) => pp.getByText(/· confirm/) })],
    });
    await j.step({
      did: 'Click "Continue", then "Draft my purpose", then "Approve purpose".',
      expected: 'Gate 1 records the decision: who (my email) and when (n-g1).',
      source: 'n-g1',
      action: async (p) => { await click(cont(p)); await j.settle(); await click(link(p, 'Draft my purpose')); await j.settle(); await click(btn(p, 'Approve purpose')); },
      checks: async (p) => [await seesText(p, 'Purpose approved', 'Purpose approved'), await seesText(p, 'Decision names the approver', new RegExp('Decision recorded: ' + EMAIL.replace('.', '\\.')), { actualFrom: (pp) => pp.getByText(/Decision recorded/) })],
    });
    await j.step({
      did: 'Click "Continue", pick Option A, click "Continue with option A", then "Approve positioning".',
      expected: 'Gate 2 approved (n-g2).',
      source: 'n-bb4, n-g2',
      action: async (p) => { await click(cont(p)); await j.settle(); await p.locator('main input[type=radio]').first().check(); await click(link(p, 'Continue with option A')); await j.settle(); await click(btn(p, 'Approve positioning')); },
      checks: async (p) => [await seesText(p, 'Positioning approved', 'Positioning approved')],
    });
    await j.step({
      did: 'Click "Continue" through Audience and Voice, then "Approve voice".',
      expected: 'Gate 3 approved (n-g3).',
      source: 'n-g3',
      action: async (p) => { for (let i = 0; i < 3; i++) { await click(cont(p)); await j.settle(); } await click(btn(p, 'Approve voice')); },
      checks: async (p) => [await seesText(p, 'Voice approved', 'Voice approved')],
    });
    await j.step({
      did: 'Click "Continue".',
      expected: `Coverage map: 17 sections for my brand; "Approve kit v1" available now all 3 gates passed (n-cov).`,
      source: 'n-cov',
      action: (p) => click(cont(p)),
      checks: async (p) => [
        await urlIs(p, 'On Coverage-Map', /Coverage-Map/),
        await controlState(p, '"Approve kit v1" available', p.getByRole('link', { name: 'Approve kit v1' }).or(p.getByRole('button', { name: 'Approve kit v1' })), 'enabled'),
        await namesEnteredBrand(p, `Coverage column is ${HOST}, not a demo brand`, p.getByText(/^Coverage by section/)),
      ],
    });
    await j.step({
      did: `Click "Back", click "4 Positioning" in the stepper, "Continue with option A", "Reopen", replace the statement with "${NEW_POSITIONING}", click "Approve positioning".`,
      expected: 'Positioning re-approved as a new decision.',
      source: 'n-g1 (reopening creates a new kit version)',
      action: async (p) => {
        await click(link(p, 'Back', true)); await j.settle();
        await click(p.getByRole('link', { name: /4 Positioning/ })); await j.settle();
        await click(link(p, 'Continue with option A')); await j.settle();
        await click(btn(p, 'Reopen')); await j.settle();
        await p.locator('main textarea').first().fill(NEW_POSITIONING);
        await click(btn(p, 'Approve positioning'));
      },
      checks: async (p) => [await seesText(p, 'Positioning approved', 'Positioning approved')],
    });
    await j.step({
      did: 'Click "Continue" through Audience and Voice to Gate 3.',
      expected: 'Voice was approved against the old positioning, so it needs re-approval (brief journey 2: changing positioning after Gate 3 makes Voice need re-approval).',
      source: 'brief journey 2; ADR-012 decision 4 (approvals bound to an older Brain go stale)',
      action: async (p) => { for (let i = 0; i < 3; i++) { await click(cont(p)); await j.settle(); } },
      checks: async (p) => [await urlIs(p, 'On BB-Gate3-Voice', /BB-Gate3-Voice/), await seesText(p, 'Voice not shown as approved', 'Voice approved', { absent: true, actualFrom: (pp) => pp.getByText(/Voice approved|Approve your core voice/).first() })],
    });
    await j.step({
      did: 'Approve voice if asked, click "Continue", then "Approve kit v1".',
      expected: `Kit v1 for my brand approved and registered: version, hash, approver, Solana transaction (n-ob6).`,
      source: 'n-ob6',
      action: async (p) => {
        if (await btn(p, 'Approve voice').count()) { await click(btn(p, 'Approve voice')); await j.settle(); }
        await click(cont(p)); await j.settle();
        await click(p.getByRole('link', { name: 'Approve kit v1' }).or(p.getByRole('button', { name: 'Approve kit v1' })));
      },
      checks: async (p) => [
        await urlIs(p, 'On Onboard-6-Published', /Onboard-6-Published/),
        await namesEnteredBrand(p, 'Heading names my brand', p.locator('main h1, main h2').first()),
        await seesText(p, 'Transaction is real, not a placeholder', '[tx signature]', { absent: true, exact: true }),
        await seesText(p, 'Hash is real, not a placeholder', /^\[sha256/, { absent: true }),
      ],
    });
    await j.step({
      did: 'Click "Download the kit", then "Download .zip".',
      expected: `The zip holds the real kit: my approved positioning ("${NEW_POSITIONING}") and no placeholders (brief journey 2; n-kex).`,
      source: 'n-kex',
      action: async (p, jj) => {
        await click(p.getByRole('link', { name: /Download the kit/ })); await jj.settle();
        const [d] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), click(btn(p, 'Download .zip'))]);
        const file = path.join(jj.outDir, 'downloads', d.suggestedFilename());
        fs.mkdirSync(path.dirname(file), { recursive: true });
        await d.saveAs(file);
        const entries = unzipSync(new Uint8Array(fs.readFileSync(file)));
        const names = Object.keys(entries);
        const read = (suffix) => { const k = names.find((n) => n.endsWith(suffix)); return k ? strFromU8(entries[k]) : `(no ${suffix} in the zip)`; };
        const listing = names.join('\n');
        const positioning = read('05-positioning.md') + '\n--- MANIFEST.md\n' + read('MANIFEST.md');
        jj.downloads.push({ name: d.suggestedFilename(), bytes: fs.statSync(file).size, listing: listing + '\n--- 05-positioning.md\n' + positioning });
        jj.lastZipText = positioning;
      },
      checks: async (p, jj) => [
        { label: 'Zip contains my approved positioning', pass: (jj.lastZipText || '').includes(NEW_POSITIONING), actual: 'zip text: ' + q(jj.lastZipText, 300) },
        { label: 'Zip has no [placeholders]', pass: !/\[[^\]]+\]/.test(jj.lastZipText || ''), actual: 'zip text: ' + q(jj.lastZipText, 300) },
      ],
    });
  },
};
