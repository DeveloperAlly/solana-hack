import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './EventResultsCard.example';

describe('D99 EventResultsCard', () => {
  it('renders both variants with no axe violations; missing reach is never estimated', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByText('Not available')).toBeInTheDocument();
    expect(screen.getByText('120 USDC')).toBeInTheDocument();
    expect(screen.getByText(/Appear after the event/)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
