import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { ProgressBar } from './ProgressBar';
import { example } from './ProgressBar.example';

describe('P24 ProgressBar', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('progressbar', { name: 'Reading progress' })).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('135 spent · 60 committed · 305 left of 500 USDC')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('names each share, and the remainder, when there are several segments', () => {
    renderWithRouter(<ProgressBar label="Budget" segments={[{ value: 27, label: 'Spent' }, { value: 12, label: 'Committed', tone: 'secondary' }]} />);
    expect(screen.getByRole('img', { name: 'Budget: Spent 27%, Committed 12%, Remaining 61%' })).toBeInTheDocument();
  });

  it('clamps segments to the track and draws the marker', () => {
    const { container } = renderWithRouter(<ProgressBar label="Over" segments={[{ value: 80, label: 'A' }, { value: 50, label: 'B' }]} marker={90} />);
    const rects = container.querySelectorAll('rect');
    // track, two segments, marker
    expect(rects).toHaveLength(4);
    expect(rects[2]).toHaveAttribute('width', '20');
    expect(rects[3]).toHaveAttribute('x', '89.5');
  });

  it('reads the cumulatively placed shares the bar draws, and names the overflow', () => {
    renderWithRouter(<ProgressBar label="Budget" segments={[{ value: 80, label: 'Spent' }, { value: 50, label: 'Committed' }]} />);
    expect(screen.getByRole('img', { name: 'Budget: Spent 80%, Committed 20%, Remaining 0%, Over by 30%' })).toBeInTheDocument();
  });

  it('a single overflowing segment says so in its value text', () => {
    renderWithRouter(<ProgressBar label="Used" segments={[{ value: 130, label: 'Used' }]} />);
    const bar = screen.getByRole('progressbar', { name: 'Used' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '100%, over by 30%');
  });

  it('a visible label names the bar', () => {
    renderWithRouter(<ProgressBar label="Kit coverage: 70%" showLabel grow segments={[{ value: 70, label: 'Covered' }]} />);
    expect(screen.getByRole('progressbar', { name: 'Kit coverage: 70%' })).toHaveAttribute('aria-valuenow', '70');
    expect(screen.getByText('Kit coverage: 70%')).toBeVisible();
  });

  it('is hidden from assistive tech when decorative', () => {
    renderWithRouter(<ProgressBar label="Kit" decorative segments={[{ value: 70, label: 'Done' }]} caption="12 of 17" />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('12 of 17')).toBeInTheDocument();
  });
});
