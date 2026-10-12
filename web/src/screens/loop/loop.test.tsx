import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup as cleanupScreens, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { renderWithRouter } from '../../test/render';
import { loopStore } from '../../flows/loop/store';
import { resetActiveBrand, selectBrand } from '../../flows/brand/activeBrand';
import { Today } from './Today';
import { MToday } from './MToday';
import { Brain } from './Brain';
import { LearnRules } from './LearnRules';
import { PostDetail } from './PostDetail';
import { VerifyHome } from './VerifyHome';
import { screens } from './registry';
import { brainScreen, learnRules, learnRulesCollecting, postDetail, today, verifyHome } from './fixtures';

vi.mock('../../lib/supabase', () => ({ supabase: null }));
beforeEach(() => {
  loopStore.reset();
  resetActiveBrand();
});

const queueRow = (text: RegExp) => screen.getAllByRole('listitem').find((li) => text.test(li.textContent ?? ''))!;

describe('Today', () => {
  it('opens on the queue, with the one nav and Today current', () => {
    renderWithRouter(<Today data={today} />);
    expect(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: 'Needs you · 7' })).toBeInTheDocument();
    expect(screen.getByText('5 of 6 steps live · Learn starts after 14 days of results')).toBeInTheDocument();
  });

  it('the filter changes the list', async () => {
    renderWithRouter(<Today data={today} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Show' }), 'reply');
    const list = screen.getByRole('list', { name: 'Needs you' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(within(list).getByText(/A likely lead asked/)).toBeInTheDocument();
  });

  it('a blocking check disables Approve, and its badge says why', () => {
    renderWithRouter(<Today data={today} />);
    const blog = queueRow(/Why agents need shared project context/);
    expect(within(blog).getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(within(blog).getByText(/Blocked: 1 claim needs a source/)).toBeInTheDocument();
  });

  it('Send and Approve and pay change state and the count', async () => {
    renderWithRouter(<Today data={today} />);
    await userEvent.click(within(queueRow(/A likely lead/)).getByRole('button', { name: 'Send' }));
    expect(within(queueRow(/A likely lead/)).getByText('Sent.')).toBeInTheDocument();
    await userEvent.click(within(queueRow(/LinkedIn post is live/)).getByRole('button', { name: 'Approve and pay' }));
    expect(screen.getByText('Approved. The 10 USDC payout is queued.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Needs you · 5' })).toBeInTheDocument();
  });

  it('a draft approval covers its check results: a changed check makes it stale, and the gate blocks re-approval', async () => {
    const { rerender } = renderWithRouter(<Today data={today} />);
    await userEvent.click(within(queueRow(/Your agent didn't forget/)).getByRole('button', { name: 'Approve' }));
    expect(within(queueRow(/Your agent didn't forget/)).getByText(/It publishes on its schedule/)).toBeInTheDocument();
    const failed = { ...today, queue: today.queue.map((i) => (i.id === 'q-draft-x' && i.kind === 'draft' ? { ...i, checks: { ...i.checks, slop: 'failed' as const } } : i)) };
    rerender(<MemoryRouter><Today data={failed} /></MemoryRouter>);
    const row = queueRow(/Your agent didn't forget/);
    expect(within(row).getByText(/approval went stale/)).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(within(row).getByText(/Blocked: Failed the no-AI-slop pass/)).toBeInTheDocument();
  });

  it('approving a learned rule bumps the Brain; an earlier draft approval goes stale', async () => {
    renderWithRouter(<Today data={today} />);
    await userEvent.click(within(queueRow(/Your agent didn't forget/)).getByRole('button', { name: 'Approve' }));
    expect(within(queueRow(/Your agent didn't forget/)).getByText(/It publishes on its schedule/)).toBeInTheDocument();
    expect(within(queueRow(/Open X threads/)).getByText(/becomes Brain v3.2 if you approve/)).toBeInTheDocument();
    await userEvent.click(within(queueRow(/Open X threads/)).getByRole('button', { name: 'Approve rule' }));
    expect(within(queueRow(/Open X threads/)).getByText('Approved: active in Brain v3.2. The kit is unchanged.')).toBeInTheDocument();
    expect(within(queueRow(/Open X threads/)).getByText(/active in Brain v3.2$/)).toBeInTheDocument();
    expect(within(queueRow(/Open X threads/)).queryByText(/if you approve/)).toBeNull();
    const draft = queueRow(/Your agent didn't forget/);
    expect(within(draft).getByText(/approval went stale/)).toBeInTheDocument();
    expect(within(draft).getByRole('button', { name: 'Approve' })).toBeEnabled();
  });
});

describe('Today: quest submissions (ambassador posts with a questId) pay through domain/quest.ts', () => {
  const quest = { id: 'quest-tut', task: '[Quest task]', format: 'tutorial' as const, rewardUsdc: 50, slots: 2, paidSubmissionIds: ['q-sub-0'], due: null, opens: null, submissionIds: ['q-sub-1', 'q-sub-2'] };
  const sub = (id: string, who: string) => ({ id, kind: 'ambassadorPost' as const, chip: 'Quest submission', text: `${who}'s tutorial is verified against your kit`, meta: '50 USDC on approval', questId: 'quest-tut', payout: { amount: 50, unit: 'USDC' as const }, verified: true, disclosure: 'present' as const, open: { label: 'Review', artboard: 'Quests' as const } });
  const data = { ...today, quests: [quest], queue: [sub('q-sub-1', '[Creator A]'), sub('q-sub-2', '[Creator B]')] };

  it('Approve is blocked once the quest slots are full, and the badge says why', async () => {
    renderWithRouter(<Today data={data} />);
    await userEvent.click(within(queueRow(/\[Creator A\]/)).getByRole('button', { name: 'Approve and pay' }));
    expect(within(queueRow(/\[Creator A\]/)).getByText('Approved. The 50 USDC payout is queued.')).toBeInTheDocument();
    const second = queueRow(/\[Creator B\]/);
    expect(within(second).getByRole('button', { name: 'Approve and pay' })).toBeDisabled();
    expect(within(second).getByText(/Blocked: All 2 slots are paid; the budget is reached/)).toBeInTheDocument();
    expect(loopStore.read().payouts.map((p) => p.submissionId)).toEqual(['q-sub-1']);
  });

  it('a paid slot stays used after its submission leaves the queue; the next one is blocked when that was the last slot', async () => {
    const { rerender } = renderWithRouter(<Today data={data} />);
    await userEvent.click(within(queueRow(/\[Creator A\]/)).getByRole('button', { name: 'Approve and pay' }));
    rerender(<MemoryRouter><Today data={{ ...data, queue: [sub('q-sub-2', '[Creator B]')] }} /></MemoryRouter>);
    const row = queueRow(/\[Creator B\]/);
    expect(within(row).getByRole('button', { name: 'Approve and pay' })).toBeDisabled();
    expect(within(row).getByText(/Blocked: All 2 slots are paid/)).toBeInTheDocument();
    expect(loopStore.read().payouts).toEqual([expect.objectContaining({ questId: 'quest-tut', submissionId: 'q-sub-1', amount: 50 })]);
  });

  it('a pending submission whose id is already paid cannot be approved, and the payouts do not change', () => {
    renderWithRouter(<Today data={{ ...data, quests: [{ ...quest, paidSubmissionIds: ['q-sub-1'] }] }} />);
    const row = queueRow(/\[Creator A\]/);
    expect(within(row).getByRole('button', { name: 'Approve and pay' })).toBeDisabled();
    expect(within(row).getByText('Blocked: Already paid.')).toBeInTheDocument();
    expect(loopStore.read().payouts).toEqual([]);
  });

  it('a submission whose quest is not found is blocked ("Quest not found"), never paid as a seat post', async () => {
    renderWithRouter(<Today data={{ ...data, quests: [] }} />);
    const row = queueRow(/\[Creator A\]/);
    expect(within(row).getByRole('button', { name: 'Approve and pay' })).toBeDisabled();
    expect(within(row).getByText('Blocked: Quest not found.')).toBeInTheDocument();
  });
});

describe('M-Today', () => {
  it('shows one-tap decisions only, a more link, and the mobile tab bar', () => {
    renderWithRouter(<MToday data={today} />);
    expect(screen.getByRole('heading', { level: 1, name: '7 decisions' })).toBeInTheDocument();
    expect(screen.getByText(/5 of 6 steps live/)).toBeInTheDocument();
    const cards = within(screen.getByRole('list', { name: 'Needs you' })).getAllByRole('listitem');
    expect(cards).toHaveLength(3);
    expect(screen.getByRole('link', { name: '4 more' })).toBeInTheDocument();
    const bar = screen.getByRole('navigation', { name: 'Main' });
    expect(within(bar).getAllByRole('link').map((a) => a.textContent)).toEqual(['Today', 'Create', 'Verify', 'Grow', 'More']);
    expect(screen.queryByRole('navigation', { name: 'Brand' })).toBeNull();
  });

  it('a decided item leaves the three slots for the next one-tap item and moves to Done; counts agree', async () => {
    renderWithRouter(<MToday data={today} />);
    const slots = () => within(screen.getByRole('list', { name: 'Needs you' })).getAllByRole('listitem');
    expect(slots().some((li) => /Open X threads/.test(li.textContent ?? ''))).toBe(false);
    await userEvent.click(within(slots()[0]).getByRole('button', { name: 'Approve' }));
    expect(slots()).toHaveLength(3);
    expect(slots().some((li) => /Open X threads/.test(li.textContent ?? ''))).toBe(true);
    expect(within(screen.getByRole('list', { name: 'Done' })).getByText(/Your agent didn't forget/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '6 decisions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '3 more' })).toBeInTheDocument();
  });
});

describe('Brain and Learn-Rules share the Brain', () => {
  it('approving on Learn-Rules activates the rule on the Brain at v3.2; the other proposal must be checked again', async () => {
    const { unmount } = renderWithRouter(<LearnRules data={learnRules} />);
    expect(screen.getByText('2 waiting')).toBeInTheDocument();
    expect(screen.getAllByText('Signal: From platform metrics')).toHaveLength(1);
    const [first, second] = screen.getAllByRole('region').filter((r) => within(r).queryByRole('button', { name: 'Approve rule' }));
    await userEvent.click(within(first).getByRole('button', { name: 'Approve rule' }));
    expect(screen.getByText('1 waiting')).toBeInTheDocument();
    expect(within(second).getByRole('button', { name: 'Approve rule' })).toBeDisabled();
    await userEvent.click(within(second).getByRole('button', { name: 'Check it again' }));
    expect(within(second).getByRole('button', { name: 'Approve rule' })).toBeEnabled();
    unmount();
    renderWithRouter(<Brain data={brainScreen} />);
    expect(screen.getByText('Brain v3.2')).toBeInTheDocument();
    const row = screen.getByRole('rowheader', { name: 'Open X threads with the problem, not the product' }).closest('tr')!;
    expect(within(row).getByText('Active')).toBeInTheDocument();
    expect(screen.getByText(/v3.2 · Rule "Open X threads with the problem, not the product" approved by \[Founder name\]/)).toBeInTheDocument();
  });

  it('Try on half of drafts sets a trial; Reject decides without changing the Brain', async () => {
    renderWithRouter(<LearnRules data={learnRules} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Try on half of drafts' })[0]);
    expect(screen.getByText('Trial on half of drafts')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Running on half of new drafts');
    await userEvent.click(screen.getAllByRole('button', { name: 'Reject' })[1]);
    expect(within(screen.getByRole('list', { name: 'Decided' })).getByText(/Post event recaps within 24 hours · rejected/)).toBeInTheDocument();
    expect(loopStore.read().brainVersion).toBeUndefined();
  });

  it('rejecting on Learn-Rules removes the suggestion from the Brain and drops its waiting count (one record)', async () => {
    const first = renderWithRouter(<Brain data={brainScreen} />);
    expect(screen.getByText(/2 suggested, waiting on you/)).toBeInTheDocument();
    first.unmount();
    const learn = renderWithRouter(<LearnRules data={learnRules} />);
    const recaps = screen.getAllByRole('region').find((r) => within(r).queryByRole('heading', { name: 'Post event recaps within 24 hours' }))!;
    await userEvent.click(within(recaps).getByRole('button', { name: 'Reject' }));
    learn.unmount();
    renderWithRouter(<Brain data={brainScreen} />);
    expect(screen.getByText(/1 suggested, waiting on you/)).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: 'Post event recaps within 24 hours' })).toBeNull();
    expect(screen.getByText('Brain v3.1')).toBeInTheDocument();
  });

  it('the loop state is kept per brand: a rule approved for aDNA does not change another brand', async () => {
    renderWithRouter(<Brain data={brainScreen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve: Open X threads with the problem, not the product' }));
    expect(screen.getByText('Brain v3.2')).toBeInTheDocument();
    act(() => selectBrand('gamerslab'));
    expect(screen.getByText('Brain v3.1')).toBeInTheDocument();
    expect(screen.getByText(/2 suggested, waiting on you/)).toBeInTheDocument();
    act(() => selectBrand('adna'));
    expect(screen.getByText('Brain v3.2')).toBeInTheDocument();
  });

  it('approved then retired: Today and Learn-Rules say retired, never "active"', async () => {
    const learn = renderWithRouter(<LearnRules data={learnRules} />);
    const x = screen.getAllByRole('region').find((r) => within(r).queryByRole('heading', { name: 'Open X threads with the problem, not the product' }))!;
    await userEvent.click(within(x).getByRole('button', { name: 'Approve rule' }));
    learn.unmount();
    const brain = renderWithRouter(<Brain data={brainScreen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retire: Open X threads with the problem, not the product' }));
    brain.unmount();
    const t = renderWithRouter(<Today data={today} />);
    expect(within(queueRow(/Open X threads/)).getByText(/· retired \d+ \w+$/)).toBeInTheDocument();
    expect(within(queueRow(/Open X threads/)).queryByText(/active in Brain/)).toBeNull();
    t.unmount();
    renderWithRouter(<LearnRules data={learnRules} />);
    expect(within(screen.getByRole('list', { name: 'Decided' })).getByText(/Open X threads with the problem, not the product · retired/)).toBeInTheDocument();
  });

  it('loop data follows the active brand: GamersLab shows its own Brain; kit gates are read-only, not learned rules', () => {
    const entry = screens.find((s) => s.artboard === 'Brain')!;
    act(() => selectBrand('gamerslab'));
    const { unmount } = renderWithRouter(entry.render('success'));
    expect(screen.getByText(/Everything JamJam knows about GamersLab/)).toBeInTheDocument();
    expect(screen.getByText('Brain v1')).toBeInTheDocument();
    expect(screen.queryByText(/Every agent reads the folder first/)).toBeNull();
    const learned = screen.getByRole('table', { name: 'Learned rules, their evidence and status' });
    expect(within(learned).queryAllByRole('rowheader')).toHaveLength(0);
    expect(screen.getByText(/active · 0 suggested, waiting on you/)).toBeInTheDocument();
    const gates = screen.getByRole('table', { name: 'Kit gates and your edits, and their status' });
    const gate = within(gates).getByRole('rowheader', { name: 'Never claim a user count without a source' }).closest('tr')!;
    expect(within(gate).getByText('From the approved kit')).toBeInTheDocument();
    expect(within(gate).queryByRole('button', { name: /Retire/ })).toBeNull();
    unmount();
    act(() => selectBrand('adna'));
    renderWithRouter(entry.render('success'));
    expect(screen.getByText('Brain v3.1')).toBeInTheDocument();
  });

  it('no loop screen shows a success layout with zero data: first-run brands get each empty state (Verify lists kit v1), aDNA its success', () => {
    for (const brand of ['jamjam', 'gamerslab', 'adna']) {
      act(() => selectBrand(brand));
      for (const entry of screens) {
        const { container, unmount } = renderWithRouter(entry.render('success'));
        const shown = container.querySelector('[data-state]')?.getAttribute('data-state');
        // A first-run brand has nothing yet on every screen except Verify-Home, which lists its registered kit v1.
        const expected = brand === 'adna' || entry.artboard === 'Verify-Home' ? 'success' : 'empty';
        expect(`${brand} ${entry.artboard}: ${shown}`).toBe(`${brand} ${entry.artboard}: ${expected}`);
        unmount();
      }
    }
    act(() => selectBrand('jamjam'));
    renderWithRouter(screens.find((s) => s.artboard === 'Verify-Home')!.render('success'));
    expect(screen.getByRole('rowheader', { name: 'Kit v1' })).toBeInTheDocument();
    expect(screen.getByText(/No one has pasted text that claimed to be from JamJam/)).toBeInTheDocument();
    expect(screen.queryByText(/0 people/)).toBeNull();    cleanupScreens();
    renderWithRouter(screens.find((s) => s.artboard === 'Today')!.render('success'));
    expect(screen.getByText('2 of 6 steps live · Learn starts after 14 days of results')).toBeInTheDocument();
    expect(screen.getByText('Draft your first post', { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Evidence and the proposed rule' })).toBeNull();
    expect(screen.queryByText('[detail]', { exact: false })).toBeNull();
  });

  it('a brand with no loop data says so, never showing another brand', () => {
    act(() => selectBrand('filmfun'));
    renderWithRouter(screens.find((s) => s.artboard === 'Today')!.render('success'));
    expect(screen.getByRole('heading', { level: 1, name: 'Nothing here for film.fun yet' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Needs you/ })).toBeNull();
    expect(screen.queryByText(/Tuesday, aDNA/)).toBeNull();
  });

  it('an approved proposal keeps the Brain version its approval made after later approvals', async () => {
    renderWithRouter(<LearnRules data={learnRules} />);
    const x = screen.getAllByRole('region').find((r) => within(r).queryByRole('heading', { name: 'Open X threads with the problem, not the product' }))!;
    await userEvent.click(within(x).getByRole('button', { name: 'Approve rule' }));
    const decided = within(screen.getByRole('list', { name: 'Decided' }));
    expect(decided.getByText(/Lead with the problem · active in Brain v3.1/)).toBeInTheDocument();
    expect(decided.getByText(/Open X threads with the problem, not the product · active in Brain v3.2/)).toBeInTheDocument();
  });

  it('collecting shows nothing to suggest yet', () => {
    renderWithRouter(<LearnRules data={learnRulesCollecting} />);
    expect(screen.getByText('Nothing to suggest yet')).toBeInTheDocument();
  });

  it('retiring a rule bumps the Brain version; the kit stays v3', async () => {
    renderWithRouter(<Brain data={brainScreen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retire: Lead with the problem' }));
    expect(screen.getByText('Brain v3.2')).toBeInTheDocument();
    expect(screen.getAllByText('Retired').length).toBeGreaterThan(0);
    expect(screen.getByText('v3')).toBeInTheDocument();
  });
});

describe('Post-Detail', () => {
  it('the picker switches the post and its lifecycle; a Brain change makes an unpublished approval stale', async () => {
    renderWithRouter(<PostDetail data={postDetail} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Post · X · Founder voice' })).toBeInTheDocument();
    expect(screen.getByText(/Every agent reads the folder first/)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Post' }), 'post-failed');
    expect(screen.getByText(/the LinkedIn connection expired/)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Post' }), 'post-blog');
    expect(screen.getByText('Checks: 1 claim needs a source. Add one to approve.')).toBeInTheDocument();
    loopStore.set({ brainVersion: '3.2' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Post' }), 'post-launch');
    expect(screen.queryByText(/blocked, needs you/)).toBeNull();
  });
});

describe('Verify-Home', () => {
  it('the filter changes the registered list', async () => {
    renderWithRouter(<VerifyHome data={verifyHome} />);
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Show' }), 'kit');
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('rowheader', { name: 'Kit v3' })).toBeInTheDocument();
  });
});
