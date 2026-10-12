import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderShell.example';

describe('BuilderShell', () => {
  it('renders the context, flags, action and one main landmark with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByText('Build your brand: JamJam')).toBeInTheDocument();
    expect(screen.getByText('Unverified')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Save and finish later' })).toHaveAttribute('href', '/system');
    expect(screen.getByRole('main')).toHaveTextContent('Wizard body.');
    await expectNoAxeViolations(container);
  });
});
