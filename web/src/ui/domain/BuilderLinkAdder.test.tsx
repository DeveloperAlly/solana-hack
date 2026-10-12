import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderLinkAdder.example';

describe('BuilderLinkAdder', () => {
  it('rejects a non-link inline and adds a valid one, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    const input = screen.getByRole('textbox', { name: 'Add a link' });
    await userEvent.type(input, 'not a link');
    await userEvent.click(screen.getByRole('button', { name: 'Add link' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a web address');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await expectNoAxeViolations(container);
    await userEvent.clear(input);
    await userEvent.type(input, 'docs.jamjam.tech/start');
    await userEvent.click(screen.getByRole('button', { name: 'Add link' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Added: docs.jamjam.tech/start')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });
});
