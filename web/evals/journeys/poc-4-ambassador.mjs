// Journey 4 (POC): Grow, ambassador. Join, generate, publish, verifying, paid.
import { seesText, controlState, urlIs, visibleText, q } from '../lib/harness.mjs';
import { EMAIL, btn, link, click } from './poc-common.mjs';

export async function counter(p) { return (await p.getByText(/\d[\d,]* (\/ [\d,]+ )?characters/).first().innerText().catch(() => '(no counter)')).trim(); }

export default {
  id: 'poc-4-ambassador',
  title: 'Grow, ambassador: join, generate, publish, verifying, paid',
  section: 'poc',
  target: 'preview',
  requires: ['Amb-1-Campaigns', 'Amb-2-Detail', 'Amb-3-Generate', 'Amb-4-Publish', 'Amb-5a-Verifying', 'Amb-5b-Paid'],
  async run(j) {
    await j.step({
      did: 'Open /screens/Amb-1-Campaigns (first screen, by URL).',
      expected: 'Campaigns listed; a "Budget reached" campaign stays visible but closed, with no way to join (n-a1).',
      source: 'n-a1',
      action: (p) => p.goto(j.url('/screens/Amb-1-Campaigns'), { waitUntil: 'networkidle' }),
      focus: (p) => p.getByText('Budget reached'),
      checks: async (p) => {
        const card = p.getByText('Budget reached').first().locator('xpath=ancestor::*[.//a or .//button][1]');
        const joinable = await card.getByRole('link', { name: /^View/ }).count();
        return [await seesText(p, 'Budget reached shown', /Closed to new posts/), { label: 'Budget-reached campaign cannot be opened to join', pass: joinable === 0, actual: `card text ${await visibleText(card, 200)}; View links on card: ${joinable}` }];
      },
    });
    await j.step({
      did: 'Click "View" on "aDNA launch week".',
      expected: 'Brief, formats, rules and budget; joining needs email sign-in inline (n-a2).',
      source: 'n-a2',
      action: (p) => click(p.getByRole('link', { name: /^View/ }).first()),
      checks: async (p) => [await urlIs(p, 'On Amb-2-Detail', /Amb-2-Detail/), await seesText(p, 'Inline sign-in to join', 'Sign in with email to join')],
    });
    await j.step({
      did: `Type "${EMAIL}", click "Email me a code", type the 8-digit code "12345678", click "Join and start writing".`,
      expected: 'The 8-digit code the project sends is accepted, as on every other sign-in (n-ob1: the project sends 8 digits; the app accepts 6 to 10).',
      source: 'n-ob1, n-j2-save',
      action: async (p) => {
        await p.locator('main input[type=email]').fill(EMAIL); await click(btn(p, 'Email me a code')); await j.settle();
        await p.locator('main input').last().fill('12345678'); await click(btn(p, 'Join and start writing'));
      },
      continueOnError: true,
      checks: async (p) => [await urlIs(p, 'Joined (on Amb-3-Generate)', /Amb-3-Generate/), await seesText(p, 'No digits error', /The code is 6 digits/, { absent: true })],
    });
    await j.step({
      did: 'If still on the join form, replace the code with "123456" and click "Join and start writing".',
      expected: 'Joined; the writer opens on a LinkedIn piece with a character limit for LinkedIn (n-a3).',
      source: 'n-a3',
      action: async (p) => {
        if (/Amb-2-Detail/.test(p.url())) { await p.locator('main input').last().fill('123456'); await click(btn(p, 'Join and start writing')); }
      },
      checks: async (p) => [await urlIs(p, 'On Amb-3-Generate', /Amb-3-Generate/), { label: 'LinkedIn counter shows a limit', pass: /\/ 3,?000 characters/.test(await counter(p)), actual: q(await counter(p)) }],
    });
    await j.step({
      did: 'Change Format to "Tutorial · 50 USDC", then back to "LinkedIn post · 10 USDC".',
      expected: 'The character limit follows the channel: none shown for a blog tutorial, LinkedIn\'s limit for LinkedIn (brief journey 4).',
      source: 'brief journey 4',
      action: async (p, jj) => { await p.locator('main select').selectOption('tutorial'); await jj.settle(); jj.tutorialCounter = await counter(p); await p.locator('main select').selectOption('linkedin'); },
      checks: async (p, jj) => [
        { label: 'Tutorial has no LinkedIn limit', pass: !/\//.test(jj.tutorialCounter), actual: 'tutorial ' + q(jj.tutorialCounter) },
        { label: 'LinkedIn limit back', pass: /\/ 3,?000/.test(await counter(p)), actual: 'linkedin ' + q(await counter(p)) },
      ],
    });
    await j.step({
      did: 'Look at "Continue to publish" before fixing flags.',
      expected: 'Publish is blocked below 80% on-brand, with a banned claim or a missing disclosure, and says why (n-a3).',
      source: 'n-a3',
      action: async () => {},
      focus: (p) => btn(p, 'Continue to publish'),
      checks: async (p) => [await controlState(p, 'Blocked', btn(p, 'Continue to publish'), 'disabled'), await seesText(p, 'Reason', /^Fix first:/)],
    });
    await j.step({
      did: 'Click "Remove line", "Replace" and "Add at end" on the three flags.',
      expected: 'Flags cleared; "Continue to publish" enables (n-a3).',
      source: 'n-a3',
      action: async (p) => { for (const n of [/Remove line/, /Replace/, /Add at end/]) await click(p.getByRole('button', { name: n }).first()); },
      checks: async (p) => [await controlState(p, 'Continue enabled', btn(p, 'Continue to publish'), 'enabled'), await seesText(p, 'History records edits', /History \(3\)/)],
    });
    await j.step({
      did: 'Click "Continue to publish".',
      expected: 'Publish routes: post for me, or paste the LinkedIn URL; no X route (n-a4).',
      source: 'n-a4',
      action: (p) => click(btn(p, 'Continue to publish')),
      checks: async (p) => [await urlIs(p, 'On Amb-4-Publish', /Amb-4-Publish/), await controlState(p, 'Paste URL field', p.locator('main input[type=url]'), 'present'), await seesText(p, 'No paid X route', /X posts aren't paid/)],
    });
    await j.step({
      did: 'Type "https://www.linkedin.com/posts/evals-123", click "Submit URL".',
      expected: 'Status steps: Submitted, Verifying, Approved, Paid (n-a5a).',
      source: 'n-a5a',
      action: async (p) => { await p.locator('main input[type=url]').fill('https://www.linkedin.com/posts/evals-123'); await click(btn(p, 'Submit URL')); },
      checks: async (p) => [await urlIs(p, 'On Amb-5a-Verifying', /Amb-5a-Verifying/), await seesText(p, 'Verifying in progress', /Verifying…/)],
    });
    await j.step({
      did: 'Click the outcome "Approved and paid".',
      expected: 'Paid: amount, receipt link and my post URL (n-a5b).',
      source: 'n-a5b',
      action: (p) => click(link(p, 'Approved and paid')),
      checks: async (p) => [await seesText(p, 'Paid', /Paid 10 USDC/), await seesText(p, 'My post URL shown', 'https://www.linkedin.com/posts/evals-123'), await controlState(p, 'Receipt', btn(p, 'View onchain receipt'), 'present')],
    });
    await j.step({
      did: 'Click "Campaigns" in the ambassador tabs, then "View" on "aDNA launch week".',
      expected: 'A signed-in ambassador joins without a code (brief journey 4).',
      source: 'brief journey 4',
      action: async (p) => { await click(link(p, 'Campaigns', true)); await j.settle(); await click(p.getByRole('link', { name: /^View/ }).first()); },
      checks: async (p) => [await seesText(p, 'No sign-in prompt', 'Sign in with email to join', { absent: true }), await controlState(p, 'No code request', btn(p, 'Email me a code'), 'absent')],
    });
  },
};
