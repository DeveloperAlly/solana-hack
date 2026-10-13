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

/** The event Event-Detail opened on, or why there is none: `?event=` names no event, or the brand has none yet. */
export type EventDetailLookup = { kind: 'found'; flow: EventDetailFlow } | { kind: 'missing'; id: string } | { kind: 'none' };

/**
 * Event-Detail flow state (one hook): the event from `?event=`, resolved by id from the brand's events merged with this
 * session's (an event added on Events opens here), else the default. "Missing" only when no event has that id.
 */
export function useEventDetail(data: EventDetailData): EventDetailLookup {
  const base = useBrandEvents(data);
  const param = useGrowthParam('event');
  const event = param ? base.events.find((e) => e.id === param) : (base.events.find((e) => e.id === data.defaultId) ?? base.events[0]);
  if (param && !event) return { kind: 'missing', id: param };
  if (!event) return { kind: 'none' };
  const planned = event.plan.flatMap((i) => i.draftIds).map((id) => base.drafts.get(id)).filter((d) => d !== undefined);
  const flow: EventDetailFlow = {
    event,
    timing: eventTiming(event, data.today),
    phases: planByPhase(event, base.drafts, base.brainVersion, data.today),
    readiness: planReadiness(event, base.drafts, base.brainVersion),
    needsYou: planned.filter((d) => draftStatus(d, base.brainVersion) === 'needs-you').length,
    changeRole: (r) => isEventRole(r) && base.setRole(event.id, r),
    makePlan: () => base.setRole(event.id, event.role ?? 'attending'),
    draftItem: (itemId) => base.draftItem(event.id, itemId),
  };
  return { kind: 'found', flow };
}
