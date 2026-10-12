import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { loopStore } from '../../flows/loop/store';
import { Today } from './Today';
import { MToday } from './MToday';
import { Brain } from './Brain';
import { LearnRules } from './LearnRules';
import { PostDetail } from './PostDetail';
import { VerifyHome } from './VerifyHome';
import { brainScreen, learnRules, learnRulesCollecting, postDetail, today, verifyHome } from './fixtures';

vi.mock('../../lib/supabase', () => ({ supabase: null }));
beforeEach(() => loopStore.reset());

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

  it('approving a learned rule bumps the Brain; an earlier draft approval goes stale', async () => {
    renderWithRouter(<Today data={today} />);
    await userEvent.click(within(queueRow(/Your agent didn't forget/)).getByRole('button', { name: 'Approve' }));
    expect(within(queueRow(/Your agent didn't forget/)).getByText(/It publishes on its schedule/)).toBeInTheDocument();
    expect(within(queueRow(/Open X threads/)).getByText(/becomes Brain v3.2 if you approve/)).toBeInTheDocument();
    await userEvent.click(within(queueRow(/Open X threads/)).getByRole('button', { name: 'Approve rule' }));
    expect(within(queueRow(/Open X threads/)).getByText(/active in Brain v3.2; the kit is unchanged/)).toBeInTheDocument();
    const draft = queueRow(/Your agent didn't forget/);
    expect(within(draft).getByText(/approval went stale/)).toBeInTheDocument();
    expect(within(draft).getByRole('button', { name: 'Approve' })).toBeEnabled();
  });
});

describe('Today: quest submissions pay through domain/quest.ts', () => {
  const quest = { id: 'quest-tut', task: '[Quest task]', format: 'tutorial' as const, rewardUsdc: 50, slots: 2, paid: 1, due: null, opens: null, submissionIds: ['q-sub-1', 'q-sub-2'] };
  const sub = (id: string, who: string) => ({ id, kind: 'questSubmission' as const, chip: 'Quest submission', text: `${who}'s tutorial is verified against your kit`, meta: '50 USDC on approval', questId: 'quest-tut', payout: { amount: 50, unit: 'USDC' as const }, verified: true, disclosure: 'present' as const, open: { label: 'Review', artboard: 'Quests' as const } });
  const data = { ...today, quests: [quest], queue: [sub('q-sub-1', '[Creator A]'), sub('q-sub-2', '[Creator B]')] };

  it('Approve is blocked once the quest slots are full, and the badge says why', async () => {
    renderWithRouter(<Today data={data} />);
    await userEvent.click(within(queueRow(/\[Creator A\]/)).getByRole('button', { name: 'Approve and pay' }));
    expect(within(queueRow(/\[Creator A\]/)).getByText('Approved. The 50 USDC payout is queued.')).toBeInTheDocument();
    const second = queueRow(/\[Creator B\]/);
    expect(within(second).getByRole('button', { name: 'Approve and pay' })).toBeDisabled();
    expect(within(second).getByText(/Blocked: All 2 slots are paid; the budget is reached/)).toBeInTheDocument();
    expect(loopStore.read().questPaid['quest-tut']).toBe(2);
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
