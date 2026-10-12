import { TabNav } from '../../../ui/composites/TabNav';
import { growthArtboards, useGrowthLinks } from '../paths';

export type GrowthSection = 'platforms' | 'referral' | 'badge' | 'tips' | 'team';

const sections: { id: GrowthSection; label: string; artboard: (typeof growthArtboards)[keyof typeof growthArtboards] }[] = [
  { id: 'platforms', label: 'Platforms', artboard: growthArtboards.platforms },
  { id: 'referral', label: 'Refer a friend', artboard: growthArtboards.referral },
  { id: 'badge', label: 'Check-it badge', artboard: growthArtboards.badge },
  { id: 'tips', label: 'Tips', artboard: growthArtboards.tips },
  { id: 'team', label: 'Team', artboard: growthArtboards.team },
];

/** The Growth section tabs under the hub bar: one link per signed-in Growth screen. */
export function GrowthNav({ current }: { current: GrowthSection }) {
  const links = useGrowthLinks();
  return <TabNav label="Grow" value={current} items={sections.map((s) => ({ id: s.id, label: s.label, href: links.to(s.artboard) }))} />;
}
