// Amb* domain components (issue #53): each renders with 0 axe violations, and its states and interactions work.
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { Button } from '../primitives';
import { AmbBar } from './AmbBar';
import { AmbBudgetBar, budgetLevel } from './AmbBudgetBar';
import { AmbCampaignCard } from './AmbCampaignCard';
import { AmbChecksList } from './AmbChecksList';
import { AmbCollapsibleText } from './AmbCollapsibleText';
import { AmbColumns } from './AmbColumns';
import { AmbDraftEditor, highlightRuns } from './AmbDraftEditor';
import { AmbInlineForm } from './AmbInlineForm';
import { AmbNotifyButton } from './AmbNotifyButton';
import { AmbOnBrandMeter } from './AmbOnBrandMeter';
import { AmbPublishRouteCard } from './AmbPublishRouteCard';
import { AmbSelect } from './AmbSelect';
import { AmbSheet } from './AmbSheet';
import { AmbShell } from './AmbShell';
import { AmbStatusTimeline } from './AmbStatusTimeline';
import { sampleBudget, sampleCampaign, sampleChecks, sampleClosedCampaign, sampleDraft, sampleFailedSteps, sampleNav, sampleSteps } from './ambSamples';

describe('P24 AmbBar', () => {
  it('draws segments as SVG attributes, hidden from assistive tech', async () => {
    const { container } = renderWithRouter(<AmbBar segments={[{ pct: 27, tone: 'primary' }, { pct: 12, tone: 'secondary' }]} marker={80} />);
    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(4);
    expect(rects[2]).toHaveAttribute('x', '27');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expectNoAxeViolations(container);
  });
  it('never overflows the track', () => {
    const { container } = renderWithRouter(<AmbBar segments={[{ pct: 90, tone: 'primary' }, { pct: 40, tone: 'secondary' }]} />);
    expect(container.querySelectorAll('rect')[2]).toHaveAttribute('width', '10');
  });
});

describe('D25 AmbBudgetBar', () => {
  it('captions what is left and has no axe violations', async () => {
    const { container } = renderWithRouter(<AmbBudgetBar budget={sampleBudget} />);
    expect(screen.getByText('305 of 500 USDC left')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('warns under 20% remaining and reports each level', () => {
    renderWithRouter(<AmbBudgetBar budget={{ ...sampleBudget, spent: 380, committed: 40 }} />);
    expect(screen.getByText('Under 20% of the budget is left.')).toBeInTheDocument();
    expect(budgetLevel({ spent: 0, cap: 500, unit: 'USDC' })).toBe('empty');
    expect(budgetLevel(sampleBudget)).toBe('ok');
    expect(budgetLevel({ spent: 500, cap: 500, unit: 'USDC' })).toBe('full');
  });
});

describe('D4 AmbOnBrandMeter', () => {
  it.each([[74, 'Drifting'], [91, 'On brand']])('score %i reads %s as a labelled meter', async (score, label) => {
    const { container } = renderWithRouter(<AmbOnBrandMeter score={score} threshold={80} />);
    expect(screen.getByRole('meter', { name: 'On-brand score' })).toHaveAttribute('aria-valuenow', String(score));
    expect(screen.getByText(label)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('D29 AmbStatusTimeline', () => {
  it('marks done, current and failed steps for screen readers', async () => {
    const { container, unmount } = renderWithRouter(<AmbStatusTimeline steps={sampleSteps} />);
    const list = screen.getByRole('list', { name: 'Post status' });
    expect(within(list).getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step');
    expect(list).toHaveTextContent('Published (done)');
    await expectNoAxeViolations(container);
    unmount();
    renderWithRouter(<AmbStatusTimeline steps={sampleFailedSteps} orientation="vertical" />);
    expect(screen.getByText(/Not verified/)).toHaveTextContent('(failed)');
  });
});

describe('D3 AmbChecksList', () => {
  it('lists flags with one-click fixes', async () => {
    const onFix = vi.fn();
    const { container } = renderWithRouter(<AmbChecksList checks={sampleChecks} onFix={onFix} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove line: Banned claim' }));
    expect(onFix).toHaveBeenCalledWith('banned');
    await expectNoAxeViolations(container);
  });
  it('is compact on mobile and says when nothing is flagged', () => {
    const { unmount } = renderWithRouter(<AmbChecksList compact checks={sampleChecks} onFix={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Remove: Banned claim' })).toBeInTheDocument();
    unmount();
    renderWithRouter(<AmbChecksList checks={[]} onFix={() => undefined} />);
    expect(screen.getByText('No flags.')).toBeInTheDocument();
  });
});

function EditorHarness({ limit }: { limit?: number }) {
  const [text, setText] = useState(sampleDraft);
  return <AmbDraftEditor label="Draft" value={text} onChange={setText} highlights={['memory dump']} charLimit={limit} toolbar={<Button variant="secondary">Undo</Button>} />;
}

describe('D5 AmbDraftEditor', () => {
  it('edits a real textarea and highlights flagged phrases', async () => {
    const { container } = renderWithRouter(<EditorHarness limit={3000} />);
    const box = screen.getByRole('textbox', { name: 'Draft' });
    await userEvent.type(box, '!');
    expect(box).toHaveValue(`${sampleDraft}!`);
    expect(container.querySelector('mark')).toHaveTextContent('memory dump');
    expect(screen.getByText(/\/ 3000 characters/)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('flags text over the limit, and shows a skeleton while generating', () => {
    const { unmount } = renderWithRouter(<EditorHarness limit={10} />);
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveAttribute('aria-invalid', 'true');
    unmount();
    renderWithRouter(<AmbDraftEditor label="Draft" value="" onChange={() => undefined} generating />);
    expect(screen.getByRole('status', { name: 'Generating your draft' })).toBeInTheDocument();
  });
  it('splits text into flagged runs case-insensitively', () => {
    expect(highlightRuns('A Memory Dump here', ['memory dump'])).toEqual([{ text: 'A ', flagged: false }, { text: 'Memory Dump', flagged: true }, { text: ' here', flagged: false }]);
  });
});

function SheetHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <AmbSheet open={open} onClose={() => setOpen(false)} title="Receipt"><Button>Inside</Button></AmbSheet>
    </>
  );
}

describe('C18 AmbSheet', () => {
  it('opens as a modal dialog, closes on Escape and returns focus', async () => {
    const { container } = renderWithRouter(<SheetHarness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Receipt' })).toHaveFocus();
    await expectNoAxeViolations(container);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
  it('keeps Tab inside and closes with Close', async () => {
    renderWithRouter(<SheetHarness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('P5 AmbCollapsibleText', () => {
  it('toggles Read more / Show less', async () => {
    const { container } = renderWithRouter(<AmbCollapsibleText text="Brief" collapsible />);
    const toggle = screen.getByRole('button', { name: 'Read more' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveTextContent('Show less');
    await expectNoAxeViolations(container);
  });
});

describe('P17 AmbInlineForm', () => {
  it('validates on submit, then submits a valid value', async () => {
    const onSubmit = vi.fn();
    const { container } = renderWithRouter(<AmbInlineForm label="Email" type="email" submitLabel="Join" validate={(v) => (v.includes('@') ? null : 'Enter an email.')} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an email.');
    expect(onSubmit).not.toHaveBeenCalled();
    await expectNoAxeViolations(container);
    await userEvent.type(screen.getByLabelText('Email'), 'mai@example.com');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(onSubmit).toHaveBeenCalledWith('mai@example.com');
  });
});

describe('P13 AmbSelect and P8 AmbNotifyButton', () => {
  it('changes value and toggles notify', async () => {
    const onChange = vi.fn();
    const onToggle = vi.fn();
    const { container } = renderWithRouter(
      <>
        <AmbSelect label="Sort" layout="inline" value="ending" onChange={onChange} options={[{ value: 'ending', label: 'Ending soonest' }, { value: 'payout', label: 'Highest payout' }]} />
        <AmbNotifyButton brand="aDNA" on={false} onToggle={onToggle} />
      </>,
    );
    await userEvent.selectOptions(screen.getByLabelText('Sort'), 'payout');
    expect(onChange).toHaveBeenCalledWith('payout');
    await userEvent.click(screen.getByRole('button', { name: 'Notify me about aDNA' }));
    expect(onToggle).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Notify me about aDNA' })).toHaveAttribute('aria-pressed', 'false');
    await expectNoAxeViolations(container);
  });
});

describe('D24 AmbCampaignCard, D30 AmbPublishRouteCard, L9 AmbColumns', () => {
  it('renders open and closed campaign rows, a stacked link card, a route card and columns', async () => {
    const { container } = renderWithRouter(
      <AmbColumns layout="main-aside">
        <div>
          <AmbCampaignCard {...sampleCampaign} action={<Button href="/x">View</Button>} />
          <AmbCampaignCard {...sampleClosedCampaign} />
          <AmbCampaignCard {...sampleCampaign} layout="stack" href="/detail" />
        </div>
        <AmbPublishRouteCard title="Post to LinkedIn for me" badge="Fastest · for this post" selected><Button>Post now</Button></AmbPublishRouteCard>
      </AmbColumns>,
    );
    expect(screen.getByText('budget 39% used')).toBeInTheDocument();
    expect(screen.getAllByText('Budget reached')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /aDNA launch week/ })).toHaveAttribute('href', '/detail');
    expect(screen.getByRole('heading', { name: 'Post to LinkedIn for me' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('L1 AmbShell', () => {
  const props = { nav: sampleNav, homeHref: '/', signInHref: '/sign-in', account: { name: 'Mai T.', balance: '15 USDC' } };
  it('desktop: nav with the current page and the balance chip', async () => {
    const { container } = renderWithRouter(<AmbShell {...props} device="desktop" active="campaigns"><p>Body</p></AmbShell>);
    expect(screen.getByRole('link', { name: 'Campaigns' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Mai T. · 15 USDC')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Body');
    await expectNoAxeViolations(container);
  });
  it('mobile: back link and title, pinned bar, sticky footer, tab bar; signed out shows Sign in', async () => {
    const { container, unmount } = renderWithRouter(
      <AmbShell {...props} device="mobile" back={{ href: '/back', label: 'Back to campaigns' }} title="aDNA launch week" pinned={<p>Meter</p>} footer={<Button>Join</Button>} tabs active="posts"><p>Body</p></AmbShell>,
    );
    expect(screen.getByRole('link', { name: 'Back to campaigns' })).toHaveAttribute('href', '/back');
    expect(screen.getByRole('navigation', { name: 'Ambassador' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My posts' })).toHaveAttribute('aria-current', 'page');
    await expectNoAxeViolations(container);
    unmount();
    renderWithRouter(<AmbShell {...props} account={null} device="mobile"><p>Body</p></AmbShell>);
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
  });
  it('preview: no second main landmark', () => {
    renderWithRouter(<main><AmbShell {...props} device="desktop" preview><p>Body</p></AmbShell></main>);
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });
});
