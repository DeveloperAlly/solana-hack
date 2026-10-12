import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { Logo } from './Logo';
import { LogoExample } from './Logo.example';

describe('Logo', () => {
  it('renders the mark and wordmark with the accessible name JamJam', () => {
    const { container } = render(<Logo />);
    const img = screen.getByRole('img', { name: 'JamJam' });
    expect(img).toHaveTextContent('JamJam');
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('mark-only keeps the accessible name and drops the wordmark', () => {
    render(<Logo variant="mark" size="lg" />);
    const img = screen.getByRole('img', { name: 'JamJam' });
    expect(img).not.toHaveTextContent('JamJam');
    expect(img.className).toContain('size-lg');
  });

  it('draws with currentColor only (no fills or raw colours)', () => {
    const { container } = render(<Logo />);
    const markup = container.innerHTML;
    expect(markup).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
    container.querySelectorAll('svg *').forEach((el) => expect(el.getAttribute('fill')).toBeNull());
  });

  it('has no axe violations in the example', async () => {
    const { container } = render(<LogoExample />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    if (results.violations.length) console.error(JSON.stringify(results.violations, null, 2));
    expect(results.violations).toHaveLength(0);
  });
});
