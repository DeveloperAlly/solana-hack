// Journey 1 (POC): Main, then J1 to J8, driven only by clicks and typing.
import { seesText, controlState, urlIs, visibleText, q } from '../lib/harness.mjs';
import { SITE_BARE, HOST, EMAIL, btn, link, main, click, factSourcesFromSite, namesEnteredBrand } from './poc-common.mjs';

export async function firstRunSteps(j, { mobile = false } = {}) {
  const noHScroll = async (p) => {
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    return { label: 'No horizontal scroll', pass: r.sw <= r.cw, actual: `document scrollWidth ${r.sw}px, viewport ${r.cw}px` };
  };
  const extra = async (p) => (mobile ? [await noHScroll(p)] : []);

  await j.step({
    did: 'Open /screens/Main (first screen, by URL).',
    expected: 'Landing with a "Your website" field and "Read my site" (n-main).',
    source: 'n-main',
    action: (p) => p.goto(j.url('/screens/Main'), { waitUntil: 'networkidle' }),
    checks: async (p) => [
      await controlState(p, 'Website field', p.locator('input[type=url]'), 'present'),
      await controlState(p, '"Read my site"', btn(p, 'Read my site'), 'enabled'),
      ...(await extra(p)),
    ],
  });

  await j.step({
    did: `Type "${SITE_BARE}" in "Your website", click "Read my site".`,
    expected: `J1 Read says it is reading ${HOST}, and every fact card quotes a line from ${HOST} with a link to that page (n-j1-read; owner: "your brand from your site").`,
    source: 'n-j1-read',
    action: async (p) => { await p.locator('input[type=url]').first().fill(SITE_BARE); await click(btn(p, 'Read my site')); },
    focus: (p) => p.getByText('Positioning').first(),
    checks: async (p) => [
      await urlIs(p, 'On J1-Read', /J1-Read/),
      await seesText(p, `Heading names ${HOST}`, `Reading ${SITE_BARE}`),
      await factSourcesFromSite(p),
      await seesText(p, 'Each fact shows a quote', /^“/),
      ...(await extra(p)),
    ],
  });

  await j.step({
    did: 'Click "Keep these and continue".',
    expected: `J2 Save asks for email after showing value, and its summary is about ${HOST} (n-j2-save).`,
    source: 'n-j2-save',
    action: (p) => click(btn(p, 'Keep these and continue')),
    checks: async (p) => [
      await urlIs(p, 'On J2-Save', /J2-Save/),
      await controlState(p, 'Email field', p.locator('input[type=email]'), 'present'),
      await namesEnteredBrand(p, `Summary names ${HOST}`, p.getByText(/We found/)),
      ...(await extra(p)),
    ],
  });

  await j.step({
    did: `Type "${EMAIL}", click "Email me a sign-in link".`,
    expected: 'Confirmation that a link and code were sent to that address, with a code field (n-ob1).',
    source: 'n-j2-save, n-ob1',
    action: async (p) => { await p.locator('input[type=email]').first().fill(EMAIL); await click(btn(p, 'Email me a sign-in link')); },
    checks: async (p) => [
      await seesText(p, 'Names the address', `We sent a link and a code to ${EMAIL}`),
      await controlState(p, 'Code field', p.getByPlaceholder(/digit code/), 'present'),
    ],
  });

  await j.step({
    did: 'Click "Continue" with the code field empty.',
    expected: 'Stays on Save with an inline message about the code (n-ob1 STATES: wrong code inline).',
    source: 'n-ob1',
    action: (p) => click(btn(p, 'Continue', true)),
    checks: async (p) => [
      await urlIs(p, 'Still on J2-Save', /J2-Save/),
      await seesText(p, 'Inline message about the code', /enter (the|your) code|code (is|must)|\d+ digits|wrong code|invalid/i, { actualFrom: (pp) => pp.getByText(/Got the code instead/).locator('xpath=..') }),
    ],
  });

  await j.step({
    did: 'Type an 8-digit code "12345678", click "Continue".',
    expected: `J3 Confirm: signed in as the entered email; prefilled cards with quotes from ${HOST}; Accept / Edit / Reject (n-j3-confirm).`,
    source: 'n-j3-confirm',
    action: async (p) => { await p.getByPlaceholder(/digit code/).fill('12345678'); await click(btn(p, 'Continue', true)); },
    focus: (p) => p.getByText('Kit readiness'),
    checks: async (p) => [
      await urlIs(p, 'On J3-Confirm', /J3-Confirm/),
      await seesText(p, `Signed-in label shows ${EMAIL.split('@')[0]}`, new RegExp(EMAIL.split('@')[0]), { actualFrom: (pp) => pp.getByText(/signed in/) }),
      await factSourcesFromSite(p),
      await controlState(p, '"Answer 2 questions" disabled until cards are decided', btn(p, 'Answer 2 questions'), 'disabled'),
    ],
  });

  await j.step({
    did: 'Click "Accept" on each of the 4 fact cards.',
    expected: 'Each card shows Accepted; readiness rises; "Answer 2 questions" enables (n-j3-confirm).',
    source: 'n-j3-confirm',
    action: async (p) => { for (let i = 0; i < 4; i++) await click(btn(p, 'Accept', true)); },
    focus: (p) => p.getByText('Kit readiness'),
    checks: async (p) => [
      await seesText(p, 'Readiness shown', /Kit readiness \d+%/),
      await seesText(p, 'Count confirmed', /4 confirmed/),
      await controlState(p, '"Answer 2 questions" enabled', btn(p, 'Answer 2 questions'), 'enabled'),
    ],
  });

  await j.step({
    did: 'Click "Answer 2 questions".',
    expected: `J4 asks only the missing questions, about ${HOST}; voice paragraphs written from ${HOST} (n-j4-gaps-voice).`,
    source: 'n-j4-gaps-voice',
    action: (p) => click(btn(p, 'Answer 2 questions')),
    checks: async (p) => [
      await urlIs(p, 'On J4-Gaps-Voice', /J4-Gaps-Voice/),
      await namesEnteredBrand(p, `Question 1 names ${HOST}`, p.getByText(/What do people use instead of/)),
      await namesEnteredBrand(p, `Voice paragraph B is written from ${HOST}`, p.getByText(/^I built/)),
    ],
  });

  await j.step({
    did: 'Pick "Pressmaster", answer both questions, choose paragraph B, click "Next round".',
    expected: 'Round 2 of 2 shows three paragraphs narrowed around the round 1 pick (n-j4-gaps-voice: pick 1 of 3 paragraphs written from the site, twice).',
    source: 'n-j4-gaps-voice',
    action: async (p) => {
      await click(btn(p, 'Pressmaster'));
      await p.locator('main textarea').nth(0).fill('I connect systems thinking with product.');
      await p.locator('main textarea').nth(1).fill('Because brands deserve proof.');
      await p.locator('input[value=b]').check();
      await click(btn(p, 'Next round'));
    },
    focus: (p) => p.getByText(/Round 2 of 2/),
    checks: async (p) => [
      await seesText(p, 'Round 2 shown', /Round 2 of 2/),
      await seesText(p, 'Round 2 paragraphs are real text, not placeholders', /^\[Round 2 paragraph/, { absent: true }),
    ],
  });

  await j.step({
    did: 'Choose round-2 paragraph B, click "Review my kit".',
    expected: 'J5 shows 3 gates; "Approve and register kit v1" disabled with 0 of 3 approved (n-j5-approve-kit, n-g1).',
    source: 'n-j5-approve-kit',
    action: async (p) => { await p.locator('input[value=r2-b]').check(); await click(btn(p, 'Review my kit')); },
    checks: async (p) => [
      await urlIs(p, 'On J5-Approve-Kit', /J5-Approve-Kit/),
      await controlState(p, 'Register disabled before gates', btn(p, 'Approve and register kit v1'), 'disabled'),
      await seesText(p, 'Reason shown', /0 of 3 approved/),
      await seesText(p, 'Gate 2 carries my answers', /Unlike Pressmaster, I connect systems thinking/),
      await namesEnteredBrand(p, `Positioning names ${HOST}`, p.getByText(/^For \[audience\]/)),
    ],
  });

  await j.step({
    did: 'Click "Approve" on Gate 1, Gate 2 and Gate 3.',
    expected: 'Each gate records who and when; the approved positioning is the text I reviewed; register enables (n-g1, n-g2).',
    source: 'n-g1, n-g2, n-j5-approve-kit',
    action: async (p) => { for (let i = 0; i < 3; i++) await click(btn(p, 'Approve', true)); },
    checks: async (p) => [
      await seesText(p, 'All approved', 'All 3 gates approved.'),
      await seesText(p, 'Approval records who and when', /Approved by .+ UTC/),
      await seesText(p, 'Approved Gate 2 still carries my answers', /Unlike Pressmaster, I connect systems thinking/, { actualFrom: (pp) => pp.getByText(/^For \[audience\]/) }),
      await controlState(p, 'Register enabled', btn(p, 'Approve and register kit v1'), 'enabled'),
    ],
  });

  await j.step({
    did: 'Click "Change" on Gate 2 (Positioning), edit the text, click "Save".',
    expected: 'Gate 2 is no longer approved and register disables; Voice (Gate 3), approved after the old positioning, needs re-approval (brief: an edit after approval makes the approval stale).',
    source: 'brief journeys 1-2; n-g1',
    action: async (p) => {
      await click(p.getByRole('button', { name: 'Change' }).nth(1));
      await click(btn(p, 'Edit', true));
      await p.locator('main textarea').first().fill('For founders who need proof, the brand is a kit that shows its sources.');
      await click(btn(p, 'Save', true));
    },
    checks: async (p) => [
      await controlState(p, 'Register disabled after edit', btn(p, 'Approve and register kit v1'), 'disabled'),
      await seesText(p, 'Approval count dropped', /[0-2] of 3 approved/),
      await seesText(p, 'Voice asks for re-approval', /1 of 3 approved/, { actualFrom: (pp) => pp.getByText(/of 3 approved|All 3 gates/) }),
    ],
  });

  await j.step({
    did: 'Approve the gates again, click "Approve and register kit v1".',
    expected: 'Kit v1 shown as registered; J6 first post drafted from kit v1 for my brand, claims linked to evidence (n-j5, n-j6-first-post).',
    source: 'n-j5-approve-kit, n-j6-first-post',
    action: async (p) => {
      while (await btn(p, 'Approve', true).count()) await click(btn(p, 'Approve', true));
      await click(btn(p, 'Approve and register kit v1'));
    },
    checks: async (p) => [
      await urlIs(p, 'On J6-First-Post', /J6-First-Post/),
      await seesText(p, 'Kit registered shown', /Kit v1 registered/),
      await seesText(p, 'Claims backed', /Claims: \d+ of \d+ backed/),
      await namesEnteredBrand(p, `Draft is about ${HOST}`, p.getByText(/Every brand tool I tried/)),
    ],
  });

  await j.step({
    did: 'Click "Approve and register".',
    expected: 'J7: post registered, record with kit version, approver, hash and an explorer link; "Official" (n-j7-proof: "Registration record with explorer link (built)").',
    source: 'n-j7-proof',
    action: (p) => click(btn(p, 'Approve and register', true)),
    checks: async (p) => [
      await urlIs(p, 'On J7-Proof', /J7-Proof/),
      await seesText(p, 'Registered heading', 'Your first post is registered'),
      await seesText(p, 'Official shown', 'Official', { exact: true }),
      await seesText(p, 'Transaction is a real link, not a placeholder', /^\[explorer link/, { absent: true }),
      await seesText(p, 'Hash is real, not a placeholder', '[sha256]', { absent: true, exact: true }),
    ],
  });

  await j.step({
    did: 'In "Check a post", change "waits for you to approve" to "posts for you automatically", click "Check".',
    expected: 'The edited copy is not shown as Official (n-j7-proof: an edited copy shows "Not an official post").',
    source: 'n-j7-proof, n-v2',
    action: async (p) => {
      const ta = p.locator('main textarea').first();
      const v = await ta.inputValue();
      await ta.fill(v.replace('waits for you to approve', 'posts for you automatically') + ' edited');
      await click(btn(p, 'Check', true));
    },
    checks: async (p) => [
      await seesText(p, '"Not an official post" shown', /Not an official post|not found|No match/i, { actualFrom: (pp) => pp.getByText(/^Official$/) }),
    ],
  });

  await j.step({
    did: 'Click "Plan the rest of my week".',
    expected: `First-run hub for ${HOST}: checklist, next best post, public record; ADR-012 decision 6: ends on Today showing "3 of 6 steps live" (n-j8-hub-firstrun).`,
    source: 'n-j8-hub-firstrun; ADR-012 decision 6',
    action: (p) => click(link(p, 'Plan the rest of my week')),
    checks: async (p) => [
      await urlIs(p, 'On the first-run hub', /J8-Hub-FirstRun|Today/),
      await seesText(p, 'Setup checklist', /Get set up/),
      await namesEnteredBrand(p, `Welcomes ${HOST}`, p.getByText(/^Welcome,/)),
      await seesText(p, '"3 of 6 steps live" shown', /3 of 6 steps live/),
      ...(await extra(p)),
    ],
  });
}

export default {
  id: 'poc-1-first-run',
  title: 'First run: landing to a verifiable first post (Main, J1 to J8)',
  section: 'poc',
  target: 'preview',
  requires: ['Main', 'J1-Read', 'J2-Save', 'J3-Confirm', 'J4-Gaps-Voice', 'J5-Approve-Kit', 'J6-First-Post', 'J7-Proof', 'J8-Hub-FirstRun'],
  run: (j) => firstRunSteps(j),
};
