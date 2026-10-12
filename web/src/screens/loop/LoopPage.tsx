import type { ReactNode } from 'react';
import type { RouteTag } from '../../config/routes';
import type { StageId } from '../../config/nav';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { Button, Container, Stack } from '../../ui/primitives';
import { AppShell } from '../../ui/shells/AppShell';
import { useLoopLinks } from './paths';

export interface LoopPageProps {
  stage: StageId;
  tab?: string;
  /** `phone` for the M-* boards. */
  width?: 'app' | 'phone';
  brandName: string;
  /** The board's canvas tag; a flagged tag (Coming soon, Roadmap) shows as a chip in the bar. */
  tag: RouteTag;
  children: ReactNode;
}

/**
 * The loop screens' frame: L1 AppShell on the one nav (config/nav.ts), the brand chip that opens Brand-Switcher (as
 * every canvas v24 app board draws it), and the page body. A composition, no styles of its own.
 */
export function LoopPage({ stage, tab, width = 'app', brandName, tag, children }: LoopPageProps) {
  const { links } = useLoopLinks();
  const brandChip = <Button variant="secondary" href={links.brandSwitcher} aria-label={`${brandName}, switch brand`}>{brandName} ▾</Button>;
  return (
    <AppShell stage={stage} tab={tab} width={width} brandSlot={brandChip} flags={<ComingSoonFlag tag={tag} />}>
      {width === 'phone' ? children : <Container width="app"><Stack gap={6}>{children}</Stack></Container>}
    </AppShell>
  );
}
