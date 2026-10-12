import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';
import { VerifyResultCard } from './VerifyResultCard';
import { VerifyResultCardDemo } from './VerifyResultCard.example';

describe('D34 VerifyResultCard', () => {
  it('renders the title, summary, details and actions', () => {
    render(
      <VerifyResultCard tone="match" title="Brand-approved: yes" summary="Exact match." actions={<button type="button">Act</button>}>
        <p>details</p>
      </VerifyResultCard>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Brand-approved: yes' })).toBeInTheDocument();
    expect(screen.getByText('Exact match.')).toBeInTheDocument();
    expect(screen.getByText('details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument();
  });
  it('maps each tone to its card style', () => {
    const { container, rerender } = render(<VerifyResultCard tone="retracted" title="t" />);
    expect(container.firstElementChild?.className).toContain('emphasis');
    rerender(<VerifyResultCard tone="nomatch" title="t" />);
    expect(container.firstElementChild?.className).toContain('dashed');
  });
  it('has no axe violations', async () => {
    const { container } = render(<VerifyResultCardDemo />);
    await expectNoAxeViolations(container);
  });
});
