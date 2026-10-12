import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { Meter, meetsThreshold } from './Meter';
import { example } from './Meter.example';

describe('P25 Meter', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getAllByRole('meter')).toHaveLength(4);
    expect(screen.getByText('Publishing unlocks at 80%.')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('exposes value, range and value text, and marks below-threshold', () => {
    const { container } = renderWithRouter(<Meter label="Score" value={64} threshold={80} />);
    const meter = screen.getByRole('meter', { name: 'Score' });
    expect(meter).toHaveAttribute('aria-valuenow', '64');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuetext', '64, threshold 80');
    expect(container.firstElementChild).toHaveAttribute('data-below', 'true');
  });

  it('scales to a custom range', () => {
    const { container } = renderWithRouter(<Meter label="Fit" value={3} min={1} max={5} threshold={4} />);
    const rects = container.querySelectorAll('rect');
    expect(rects[1]).toHaveAttribute('width', '50');
    expect(rects[2]).toHaveAttribute('x', '74.5');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '3, threshold 4');
  });

  it('meetsThreshold treats a missing threshold as met', () => {
    expect(meetsThreshold(10)).toBe(true);
    expect(meetsThreshold(80, 80)).toBe(true);
    expect(meetsThreshold(79, 80)).toBe(false);
  });
});
