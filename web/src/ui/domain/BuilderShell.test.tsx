import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderShell.example';
import { BuilderShell } from './BuilderShell';

describe('BuilderShell', () => {
  it('renders a page with skip link, banner and one main landmark, with no axe violations', async () => {
    const { container } = renderWithRouter(<BuilderShell context="Build your brand: JamJam" action={<a href="/x">Save and finish later</a>}><p>Wizard body.</p></BuilderShell>);
    expect(screen.getByText('Build your brand: JamJam')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Wizard body.');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    await expectNoAxeViolations(container);
  });
  it('preview adds no landmarks of its own', () => {
    renderWithRouter(example.render());
    expect(screen.getByText('Unverified')).toBeInTheDocument();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Save and finish later' })).toHaveAttribute('href', '/system');
  });
});
