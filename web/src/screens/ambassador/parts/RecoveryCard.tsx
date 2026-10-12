import { useState, type ReactNode } from 'react';
import { Button, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { withBrand } from '../copy';
import type { Recovery } from '../types';

export interface RecoveryCardProps {
  recovery: Recovery;
  /** Where the action goes; absent for a request sent from here ("Ask aDNA to review"). */
  href?: string;
  /** The campaign's brand, for "{brand}" in the copy. */
  brand: string;
}

/** One way to recover from a failed check (canvas Amb-5c; note n-a5c). INTEGRATION: the review request is a POST on the submission. */
export function RecoveryCard({ recovery, href, brand }: RecoveryCardProps) {
  const t = (text = '') => withBrand(text, brand);
  const [sent, setSent] = useState(false);
  const variant = recovery.primary ? 'primary' : 'secondary';
  let action: ReactNode = <Button variant={variant} onClick={() => setSent(true)}>{t(recovery.actionLabel)}</Button>;
  if (href) action = <Button href={href} variant={variant}>{t(recovery.actionLabel)}</Button>;
  else if (sent) action = <Text variant="label" role="status">{t(recovery.doneLabel)}</Text>;
  return (
    <Card as="div">
      <Text as="strong">{t(recovery.title)}</Text>
      <Text variant="small" tone="secondary">{t(recovery.body)}</Text>
      {action}
    </Card>
  );
}
