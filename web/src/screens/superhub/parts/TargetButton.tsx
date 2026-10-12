import type { ReactNode } from 'react';
import { Button } from '../../../ui/primitives';
import { useHubLinks } from '../paths';
import { useOpenDraft } from '../../../flows/drafts/openDraft';
import type { HubTarget } from '../types';

export interface TargetButtonProps {
  target: HubTarget;
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

/** A button to a HubTarget: a hub screen by link, or Draft-Review on the named draft (useOpenDraft). */
export function TargetButton({ target, variant = 'secondary', children }: TargetButtonProps) {
  const links = useHubLinks();
  const openDraft = useOpenDraft();
  const { draftId, href } = target;
  if (draftId !== undefined) return <Button variant={variant} onClick={() => openDraft(draftId)}>{children}</Button>;
  return <Button variant={variant} href={links[href]}>{children}</Button>;
}
