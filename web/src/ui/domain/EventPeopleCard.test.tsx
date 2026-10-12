import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './EventPeopleCard.example';

describe('D98 EventPeopleCard', () => {
  it('renders both variants with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByText('[Founder name] · speaking')).toBeInTheDocument();
    expect(screen.getByText('No ambassadors asked yet.')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
