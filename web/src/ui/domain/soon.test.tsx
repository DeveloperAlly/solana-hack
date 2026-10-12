import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { examples } from '../../system/Workbench';
import { SoonPageHeader } from './SoonPageHeader';
import { SoonHubFrame } from './SoonHubFrame';
import { SoonStatusList } from './SoonStatusList';
import { SoonStatusRow } from './SoonStatusRow';
import { SoonInlineForm } from './SoonInlineForm';
import { SoonAddForm } from './SoonAddForm';
import { SoonCopyButton } from './SoonCopyButton';
import { SoonWeekCalendar } from './SoonWeekCalendar';
import { SoonPayoutTable, payoutError } from './SoonPayoutTable';
import { SoonSpendingCapField, capError } from './SoonSpendingCapField';
import { SoonSlideEditor } from './SoonSlideEditor';
import { SoonPlanTier } from './SoonPlanTier';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

// Issue #51: the Soon* domain components. Each renders, handles its interaction and has 0 axe violations.
describe('SoonPageHeader', () => {
  it('shows the title, the Coming soon flag and the defined-in line', async () => {
    const { container } = renderWithRouter(<SoonPageHeader title="Claims" intro="Intro" definedIn="inventory D19" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Claims' })).toBeInTheDocument();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.getByText('Drawn, not built. Defined in: inventory D19')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('shows no flag for a hackathon screen', () => {
    renderWithRouter(<SoonPageHeader title="Home" tag="HACKATHON" />);
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });
});

describe('SoonHubFrame', () => {
  it('renders the hub shell, a working brand switcher, the header and the body', async () => {
    const { container } = renderWithRouter(<SoonHubFrame header={{ title: 'Claims' }}><p>body</p></SoonHubFrame>);
    expect(screen.getByRole('main')).toHaveTextContent('body');
    await userEvent.click(screen.getByRole('button', { name: 'JamJam, switch brand' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /aDNA/ }));
    expect(screen.getByRole('button', { name: 'aDNA, switch brand' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('SoonStatusRow and SoonStatusList', () => {
  it('lists rows with chips, actions and a selected row', async () => {
    const onClick = vi.fn();
    const { container } = renderWithRouter(
      <SoonStatusList label="Rows">
        <SoonStatusRow name="LinkedIn" detail="post as you" status={{ label: 'Not connected' }} actions={<button type="button" onClick={onClick}>Connect</button>} />
        <SoonStatusRow name="X" selected />
      </SoonStatusList>,
    );
    const list = screen.getByRole('list', { name: 'Rows' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(within(list).getAllByRole('listitem')[1]).toHaveClass('selected');
    await userEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(onClick).toHaveBeenCalled();
    await expectNoAxeViolations(container);
  });
});

describe('SoonInlineForm', () => {
  it('validates on submit, clears the error as the field is fixed, then submits trimmed values', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const { container } = renderWithRouter(
      <SoonInlineForm label="Add" fields={[{ name: 'name', label: 'Name', validate: (v) => (v ? null : 'Enter a name.') }]} submitLabel="Save" onSubmit={onSubmit} onCancel={onCancel} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name.');
    expect(onSubmit).not.toHaveBeenCalled();
    await expectNoAxeViolations(container);
    await userEvent.type(screen.getByLabelText('Name'), '  Acme ');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Acme' });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('SoonAddForm', () => {
  it('opens on the trigger, closes on submit and on cancel', async () => {
    const onSubmit = vi.fn();
    const { container } = renderWithRouter(<SoonAddForm triggerLabel="Add a source" label="Add a source" fields={[{ name: 'name', label: 'Source' }]} submitLabel="Add" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add a source' }));
    await expectNoAxeViolations(container);
    await userEvent.type(screen.getByLabelText('Source'), 'CV');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'CV' });
    await userEvent.click(screen.getByRole('button', { name: 'Add a source' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Add a source' })).toBeInTheDocument();
  });
});

describe('SoonCopyButton', () => {
  it('copies and says so', async () => {
    const user = userEvent.setup();
    const { container } = renderWithRouter(<SoonCopyButton text="hello" label="Copy" />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe('hello');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Copied to the clipboard.');
    await expectNoAxeViolations(container);
  });
  it('says when copying failed', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    renderWithRouter(<SoonCopyButton text="hello" label="Copy" />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
  });
});

describe('SoonWeekCalendar', () => {
  it('marks failed slots in text and lets an open slot be picked', async () => {
    const onSelect = vi.fn();
    const { container } = renderWithRouter(
      <SoonWeekCalendar label="Week" days={['Mon', 'Wed']} slots={[{ id: 'a', day: 'Mon', label: '09:00 X', status: 'failed' }, { id: 'b', day: 'Wed', label: '[open slot]', status: 'open' }]} selectedId="b" onSelect={onSelect} />,
    );
    expect(screen.getByText('09:00 X · failed')).toBeInTheDocument();
    const open = screen.getByRole('button', { name: '[open slot]' });
    expect(open).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(open);
    expect(onSelect).toHaveBeenCalledWith('b');
    await expectNoAxeViolations(container);
  });
});

describe('SoonPayoutTable', () => {
  it('edits payouts and flags an invalid one', async () => {
    const onChange = vi.fn();
    const { container } = renderWithRouter(<SoonPayoutTable caption="Payouts" rows={[{ id: 'li', format: 'LinkedIn post', where: 'LinkedIn', payout: '-1' }]} onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'LinkedIn post payout' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter an amount of 0 or more.')).toBeInTheDocument();
    await userEvent.type(input, '5');
    expect(onChange).toHaveBeenCalledWith('li', '-15');
    await expectNoAxeViolations(container);
  });
  it('checks amounts', () => {
    expect(payoutError('10')).toBeNull();
    expect(payoutError('0')).toBeNull();
    expect(payoutError('')).not.toBeNull();
    expect(payoutError('abc')).not.toBeNull();
  });
});

describe('SoonSpendingCapField', () => {
  it('shows the balance, a cap error and the over-balance error', async () => {
    const onChange = vi.fn();
    const { container, rerender } = renderWithRouter(<SoonSpendingCapField value="0" onChange={onChange} balance="[n]" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a cap above 0.');
    await userEvent.type(screen.getByLabelText('Spending cap (USDC)'), '1');
    expect(onChange).toHaveBeenCalledWith('01');
    await expectNoAxeViolations(container);
    rerender(<SoonSpendingCapField value="500" onChange={onChange} balance="[n]" overBalance />);
    expect(screen.getByRole('alert')).toHaveTextContent('above your wallet balance ([n] USDC)');
    expect(capError('500')).toBeNull();
  });
});

describe('SoonSlideEditor', () => {
  it('selects a slide and edits its text, with an error when empty', async () => {
    const onChange = vi.fn();
    const slides = [{ id: '1', label: '1 · Hook', text: 'Hi' }, { id: '2', label: '2 · Problem', text: '' }];
    const { container } = renderWithRouter(<SoonSlideEditor label="Slides" slides={slides} onChange={onChange} />);
    expect(screen.getByLabelText('Slide 1 · Hook text')).toHaveValue('Hi');
    await userEvent.click(screen.getByRole('button', { name: 'Edit slide 2 · Problem' }));
    expect(screen.getByRole('button', { name: 'Edit slide 2 · Problem' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('A slide needs some text.');
    await userEvent.type(screen.getByLabelText('Slide 2 · Problem text'), 'x');
    expect(onChange).toHaveBeenCalledWith('2', 'x');
    await expectNoAxeViolations(container);
  });
});

describe('SoonPlanTier', () => {
  it('renders a tier with its call to action link', async () => {
    const { container } = renderWithRouter(<SoonPlanTier name="Solo" price="[price] / month" features="Unlimited drafts" cta="Choose Solo" href="/screens/Upgrade" note="band" featured />);
    expect(screen.getByRole('region', { name: 'Solo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Choose Solo' })).toHaveAttribute('href', '/screens/Upgrade');
    await expectNoAxeViolations(container);
  });
});

describe('Soon* workbench examples', () => {
  it('registers an example for every Soon component', () => {
    const names = examples.map((e) => e.name);
    for (const n of ['SoonPageHeader', 'SoonHubFrame', 'SoonStatusRow', 'SoonStatusList', 'SoonInlineForm', 'SoonAddForm', 'SoonCopyButton', 'SoonWeekCalendar', 'SoonPayoutTable', 'SoonSpendingCapField', 'SoonSlideEditor', 'SoonPlanTier']) expect(names).toContain(n);
  });
});
