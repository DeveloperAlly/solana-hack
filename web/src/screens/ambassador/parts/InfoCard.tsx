import { useId, type ReactNode } from 'react';
import { Heading } from '../../../ui/primitives';
import { Card, type CardVariant } from '../../../ui/composites/Card';

export interface InfoCardProps {
  title: string;
  variant?: CardVariant;
  children?: ReactNode;
}

/** A section card named by its heading (canvas ".box .sec" with an h2): Brief, Rules, Budget, How you get paid. */
export function InfoCard({ title, variant = 'default', children }: InfoCardProps) {
  const id = useId();
  return (
    <Card variant={variant} labelledBy={id}>
      <Heading level={2} size="lg" id={id}>{title}</Heading>
      {children}
    </Card>
  );
}
