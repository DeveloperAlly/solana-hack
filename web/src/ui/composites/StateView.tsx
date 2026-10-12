import type { ReactNode } from 'react';
import type { HeadingLevel } from '../primitives/Heading';
import type { ScreenState } from './DemoStateSwitcher';
import { EmptyState } from './EmptyState';
import { StatePanel } from './StatePanel';
import styles from './StateView.module.css';

export interface StateCopy {
  title: string;
  body?: ReactNode;
  actions?: ReactNode;
  level?: HeadingLevel;
}

export interface StateViewProps {
  state: ScreenState;
  /** A view per state, for screens that draw something specific (a skeleton, a custom empty state). */
  views?: Partial<Record<ScreenState, ReactNode>>;
  /** Copy for the standard views: C29 StatePanel for loading and error, C3 EmptyState for empty. */
  loading?: StateCopy;
  error?: StateCopy;
  empty?: StateCopy;
  /** The success view; also shown for a state with neither a view nor copy. */
  children?: ReactNode;
}

/**
 * C35 StateView: maps the demo state (C28) to its view with one lookup, so screens never chain ternaries. A view in
 * `views` wins; otherwise copy renders the standard StatePanel or EmptyState; otherwise the success view shows.
 * Replaces Superhub's and Coming soon's StateView (issue #46, shared consolidation).
 */
export function StateView({ state, views, loading, error, empty, children }: StateViewProps) {
  const standard: Partial<Record<ScreenState, ReactNode>> = {
    loading: loading && <StatePanel kind="loading" {...loading} />,
    error: error && <StatePanel kind="error" {...error} />,
    empty: empty && <EmptyState {...empty} />,
  };
  return <div className={styles.root} data-state={state}>{views?.[state] ?? standard[state] ?? children ?? views?.success}</div>;
}
