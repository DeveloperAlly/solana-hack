import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { Badge, Grid } from '.';
import badgeStyles from './Badge.module.css';

describe('C5 Badge', () => {
  it.each(['neutral', 'solid', 'success', 'warning'] as const)('renders tone %s as text with its class', (tone) => {
    renderWithRouter(<Badge tone={tone}>{tone} label</Badge>);
    const el = screen.getByText(`${tone} label`);
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toContain(badgeStyles.badge);
    if (tone !== 'neutral') expect(el.className).toContain(badgeStyles[tone]);
  });
});

describe('P9 Grid', () => {
  it.each(['sm', 'md', 'lg'] as const)('uses a token minimum width for min %s', (min) => {
    renderWithRouter(<Grid min={min} data-testid="g">x</Grid>);
    const el = screen.getByTestId('g');
    expect(el.style.display).toBe('grid');
    expect(el.style.gridTemplateColumns).toContain('var(--wl-space-12)');
  });
  it('resets list styling when rendered as a list and merges class and style', () => {
    renderWithRouter(<Grid as="ul" gap={3} className="extra" style={{ alignItems: 'start' }} data-testid="g"><li>a</li></Grid>);
    const el = screen.getByTestId('g');
    expect(el.tagName).toBe('UL');
    expect(el.className).toBe('wl-list extra');
    expect(el.style.gap).toBe('var(--wl-space-3)');
    expect(el.style.alignItems).toBe('start');
  });
});
