import type { ReactNode } from 'react';
import { Stack } from '../primitives';

export interface SoonStatusListProps {
  /** Accessible name of the list. */
  label: string;
  /** SoonStatusRow items. */
  children?: ReactNode;
}

/** The list that holds SoonStatusRow items; a plain ul with the list styling reset. */
export function SoonStatusList({ label, children }: SoonStatusListProps) {
  return (
    <Stack as="ul" gap={0} aria-label={label}>
      {children}
    </Stack>
  );
}
