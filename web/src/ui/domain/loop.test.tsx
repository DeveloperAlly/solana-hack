import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { adnaBrain } from '../../domain/fixtures/brain';
import { adnaPosts } from '../../domain/fixtures/posts';
import { adnaProposals } from '../../domain/fixtures/proposals';
import { proposalGate } from '../../domain/proposal';
import { RuleProposal } from './RuleProposal';
import { WhyThis } from './WhyThis';
import { example as lifecycleEx } from './PostLifecycle.example';
import { example as whyEx } from './WhyThis.example';
import { example as queueEx } from './DecisionQueue.example';
import { example as itemEx } from './QueueItem.example';
import { example as ruleEx } from './RuleProposal.example';

describe('D70 PostLifecycle', () => {
  it('renders six steps per post, says what goes on Solana, and has no axe violations', async () => {
    const { container } = renderWithRouter(lifecycleEx.render());
    const strip = screen.getByRole('list', { name: 'Lifecycle: post-launch' });
    expect(within(strip).getAllByRole('listitem').map((li) => li.textContent?.split(' (')[0])).toEqual(['Drafted', 'Approved', 'Published', 'Verified', 'Amplified', 'Results']);
    expect(within(screen.getByRole('list', { name: 'Lifecycle: post-stale' })).getByText(/blocked, needs you/)).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Lifecycle: post-failed' })).getByText(/LinkedIn failed/)).toBeInTheDocument();
    expect(screen.getAllByText(/a hash and ids, never the text/)).toHaveLength(4);
    await expectNoAxeViolations(container);
  });
});

describe('D71 WhyThis', () => {
  it('shows exactly the provenance row: facts with receipts, voice, rules, versions', async () => {
    const { container } = renderWithRouter(whyEx.render());
    expect(screen.getByText(/Every agent reads the folder first/)).toBeInTheDocument();
    expect(screen.getByText(/adna.network\/docs · read 3 Oct/)).toBeInTheDocument();
    expect(screen.getByText(/Founder voice v2/)).toBeInTheDocument();
    expect(screen.getByText(/Lead with the problem \(learned\)/)).toBeInTheDocument();
    expect(screen.getByText(/Kit v3 · Brain v3.1 · prompt draft-post/)).toBeInTheDocument();
    expect(screen.queryByText(/Open X threads/)).toBeNull();
    await expectNoAxeViolations(container);
  });
  it('names an id the Brain no longer holds instead of dropping it', () => {
    renderWithRouter(<WhyThis provenance={{ ...adnaPosts[0].provenance, ruleIds: ['gone'] }} brain={adnaBrain} />);
    expect(screen.getByText('Rule gone: no longer in the Brain')).toBeInTheDocument();
  });
});

describe('D72 DecisionQueue and D73 QueueItem', () => {
  it('queue frame: count, filter and empty view, no axe violations', async () => {
    const { container } = renderWithRouter(queueEx.render());
    expect(screen.getByRole('heading', { name: 'Needs you (example) · 1' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Show' })).toBeInTheDocument();
    expect(screen.getByText('All clear')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('a blocking gate disables the action and the badge says why; an outcome replaces the actions', async () => {
    const { container } = renderWithRouter(itemEx.render());
    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByRole('button', { name: 'Approve' })).toBeEnabled();
    expect(within(items[1]).getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(within(items[1]).getByText(/Blocked: 1 claim needs a source/)).toBeInTheDocument();
    expect(within(items[2]).queryByRole('button', { name: 'Send' })).toBeNull();
    expect(within(items[2]).getByText('Sent.')).toBeInTheDocument();
    expect(within(items[3]).getByText(/went stale/)).toBeInTheDocument();
    expect(within(items[4]).queryByRole('button')).toBeNull();
    expect(within(items[4]).getByRole('link', { name: 'Open plan' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('D74 RuleProposal', () => {
  it('shows signal source, small sample and that the kit stays the same; no axe violations', async () => {
    const { container } = renderWithRouter(ruleEx.render());
    expect(screen.getAllByText('Signal: From platform metrics')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/The sample is small/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/The kit and its registration on Solana stay as they are/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Brain v3.1 → v3.2/)[0]).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('wires its actions; an outdated proposal blocks Approve and offers Check it again', async () => {
    const on = { onApprove: vi.fn(), onReject: vi.fn(), onTrial: vi.fn(), onRecheck: vi.fn() };
    const [p] = adnaProposals;
    const { unmount } = renderWithRouter(<RuleProposal proposal={p} gate={proposalGate(p, '3.1')} brainVersion="3.1" nextVersion="3.2" citesHref="/x" {...on} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try on half of drafts' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await userEvent.click(screen.getByRole('button', { name: 'Approve rule' }));
    expect(on.onTrial).toHaveBeenCalled();
    expect(on.onReject).toHaveBeenCalled();
    expect(on.onApprove).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Check it again' })).toBeNull();
    unmount();
    renderWithRouter(<RuleProposal proposal={p} gate={proposalGate(p, '3.2')} brainVersion="3.2" nextVersion="3.3" citesHref="/x" {...on} />);
    expect(screen.getByRole('button', { name: 'Approve rule' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Check it again' }));
    expect(on.onRecheck).toHaveBeenCalled();
  });
});
