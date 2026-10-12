import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderCoverageMap.example';

describe('BuilderCoverageMap', () => {
  it('lists sections with states, gate markers and counted totals, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: /Purpose Gate 1/ })).toBeInTheDocument();
    expect(within(table).getAllByRole('columnheader', { name: 'The builder will' })).toHaveLength(2);
    expect(table).toHaveTextContent('E 0 · I 2 · M 1');
    expect(table).toHaveTextContent('E 2 · I 1 · M 0');
    await expectNoAxeViolations(container);
  });
});
