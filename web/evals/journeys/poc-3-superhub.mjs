// Journey 3 (POC): Create to review to publish to Verify (Superhub).
import { seesText, controlState, urlIs, visibleText, q } from '../lib/harness.mjs';
import { btn, link, click } from './poc-common.mjs';

export default {
  id: 'poc-3-superhub',
  title: 'Superhub: create, review, publish, Verify',
  section: 'poc',
  target: 'preview',
  requires: ['Today', 'Draft-Review', 'Content-Dashboard', 'Verify-Home', 'Verify-1-Match'],
  async run(j) {
    let todayDraft = '';
    await j.step({
      did: 'Open /screens/Today (first screen, by URL).',
      expected: 'One approval queue; the blog draft with an unsourced claim cannot be approved and says why (n-dr claims gate; ADR-012 decision 1).',
      source: 'ADR-012 decision 1; n-dr',
      action: (p) => p.goto(j.url('/screens/Today'), { waitUntil: 'networkidle' }),
      focus: (p) => p.getByText(/Blocked: 1 claim/),
      checks: async (p) => {
        todayDraft = (await p.getByText(/^"Your agent didn/).first().innerText().catch(() => '')).trim();
        const card = p.getByText(/Blocked: 1 claim needs a source/).locator('xpath=ancestor::*[.//button][1]');
        return [
          await seesText(p, 'Visible reason on the blocked draft', /Blocked: 1 claim needs a source/),
          await controlState(p, 'Its Approve is disabled', card.getByRole('button', { name: 'Approve', exact: true }), 'disabled'),
        ];
      },
    });
    await j.step({
      did: 'On the first draft card ("Your agent didn\'t forget…"), click "Edit".',
      expected: 'Draft-Review opens on that same draft (brief: Draft-Review opened from Home shows the right draft).',
      source: 'brief journey 3',
      action: (p) => click(link(p, 'Edit', true)),
      checks: async (p) => {
        const body = await p.locator('main textarea').first().inputValue().catch(() => '');
        return [await urlIs(p, 'On Draft-Review', /Draft-Review/), { label: 'Editor holds the draft clicked on Today', pass: todayDraft.length > 0 && body.includes(todayDraft.replace(/^"|"$/g, '').slice(0, 30)), actual: `Today card ${q(todayDraft)}; editor ${q(body)}` }];
      },
    });
    await j.step({
      did: 'Click "Create" in the nav, then "Review" on the Blog draft "Why agents need shared project context".',
      expected: 'The same unsourced-claim block shows in review: claims gate fails with a reason and Approve stays disabled even after choosing a route (n-dr checks: claims gate).',
      source: 'n-dr, n-j6-first-post (unsupported claims blocked before Approve)',
      action: async (p) => {
        await click(p.getByRole('link', { name: 'Create', exact: true }).first()); await j.settle();
        await click(p.getByText('"Why agents need shared project context"').locator('xpath=ancestor::*[.//button[normalize-space()="Review"]][1]').getByRole('button', { name: 'Review' }));
        await j.settle();
        const r = p.locator('input[value=manual]'); if (await r.count()) await r.check();
      },
      focus: (p) => p.getByText('Claims gate'),
      checks: async (p) => [
        await seesText(p, 'Claims gate does not pass', /Pass · 0 unapproved claims/, { absent: true, actualFrom: (pp) => pp.getByText(/Claims gate/).locator('xpath=..') }),
        await controlState(p, 'Approve disabled after choosing a route', btn(p, 'Approve', true), 'disabled'),
      ],
    });
    await j.step({
      did: 'Click "← Back to drafts awaiting approval", "Review" on the X draft, choose "Copy, post it yourself, paste the URL back", click "Approve".',
      expected: 'Approved on the manual route, status "Awaiting the post URL" (brief journey 3).',
      source: 'brief journey 3; n-dr Publish',
      action: async (p) => {
        await click(link(p, 'Back to drafts awaiting approval')); await j.settle();
        await click(p.getByText('"Your agent didn\'t forget').locator('xpath=ancestor::*[.//button][1]').getByRole('button', { name: /Review/ })); await j.settle();
        await p.locator('input[value=manual]').check();
        await click(btn(p, 'Approve', true));
      },
      focus: (p) => p.getByText('Awaiting the post URL'),
      checks: async (p) => [await seesText(p, 'Awaiting the post URL', 'Awaiting the post URL'), await controlState(p, 'Post URL field', p.getByLabel('Post URL'), 'present')],
    });
    await j.step({
      did: 'Click "Save the post URL" with the field empty.',
      expected: 'Still "Awaiting the post URL", with a hint to paste the link.',
      source: 'brief journey 3',
      action: (p) => click(btn(p, 'Save the post URL')),
      checks: async (p) => [await seesText(p, 'Still awaiting URL', 'Awaiting the post URL'), await seesText(p, 'Hint shown', /Paste the full https link/)],
    });
    await j.step({
      did: 'Type "https://x.com/evals/status/1" in Post URL, click "Save the post URL".',
      expected: 'Status moves from "Awaiting the post URL" to posted.',
      source: 'brief journey 3',
      action: async (p) => { await p.getByLabel('Post URL').fill('https://x.com/evals/status/1'); await click(btn(p, 'Save the post URL')); },
      checks: async (p) => [await seesText(p, 'No longer awaiting URL', 'Awaiting the post URL', { absent: true }), await seesText(p, 'Posted', 'Posted', { exact: true })],
    });
    await j.step({
      did: 'Click "Register on Solana".',
      expected: 'Post registered; the text is locked (n-dr: approve and publish registers the hash, kit version and approver, then goes to Verify).',
      source: 'n-dr',
      action: (p) => click(btn(p, 'Register on Solana')),
      checks: async (p) => [await seesText(p, 'Registered', /Registered on Solana/), await controlState(p, 'Link to check it on Verify', p.locator('main').getByRole('link', { name: /Check it on Verify/ }), 'present')],
    });
    let registered = '';
    await j.step({
      did: 'Click "Check it on Verify", then "Check".',
      expected: 'Verify is prefilled with the post just registered and shows a match (n-v1; n-dr: registering then goes to Verify).',
      source: 'n-v1, n-dr',
      action: async (p) => {
        registered = await p.locator('main textarea').first().inputValue().catch(() => '');
        await click(p.locator('main').getByRole('link', { name: /Check it on Verify/ })); await j.settle();
        await click(btn(p, 'Check', true));
      },
      checks: async (p) => {
        const v = await p.locator('main textarea').first().inputValue().catch(() => '');
        return [
          await urlIs(p, 'On Verify', /Verify/),
          { label: 'Verify checks the post just registered', pass: !!registered && v.trim() === registered.replace(/\u200b/g, '').trim(), actual: `registered ${q(registered)}; Verify text ${q(v)}` },
          await seesText(p, 'Match shown', /Brand-approved: yes/),
        ];
      },
    });
    await j.step({
      did: 'Add " Buy now." to the end of the text, click "Check".',
      expected: 'No match: edited text is not official (brief journey 3; n-j7-proof: Verify checks exact matches only, the edited-copy diff is coming soon).',
      source: 'brief journey 3; n-j7-proof',
      action: async (p) => { const ta = p.locator('main textarea').first(); await ta.fill((await ta.inputValue()) + ' Buy now.'); await click(btn(p, 'Check', true)); },
      checks: async (p) => [
        await seesText(p, 'Not shown as brand-approved', /Brand-approved: yes/, { absent: true }),
        await (async () => { const h = await visibleText(p.locator('main h2').first()); return { label: 'Result says no match', pass: /Not found|No match|Not an official post/i.test(h), actual: 'result heading ' + h }; })(),
      ],
    });
  },
};
