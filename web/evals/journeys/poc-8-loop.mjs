// Journey 8 (POC): the ADR-012 loop screens from PRs #102 and #111, driven from Today by clicking.
import { seesText, controlState, urlIs, visibleText, q } from '../lib/harness.mjs';
import { btn, link, click } from './poc-common.mjs';

const navTo = (p, label) => click(p.getByRole('link', { name: label, exact: true }).first());

export default {
  id: 'poc-8-loop',
  title: 'The loop (ADR-012): Today, Post-Detail, Brain, Learn-Rules, Verify, Grow, Events, Quests, Distribute',
  section: 'poc',
  target: 'preview',
  requires: ['Today', 'Brain', 'Post-Detail', 'Learn-Rules', 'Verify-Home', 'Grow-Home', 'Events', 'Distribute-Adapt', 'Quests', 'Events-Board'],
  async run(j) {
    await j.step({
      did: 'Open /screens/Today (first screen, by URL).',
      expected: 'A queue of decisions, a strip of the six steps with a count of live steps ("N of 6 steps live"), and one-tap approve on each item (ADR-012 decision 1).',
      source: 'ADR-012 decision 1',
      action: (p) => p.goto(j.url('/screens/Today'), { waitUntil: 'networkidle' }),
      checks: async (p) => [
        await seesText(p, 'Live-step count', /\d of 6 steps live/),
        await seesText(p, 'Six steps named in order', /1 Brand[\s\S]*2 Create[\s\S]*3 Distribute[\s\S]*4 Verify[\s\S]*5 Grow[\s\S]*6 Learn/, { actualFrom: (pp) => pp.getByText('Where aDNA is in the loop').locator('xpath=..') }).then(async () => { const t = await p.locator('main').innerText(); const ok = /1 Brand[\s\S]*2 Create[\s\S]*3 Distribute[\s\S]*4 Verify[\s\S]*5 Grow[\s\S]*6 Learn/.test(t); return { label: 'Six steps named in order', pass: ok, actual: q((t.match(/1 Brand[\s\S]*?6 Learn/) || ['(not found)'])[0], 200) }; }),
        await seesText(p, 'Queue count', /Needs you · \d+/),
      ],
    });
    await j.step({
      did: 'Click "Approve" on the first draft card.',
      expected: 'One tap approves it: the item leaves the queue or shows Approved, and the count drops (ADR-012 decision 1).',
      source: 'ADR-012 decision 1',
      action: async (p, jj) => { jj.before = await visibleText(p.getByText(/Needs you · \d+/)); await click(btn(p, 'Approve', true)); },
      checks: async (p, jj) => {
        const after = await visibleText(p.getByText(/Needs you · \d+/));
        return [{ label: 'Queue count dropped', pass: after !== jj.before && !/not on page/.test(after), actual: `before ${jj.before}; after ${after}` }];
      },
    });
    await j.step({
      did: 'Click "Why this?" on a draft card.',
      expected: 'Post detail for that post: a six-step lifecycle strip (drafted, approved, published, verified, amplified, results) and "Why this?" listing the facts, voice and rules used (ADR-012 decisions 3 and 4).',
      source: 'ADR-012 decisions 3, 4',
      action: (p) => click(link(p, 'Why this?')),
      checks: async (p) => {
        const t = await p.locator('main').innerText();
        return [
          await urlIs(p, 'On Post-Detail', /Post-Detail/),
          { label: 'Lifecycle strip has the six steps', pass: ['Drafted', 'Approved', 'Published', 'Verified', 'Amplified', 'Results'].every((s) => t.includes(s)), actual: q((t.match(/This post, through the loop[\s\S]*?Results/) || ['(not found)'])[0], 300) },
          await seesText(p, '"Why this?" section shown', /Why this\?/, { actualFrom: (pp) => pp.locator('main h2, main h3').first() }),
        ];
      },
    });
    await j.step({
      did: 'Click "Open the Brain".',
      expected: 'The Brain holds the kit, voice, audience, proof sources and learned rules (ADR-012 decision 4).',
      source: 'ADR-012 decision 4',
      action: (p) => click(link(p, 'Open the Brain')),
      checks: async (p) => {
        const t = await p.locator('main').innerText();
        const parts = { kit: /\bKit\b/.test(t), voice: /Voices?/.test(t), audience: /Audience/i.test(t), 'proof sources': /Facts with receipts|sources/i.test(t), 'learned rules': /Learned rules/.test(t) };
        return [await urlIs(p, 'On Brain', /Brain/), { label: 'All five parts present', pass: Object.values(parts).every(Boolean), actual: Object.entries(parts).map(([k, v]) => `${k}: ${v ? 'shown' : 'not shown'}`).join(', ') }];
      },
    });
    await j.step({
      did: 'Click "Evidence" on the first suggested rule.',
      expected: 'Learn-Rules: the proposal\'s source and evidence, a small-sample warning, and Approve per rule (ADR-012 runtime 3).',
      source: 'ADR-012 runtime 3',
      action: (p) => click(link(p, 'Evidence', true)),
      checks: async (p) => [await urlIs(p, 'On Learn-Rules', /Learn-Rules/), await seesText(p, 'Signal source named', /Signal: /), await seesText(p, 'Small-sample warning', /sample is small/), await controlState(p, 'Approve rule', btn(p, 'Approve rule'), 'enabled')],
    });
    await j.step({
      did: 'Click "Approve rule" on the first rule.',
      expected: 'The rule is approved into the Brain (v3.1 to v3.2) and leaves the waiting count (ADR-012 decision 4).',
      source: 'ADR-012 decision 4',
      action: async (p, jj) => { jj.before = await visibleText(p.getByText(/\d+ waiting/)); await click(btn(p, 'Approve rule')); },
      checks: async (p, jj) => { const after = await visibleText(p.getByText(/\d+ waiting/)); return [{ label: 'Waiting count dropped', pass: after !== jj.before, actual: `before ${jj.before}; after ${after}` }, await seesText(p, 'Approval recorded', /Approved|Active|Brain v3\.2/, { actualFrom: (pp) => pp.locator('main article, main section').first() })]; },
    });
    await j.step({
      did: 'Click "Verify" in the nav.',
      expected: 'Your proof: what is registered and who checked it (ADR-012 decision 5).',
      source: 'ADR-012 decisions 2, 5',
      action: (p) => navTo(p, 'Verify'),
      checks: async (p) => [await urlIs(p, 'On Verify-Home', /Verify-Home/), await seesText(p, 'Registered records', /Registered records/), await seesText(p, 'Checks by others', /Checks by others/)],
    });
    await j.step({
      did: 'Click "Grow" in the nav, then the "Events" tab.',
      expected: 'Events with a role (hosting, speaking, sponsoring, attending), campaign, content plan and ambassadors going (ADR-012 decision 8).',
      source: 'ADR-012 decision 8',
      action: async (p) => { await navTo(p, 'Grow'); await j.settle(); await click(p.getByRole('link', { name: 'Events', exact: true }).first()); },
      checks: async (p) => [await urlIs(p, 'On Events', /\/Events$/), await seesText(p, 'Role column', /Speaking/), await seesText(p, 'Content plan column', /posts ready/)],
    });
    await j.step({
      did: 'Click the event "[Conference] side event: agent tooling night".',
      expected: 'Event detail: role, a content plan made of ordinary drafts (announce, countdown, live, recap, follow up), ambassadors going (ADR-012 decision 8).',
      source: 'ADR-012 decision 8',
      action: (p) => click(p.getByRole('link', { name: /agent tooling night/ }).first()),
      checks: async (p) => { const t = await p.locator('main').innerText(); return [await urlIs(p, 'On Event-Detail', /Event-Detail/), { label: 'Content plan stages', pass: ['announce', 'countdown', 'live', 'recap', 'follow'].every((s) => t.toLowerCase().includes(s)), actual: q((t.match(/Content plan[\s\S]{0,300}/i) || [t.slice(0, 300)])[0], 300) }]; },
    });
    await j.step({
      did: 'Press Back, then click "Events board".',
      expected: 'Public board: ratings registered vs shown, and how removals leave a tombstone (ADR-012 decision 8).',
      source: 'ADR-012 decision 8',
      action: async (p) => { await p.goBack(); await j.settle(); await click(link(p, 'Events board')); },
      checks: async (p) => [await urlIs(p, 'On Events-Board', /Events-Board/), await seesText(p, 'Registered vs shown counts', /\d+ registered · \d+ shown/), await seesText(p, 'Removal leaves a public note', /leaves a public note/)],
    });
    await j.step({
      did: 'Click "Grow" in the nav and look for Quests in the Grow tabs or page.',
      expected: 'Quests is reachable from Grow (ADR-012 decision 2 table: Grow holds Quests).',
      source: 'ADR-012 decision 2',
      action: async (p) => { await p.goBack(); await j.settle(); await navTo(p, 'Grow'); await j.settle(); const qq = p.getByRole('link', { name: /Quests/ }); if (await qq.count()) await click(qq); },
      checks: async (p) => [await urlIs(p, 'On Quests', /Quests/)],
      continueOnError: true,
    });
    await j.step({
      did: 'Click "Distribute" in the nav, then the "Adapt and schedule" tab.',
      expected: 'One approved post with a version per platform, each with that platform\'s limit and its own approval (ADR-012 decision 2: Distribute-Adapt).',
      source: 'ADR-012 decision 2',
      action: async (p) => { await navTo(p, 'Distribute'); await j.settle(); await click(link(p, 'Adapt and schedule')); },
      checks: async (p) => [await urlIs(p, 'On Distribute-Adapt', /Distribute-Adapt/), await seesText(p, 'X limit', /\d+ \/ 280/), await seesText(p, 'LinkedIn limit', /\d+ \/ 3000/)],
    });
  },
};
