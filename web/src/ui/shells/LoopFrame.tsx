import type { ReactNode } from 'react';
import type { ArtboardName } from '../../config/artboards';
import type { RouteTag } from '../../config/routes';
import { navForArtboard } from '../../config/nav';
import { Button, Container, Stack } from '../primitives';
import { ComingSoonFlag } from '../domain/ComingSoonFlag';
import { PageHeader, type PageHeaderProps } from '../layouts/PageHeader';
import { useNavHref } from '../hooks/useNavHref';
import { AppShell } from './AppShell';

export interface LoopFrameProps {
  /** The board this screen is. Its stage and tab come from config/nav.ts `navForArtboard`, never from the frame. */
  artboard: ArtboardName;
  /** The board whose tab is current, when the canvas draws this board under another. */
  under?: ArtboardName;
  /** The board's canvas tag; a flagged tag (Coming soon, Roadmap) shows as a chip in the bar. Omit when the page shows it itself. */
  tag?: RouteTag;
  /** The brand in the bar. */
  brandName: string;
  /** The brand control; default: the brand chip that opens Brand-Switcher, as the canvas v24 app boards draw it. */
  brandSlot?: ReactNode;
  /** `phone` for the M-* boards: a phone-width column with the mobile tab bar. */
  width?: 'app' | 'phone';
  /** Body width at `app`: `app` (default) or `wizard` for a step form. */
  container?: 'app' | 'wizard';
  /** The page header, when the frame draws it; screens that draw their own header leave it out. */
  header?: PageHeaderProps;
  children: ReactNode;
}

/**
 * The signed-in loop frame: L1 AppShell on the one nav at the board's own stage and tab (ADR-012 decision 2), the
 * brand control, the canvas tag, an optional L5 PageHeader and the page body. A composition, no styles of its own.
 */
export function LoopFrame({ artboard, under, tag, brandName, brandSlot, width = 'app', container = 'app', header, children }: LoopFrameProps) {
  const { stage, tab } = navForArtboard(artboard, under);
  const href = useNavHref();
  const chip = brandSlot ?? <Button variant="secondary" href={href({ artboard: 'Brand-Switcher' })} aria-label={`${brandName}, switch brand`}>{brandName} ▾</Button>;
  const body = <>{header && <PageHeader {...header} />}{children}</>;
  return (
    <AppShell stage={stage} tab={tab} width={width} brandSlot={chip} flags={tag && <ComingSoonFlag tag={tag} />}>
      {width === 'phone' ? body : <Container width={container}><Stack gap={6}>{body}</Stack></Container>}
    </AppShell>
  );
}
