import type { ReactNode } from 'react';
import type { ScreenState } from '../../../ui/composites/DemoStateSwitcher';

export interface StateViewProps {
  state: ScreenState;
  /** One view per state the screen has; a missing state falls back to success. */
  views: Partial<Record<ScreenState, ReactNode>> & { success: ReactNode };
}

/** Maps the demo state (C28) to a view with a lookup object, so screens never chain ternaries. */
export function StateView({ state, views }: StateViewProps) {
  return <>{views[state] ?? views.success}</>;
}
