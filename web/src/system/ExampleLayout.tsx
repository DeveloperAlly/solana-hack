import type { ReactNode } from 'react';
import { Grid } from '../ui/primitives';

/** Layout helper for workbench examples: a responsive grid of variants. */
export function ExampleGrid({ children }: { children: ReactNode }) {
  return <Grid min="sm" gap={4}>{children}</Grid>;
}
