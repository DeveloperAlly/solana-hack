import { eventTiming, isEventRole, type BrandEvent, type EventTiming } from '../../domain/event';
import { draftStatus } from './drafts';
import { planByPhase, planReadiness, type PlanPhaseView, type PlanReadiness } from './eventPlan';
import { useGrowthParam } from './paths';
import { useBrandEvents } from './useBrandEvents';
import type { EventDetailData } from './types';

export interface EventDetailFlow {
  event: BrandEvent;
  timing: EventTiming;
  phases: PlanPhaseView[];
  readiness: PlanReadiness;
  /** Drafts in the plan waiting for the person. */
  needsYou: number;
  /** Swaps the plan to the role's template. */
  changeRole: (role: string) => void;
  /** Builds the plan from the current role's template (plan empty). */
  makePlan: () => void;
  draftItem: (itemId: string) => void;
}

/** Event-Detail flow state (one hook): the event from `?event=`, its plan by phase with statuses from its drafts. */
export function useEventDetail(data: EventDetailData): EventDetailFlow {
  const base = useBrandEvents(data);
  const param = useGrowthParam('event');
  const event = base.events.find((e) => e.id === param) ?? base.events.find((e) => e.id === data.defaultId) ?? base.events[0];
  const planned = event.plan.flatMap((i) => i.draftIds).map((id) => base.drafts.get(id)).filter((d) => d !== undefined);
  return {
    event,
    timing: eventTiming(event, data.today),
    phases: planByPhase(event, base.drafts, data.brainVersion, data.today),
    readiness: planReadiness(event, base.drafts, data.brainVersion),
    needsYou: planned.filter((d) => draftStatus(d, data.brainVersion) === 'needs-you').length,
    changeRole: (r) => isEventRole(r) && base.setRole(event.id, r),
    makePlan: () => base.setRole(event.id, event.role ?? 'attending'),
    draftItem: (itemId) => base.draftItem(event.id, itemId),
  };
}
