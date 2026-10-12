import type { ReactNode } from 'react';
import { StatePanel } from '../../ui/composites/StatePanel';
import { EmptyState } from '../../ui/composites/EmptyState';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';

export interface StateCopy {
  title: string;
  body?: ReactNode;
  actions?: ReactNode;
}

export interface StateViewProps {
  state: ScreenState;
  loading?: StateCopy;
  error?: StateCopy;
  empty?: StateCopy;
  /** The success view; also shown for a state with no copy given. */
  children?: ReactNode;
}

/** Maps a demo state to its view with a lookup: C29 StatePanel for loading and error, C3 EmptyState for empty. */
export function StateView({ state, loading, error, empty, children }: StateViewProps) {
  const views: Record<ScreenState, ReactNode> = {
    success: children,
    loading: loading && <StatePanel kind="loading" {...loading} />,
    error: error && <StatePanel kind="error" {...error} />,
    empty: empty && <EmptyState {...empty} />,
  };
  return <>{views[state] || children}</>;
}
