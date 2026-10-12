import { useState } from 'react';
import { isEventRole, type BrandEvent, type EventRole } from '../../domain/event';
import { useBrandEvents, type BrandEventsFlow } from './useBrandEvents';
import type { EventsData, EventsTab } from './types';

export type RoleFilter = 'all' | EventRole;

export interface EventsFlow extends BrandEventsFlow {
  tab: EventsTab;
  setTab: (t: EventsTab) => void;
  role: RoleFilter;
  setRoleFilter: (r: string) => void;
  /** The tab's events under the role filter. */
  shown: BrandEvent[];
  adding: boolean;
  setAdding: (open: boolean) => void;
}

/** Events flow state (one hook): Upcoming or Past, the role filter, the add form, over the brand's events. */
export function useEvents(data: EventsData): EventsFlow {
  const base = useBrandEvents(data);
  const [tab, setTab] = useState<EventsTab>('upcoming');
  const [role, setRoleState] = useState<RoleFilter>('all');
  const [adding, setAdding] = useState(false);
  const list = tab === 'upcoming' ? base.upcoming : base.past;
  return {
    ...base,
    setRoleFilter: (r) => setRoleState(isEventRole(r) ? r : 'all'),
    tab,
    setTab,
    role,
    shown: role === 'all' ? list : list.filter((e) => e.role === role),
    adding,
    setAdding,
  };
}
