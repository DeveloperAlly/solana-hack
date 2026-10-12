import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';
import { HubCoverageBadge } from './HubCoverageBadge';

describe('D51 HubCoverageBadge', () => {
  it('names each status in words and has no axe violations', async () => {
    const { container } = render(
      <p>
        <HubCoverageBadge status="evidenced" />
        <HubCoverageBadge status="inferred" showWord />
        <HubCoverageBadge status="missing" />
      </p>,
    );
    expect(screen.getByText('Evidenced')).toHaveClass('wl-visually-hidden');
    expect(screen.getByText(/Inferred/)).not.toHaveClass('wl-visually-hidden');
    expect(screen.getByText('Missing')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
