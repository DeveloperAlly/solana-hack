import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createBrandScopedStore, createStore } from './brandScopedStore';

describe('createStore', () => {
  it('merges patches, notifies components and resets', () => {
    const store = createStore({ a: 1, b: 'x' });
    function View() {
      const [s] = store.use();
      return <p>{`${s.a}-${s.b}`}</p>;
    }
    render(<View />);
    act(() => store.set({ a: 2 }));
    expect(screen.getByText('2-x')).toBeInTheDocument();
    act(() => store.reset());
    expect(screen.getByText('1-x')).toBeInTheDocument();
  });
});

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
});
