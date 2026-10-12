import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { addToSummary, summaryScore } from '../../domain/rating';
import { example } from './EventRatingSummary.example';

describe('D100 EventRatingSummary', () => {
  it('renders both variants with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByText('2.2')).toBeInTheDocument();
    expect(screen.getByText('out of 5 · 41 registered · 40 shown')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Score by question' })).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText(/No ratings yet/)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('a new rating moves the means', () => {
    const first = addToSummary({ count: 0, removed: 0, averages: null }, { talks: 5, run: 4, people: 3, sponsors: 2, again: 1 });
    expect(summaryScore(first)).toBe(3);
    const second = addToSummary(first, { talks: 1, run: 2, people: 3, sponsors: 4, again: 5 });
    expect(second.count).toBe(2);
    expect(second.averages!.talks).toBe(3);
  });
});
