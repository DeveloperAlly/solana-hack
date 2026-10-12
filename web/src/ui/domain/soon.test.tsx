import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { examples } from '../../system/Workbench';
import { SoonWeekCalendar } from './SoonWeekCalendar';
import { SoonPayoutTable, payoutError } from './SoonPayoutTable';
import { SoonSpendingCapField, capError } from './SoonSpendingCapField';
import { SoonSlideEditor } from './SoonSlideEditor';
import { SoonPlanTier } from './SoonPlanTier';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

// Issue #51: the Soon* domain components (the generic ones moved to shared components in #80). Each renders, handles its interaction and has 0 axe violations.
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
    for (const n of ['SoonWeekCalendar', 'SoonPayoutTable', 'SoonSpendingCapField', 'SoonSlideEditor', 'SoonPlanTier']) expect(names).toContain(n);
  });
});
