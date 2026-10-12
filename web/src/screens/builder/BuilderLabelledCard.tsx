import type { ReactNode } from 'react';
import { Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';

export interface BuilderLabelledCardProps {
  /** Bold label at the top, e.g. "Based on" or "Your edge". */
  label: string;
  /** Plain lines, each rendered as small text; or pass children for other content. */
  lines?: string[];
  children?: ReactNode;
}

/** A subtle card with a bold label over its lines (canvas gates: "Based on", "Alternative named", "Your edge", "Sample in this voice"). */
export function BuilderLabelledCard({ label, lines = [], children }: BuilderLabelledCardProps) {
  return (
    <Card variant="subtle" as="div">
      <Text variant="small"><strong>{label}</strong></Text>
      {lines.map((l) => <Text key={l} variant="small">{l}</Text>)}
      {children}
    </Card>
  );
}
