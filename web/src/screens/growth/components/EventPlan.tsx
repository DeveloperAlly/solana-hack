import { EventPlanPhase } from '../../../ui/domain/EventPlanPhase';
import { Heading, Stack } from '../../../ui/primitives';
import { useGrowthLinks } from '../paths';
import type { PlanPhaseView } from '../eventPlan';

/** The content plan by phase; each item's action opens its board or drafts it in place. */
export function EventPlan({ phases, onDraft }: { phases: PlanPhaseView[]; onDraft: (itemId: string) => void }) {
  const links = useGrowthLinks();
  return (
    <Stack gap={4}>
      <Heading level={2} size="lg">Content plan</Heading>
      {phases.map((p) => (
        <EventPlanPhase
          key={p.phase}
          title={p.title}
          timing={p.timing}
          level={3}
          items={p.items.map((i) => ({
            id: i.id,
            status: i.status,
            brief: i.brief,
            action: i.action && ('draft' in i.action ? { label: i.action.label, onClick: () => onDraft(i.id) } : { label: i.action.label, href: links.to(i.action.artboard) }),
          }))}
        />
      ))}
    </Stack>
  );
}
