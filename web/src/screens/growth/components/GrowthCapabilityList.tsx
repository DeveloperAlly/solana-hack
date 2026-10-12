import { capabilities, type Capability, type Platform } from '../../../config/platforms';
import { Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { StatusList } from '../../../ui/composites/StatusList';
import { GrowthSourceNote } from './GrowthSourceNote';

const order = Object.keys(capabilities) as Capability[];

/** What JamJam plans to do on a platform: every capability, marked Planned or Not planned, plus what works today. */
export function GrowthCapabilityList({ platform }: { platform: Platform }) {
  const rows = order.map((c) => {
    const planned = platform.plans.includes(c);
    return { id: c, label: capabilities[c], status: planned ? 'Planned' : 'Not planned', tone: planned ? ('default' as const) : ('muted' as const) };
  });
  return (
    <Card>
      <StatusList label="What JamJam plans to do here" title rows={rows} />
      {platform.today && (
        <Text variant="small" tone="secondary">
          Works today: {platform.today.text} <GrowthSourceNote source={platform.today.source} />
        </Text>
      )}
    </Card>
  );
}
