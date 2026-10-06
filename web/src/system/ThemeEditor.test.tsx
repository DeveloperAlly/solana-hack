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
});
