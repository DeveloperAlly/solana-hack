import { useMemo } from 'react';
import { eventTiming, planFor, type BrandEvent, type EventRole } from '../../domain/event';
import type { Post } from '../../domain/post';
import { uniqueId } from '../../lib/id';
import { sampleDraft } from './drafts';
import { growthSession, type EventEdit } from './session';
import type { EventsData } from './types';

export interface BrandEventsFlow {
  /** Every event with this session's changes: added by hand first, then the fixture's. */
  events: BrandEvent[];
  drafts: Map<string, Post>;
  /** Accepted events that have not ended, soonest first. */
  upcoming: BrandEvent[];
  /** Accepted events that have ended, latest first. */
  past: BrandEvent[];
  /** Luma events waiting to be accepted or skipped. */
  pending: BrandEvent[];
  /** Accepts a Luma event with a role; the role picks its plan template. INTEGRATION: POST /api/events/:id/accept (not built). */
  accept: (id: string, role: EventRole) => void;
  /** INTEGRATION: POST /api/events/:id/skip (not built). */
  skip: (id: string) => void;
  /** Changes an event's role: the plan swaps to that role's template; drafts already made keep their phase. */
  setRole: (id: string, role: EventRole) => void;
  /** Makes ordinary drafts for one plan item. INTEGRATION: POST /api/drafts with the event plan item as the brief (not built). */
  draftItem: (eventId: string, itemId: string) => void;
  /** Adds an event by hand. INTEGRATION: POST /api/events (not built). */
  add: (e: { name: string; date: string; time: string; place: string; role: EventRole }) => void;
}

/**
 * The brand's events with this session's changes (one hook for Grow-Home, Events and Event-Detail, so all three agree).
 * Fixtures are the defaults; edits (accept, skip, role, plan) and added events and drafts live in the growth session.
 */
export function useBrandEvents(data: EventsData): BrandEventsFlow {
  const [session, set] = growthSession.use();
  const events = useMemo(
    () => [...session.eventsAdded, ...data.events].map((e) => ({ ...e, ...session.eventEdits[e.id] })),
    [session.eventsAdded, session.eventEdits, data.events],
  );
  const drafts = useMemo(() => new Map([...data.drafts, ...session.draftsAdded].map((d) => [d.id, d])), [data.drafts, session.draftsAdded]);
  const accepted = events.filter((e) => e.status === 'accepted');
  const upcoming = accepted.filter((e) => eventTiming(e, data.today) !== 'after').sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = accepted.filter((e) => eventTiming(e, data.today) === 'after').sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const find = (id: string) => events.find((e) => e.id === id);
  const edit = (id: string, patch: EventEdit) => set({ eventEdits: { ...session.eventEdits, [id]: { ...session.eventEdits[id], ...patch } } });

  return {
    events,
    drafts,
    upcoming,
    past,
    pending: events.filter((e) => e.status === 'pending'),
    accept: (id, role) => edit(id, { status: 'accepted', role, plan: planFor(id, role, find(id)?.plan) }),
    skip: (id) => edit(id, { status: 'skipped' }),
    setRole: (id, role) => edit(id, { role, plan: planFor(id, role, find(id)?.plan) }),
    draftItem: (eventId, itemId) => {
      const e = find(eventId);
      const item = e?.plan.find((i) => i.id === itemId);
      if (!e || !item || item.kind !== 'posts') return;
      const made = Array.from({ length: Math.max(1, item.posts) }, (_, i) =>
        sampleDraft({ id: uniqueId('draft'), name: `${e.name}: ${item.brief}${item.posts > 1 ? ` (${i + 1})` : ''}`, platform: 'x', campaign: e.campaign ?? '', text: `[Draft] ${item.brief}` }),
      );
      set({
        draftsAdded: [...made, ...session.draftsAdded],
        eventEdits: { ...session.eventEdits, [eventId]: { ...session.eventEdits[eventId], plan: e.plan.map((p) => (p.id === itemId ? { ...p, draftIds: made.map((d) => d.id) } : p)) } },
      });
    },
    add: ({ name, date, time, place, role }) => {
      const id = uniqueId('ev');
      const at = `${date}T${time}`;
      const e: BrandEvent = { id, name, startsAt: at, endsAt: at, place, source: { kind: 'manual' }, status: 'accepted', role, campaign: null, guests: null, cancelled: false, going: [], results: null, plan: planFor(id, role), boardId: null };
      set({ eventsAdded: [e, ...session.eventsAdded] });
    },
  };
}
