import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createBrandScopedStore } from './brandScopedStore';
import { createStore } from './createStore';

describe('createBrandScopedStore', () => {
  it('keeps one state per brand and follows the active brand', () => {
    const account = createStore({ brand: 'jamjam' });
    const drafts = createBrandScopedStore<{ text: string }>({ read: () => account.read().brand, use: () => account.use()[0].brand });
    function View() {
      const [d] = drafts.use();
      return <p>{d.text ?? 'default'}</p>;
    }
    render(<View />);
    act(() => drafts.set({ text: 'JamJam draft' }));
    expect(screen.getByText('JamJam draft')).toBeInTheDocument();
    act(() => account.set({ brand: 'adna' }));
    expect(screen.getByText('default')).toBeInTheDocument();
    expect(drafts.read()).toEqual({});
    act(() => drafts.set({ text: 'aDNA draft' }));
    act(() => account.set({ brand: 'jamjam' }));
    expect(screen.getByText('JamJam draft')).toBeInTheDocument();
    act(() => drafts.reset());
    expect(screen.getByText('default')).toBeInTheDocument();
  });

  it('forBrand reads and writes one named brand, the same state the active-brand store shows for it', () => {
    const account = createStore({ brand: 'jamjam' });
    const drafts = createBrandScopedStore<{ text: string }>({ read: () => account.read().brand, use: () => account.use()[0].brand });
    const gamerslab = drafts.forBrand('gamerslab');
    expect(drafts.forBrand('gamerslab')).toBe(gamerslab);
    act(() => gamerslab.set({ text: 'GamersLab draft' }));
    expect(drafts.read()).toEqual({});
    act(() => account.set({ brand: 'gamerslab' }));
    expect(drafts.read()).toEqual({ text: 'GamersLab draft' });
  });
});
