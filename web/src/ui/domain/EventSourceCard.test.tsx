import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './EventSourceCard.example';

describe('D96 EventSourceCard', () => {
  it('renders with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('shows what connecting needs and each registry fact with its source', () => {
    renderWithRouter(example.render());
    expect(screen.getByText(/Importing needs Luma Plus/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Getting started with your API/ })).toHaveAttribute('href', 'https://docs.luma.com/reference/getting-started-with-your-api');
    expect(screen.getByText(/^Unverified: /)).toBeInTheDocument();
  });
});
