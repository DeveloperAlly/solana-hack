import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeEditor } from './ThemeEditor';
import { tokenMeta } from '../tokens/tokens';

describe('ThemeEditor', () => {
  it('removes its document overrides when it unmounts', () => {
    const cssVar = tokenMeta['action.primary.bg'].cssVar;
    const { unmount } = render(<ThemeEditor />);
    const input = document.getElementById('tok-action-primary-bg') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '#00bb55' } });
    expect(document.documentElement.style.getPropertyValue(cssVar)).toBe('#00bb55');
    unmount();
    expect(document.documentElement.style.getPropertyValue(cssVar)).toBe('');
  });
  it('reports a translucent colour as "Cannot check", not a pass', () => {
    render(<ThemeEditor />);
    const input = document.getElementById('tok-text-primary') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '#00000000' } });
    expect(screen.getAllByText('Cannot check').length).toBeGreaterThan(0);
  });
  it('resolves a {primitive} reference before applying it, and keeps the reference for export', () => {
    const cssVar = tokenMeta['action.primary.bg'].cssVar;
    const { unmount } = render(<ThemeEditor />);
    const input = document.getElementById('tok-action-primary-bg') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '{color.neutral.600}' } });
    expect(document.documentElement.style.getPropertyValue(cssVar)).toBe('#595959');
    expect(input.value).toBe('{color.neutral.600}');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    unmount();
  });
  it('flags an unknown {primitive} reference and does not apply it', () => {
    const cssVar = tokenMeta['action.primary.bg'].cssVar;
    const { unmount } = render(<ThemeEditor />);
    const input = document.getElementById('tok-action-primary-bg') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '{color.nope.1}' } });
    expect(document.documentElement.style.getPropertyValue(cssVar)).toBe('');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/Unknown primitive/)).toBeTruthy();
    unmount();
  });
});
