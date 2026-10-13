import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { isStale, approve } from '../../lib/approval';
import { resetActiveBrand } from '../brand/activeBrand';
import { loopStore } from './store';
import { useBrainVersion } from './brainVersion';

// Hook order (Codex review on PR 111): useBrainVersion must call every hook on every render, so a consumer mounted
// with no stored version keeps working after a rule change stores one.
const approval = approve({ text: 'draft', brainVersion: '3.1' }, true);

function Consumer() {
  const version = useBrainVersion();
  return <p>{`v${version} · ${isStale(approval, { text: 'draft', brainVersion: version }) ? 'stale' : 'current'}`}</p>;
}

beforeEach(() => {
  loopStore.reset();
  resetActiveBrand();
});

describe('useBrainVersion', () => {
  it('re-renders without a hook-order error when a version is stored mid-session, and approvals go stale', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<Consumer />);
    expect(screen.getByText('v3.1 · current')).toBeInTheDocument();
    act(() => loopStore.set({ brainVersion: '3.2' }));
    expect(screen.getByText('v3.2 · stale')).toBeInTheDocument();
    act(() => loopStore.set({ brainVersion: '3.3' }));
    expect(screen.getByText('v3.3 · stale')).toBeInTheDocument();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
