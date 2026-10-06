import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import axe from 'axe-core';
import { renderWithRouter } from '../../test/render';
import { App } from '../../App';

describe('Landing in PublicShell', () => {
  it('shows the nav, heading and primary action', () => {
    renderWithRouter(<App />, '/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toHaveTextContent('Waterlily');
    expect(screen.getByRole('link', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Check a post' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Build your brand. Then start creating.');
    expect(screen.getByRole('link', { name: 'Build my brand' })).toHaveAttribute('href', '/sign-in');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithRouter(<App />, '/');
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    if (results.violations.length) console.error(JSON.stringify(results.violations, null, 2));
    console.log(`axe: ${results.violations.length} violations, ${results.passes.length} rules passed`);
    expect(results.violations).toHaveLength(0);
  });
});
