import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderSelect.example';

describe('BuilderSelect', () => {
  it('is labelled, described and changes value, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    const select = screen.getByRole('combobox', { name: 'Primary channel' });
    expect(select).toHaveAccessibleDescription('Where you post most.');
    await userEvent.selectOptions(select, 'LinkedIn');
    expect(select).toHaveValue('LinkedIn');
    await expectNoAxeViolations(container);
  });
});
