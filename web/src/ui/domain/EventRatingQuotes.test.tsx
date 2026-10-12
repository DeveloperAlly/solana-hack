import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './EventRatingQuotes.example';

describe('D101 EventRatingQuotes', () => {
  it('renders both variants with no axe violations; the reply sits under its rating', async () => {
    const { container } = renderWithRouter(example.render());
    const items = screen.getAllByRole('listitem');
    expect(within(items[1]).getByText(/next year the investor table/)).toBeInTheDocument();
    expect(within(items[0]).queryByText(/Organiser reply/)).toBeNull();
    await expectNoAxeViolations(container);
  });

  it('an edited rating keeps its earlier version; a removed one is a tombstone with date and reason', () => {
    renderWithRouter(example.render());
    expect(screen.getByText('Edited, see earlier versions (1)')).toBeInTheDocument();
    expect(screen.getByText('“The ‘investor table’ was sales.”')).toBeInTheDocument();
    expect(screen.getByText(/^Removed \[date\]: Named a private person/)).toBeInTheDocument();
  });
});
