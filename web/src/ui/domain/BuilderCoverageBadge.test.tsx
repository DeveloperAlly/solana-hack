import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderCoverageBadge.example';

describe('BuilderCoverageBadge', () => {
  it('names each state for assistive tech and shows the legend, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getAllByText('Evidenced')).toHaveLength(1);
    expect(screen.getByText('Evidenced: found in a source, cited')).toBeInTheDocument();
    expect(screen.getByText('Missing: we ask you')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
