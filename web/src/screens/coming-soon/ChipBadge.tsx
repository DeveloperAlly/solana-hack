import { Badge } from '../../ui/primitives';
import type { Chip } from './status';

/** A C5 Badge from one of this page's chip lookups (status.ts). */
export function ChipBadge({ chip }: { chip: Chip }) {
  return <Badge tone={chip.tone}>{chip.label}</Badge>;
}
