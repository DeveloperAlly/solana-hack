import { Badge, Stack } from '../../../ui/primitives';
import { ProgressBar } from '../../../ui/composites/ProgressBar';
import type { Check } from '../types';

/** Seats used of the plan's free seats, with the seat gate's label as the chip (the one source for the gate). */
export function GrowthSeatSummary({ used, limit, seats }: { used: number; limit: number; seats: Check }) {
  return (
    <Stack gap={2}>
      <ProgressBar label="Seats" segments={[{ value: Math.min(100, (used / limit) * 100), label: 'Used' }]} caption={`${used} of ${limit} seats used · partners and teammates join free (ADR-003)`} />
      <div>
        <Badge tone={seats.blocking ? 'warning' : 'neutral'}>{seats.blocking ? 'Seats full' : `${limit - used} free`}</Badge>
      </div>
    </Stack>
  );
}
