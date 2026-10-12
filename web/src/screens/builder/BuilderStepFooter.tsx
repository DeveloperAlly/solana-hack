import type { ReactNode } from 'react';
import { Button, Link, Stack } from '../../ui/primitives';

export interface BuilderStepFooterProps {
  back?: string;
  backLabel?: string;
  /** The quiet skip link ("Skip for now"). */
  skip?: { href: string; label: string };
  /** Primary and any other actions, right-aligned. */
  children?: ReactNode;
}

/** Wizard footer used by every Brand Builder step (canvas ".foot"): Back, a skip link, then the step's actions. */
export function BuilderStepFooter({ back, backLabel = 'Back', skip, children }: BuilderStepFooterProps) {
  return (
    <>
      {back ? <Button href={back} variant="secondary">{backLabel}</Button> : <span />}
      <Stack direction="row" gap={4} align="center" wrap>
        {skip && <Link href={skip.href}>{skip.label}</Link>}
        {children}
      </Stack>
    </>
  );
}
