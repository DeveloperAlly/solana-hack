import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createStore } from './createStore';

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
