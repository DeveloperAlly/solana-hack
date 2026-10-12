import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { CoverageBadge, coverageStatuses, coverageWord } from './CoverageBadge';
import { example } from './CoverageBadge.example';

describe('D51 CoverageBadge', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByText('Evidenced: found in a source, cited')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it.each(coverageStatuses)('letter display keeps the word %s for screen readers only', (status) => {
    renderWithRouter(<CoverageBadge status={status} />);
    expect(screen.getByText(coverageWord(status))).toHaveClass('wl-visually-hidden');
  });

  it('word display shows the word', () => {
    renderWithRouter(<CoverageBadge status="missing" display="word" />);
    expect(screen.getByText('Missing')).not.toHaveClass('wl-visually-hidden');
    expect(screen.getByText('M')).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses the EvidenceChip style for each status', () => {
    const { container } = renderWithRouter(<CoverageBadge status="inferred" />);
    expect(container.firstElementChild?.className).toMatch(/partly/);
  });
});
