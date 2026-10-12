// Event domain type (canvas v21 boards Events and Event-Detail, COMING SOON; issue #90 coordination comment, row
// "Events": "EventSource is luma (calendar plus event id) or manual. Plan templates are keyed by role. Plan items are
// ordinary drafts, not a second draft system"). Sources live in the registry config/eventSources.ts.

/** Where an event came from. Luma events carry the calendar and event ids; hand-added ones carry nothing else. */
export type EventSource = { kind: 'luma'; calendarId: string; eventId: string } | { kind: 'manual' };
export type EventSourceKind = EventSource['kind'];

/** What the brand does at the event (canvas Events "Role" filter). */
export const eventRoles = [
  { id: 'hosting', label: 'Hosting' },
  { id: 'speaking', label: 'Speaking' },
  { id: 'sponsoring', label: 'Sponsoring' },
  { id: 'attending', label: 'Attending' },
] as const;
export type EventRole = (typeof eventRoles)[number]['id'];
export const roleLabel = (role: EventRole): string => eventRoles.find((r) => r.id === role)!.label;
export const isEventRole = (v: string): v is EventRole => eventRoles.some((r) => r.id === v);

/** Content plan phases, in time order (canvas Event-Detail: Announce, Countdown, Live, Recap, Follow up). */
export const planPhases = [
  { id: 'announce', label: 'Announce' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'live', label: 'Live' },
  { id: 'recap', label: 'Recap' },
  { id: 'follow-up', label: 'Follow up' },
] as const;
export type PlanPhase = (typeof planPhases)[number]['id'];
/** Phases that happen after the event ends; before then their items wait ("After the event"). */
export const afterPhases: readonly PlanPhase[] = ['recap', 'follow-up'];

/**
 * What a plan step produces. `posts` are ordinary drafts (the Create draft type); `ambassadors` is a live kit for
 * ambassadors who are going (Grow › Ambassadors); `leads` turns people met into leads (Grow › Leads).
 */
export type PlanStepKind = 'posts' | 'ambassadors' | 'leads';

export interface PlanStep {
  phase: PlanPhase;
  kind: PlanStepKind;
  /** What the step makes, as the board words it. */
  brief: string;
  /** When, relative to the event, as shown ("14 days before"). */
  timing: string;
  /** How many drafts a `posts` step plans (0 for the other kinds). */
  posts: number;
}

/**
 * The one plan-template table, keyed by role. Speaking is the canvas Event-Detail plan word for word; the other
 * roles follow the same five phases with the canvas's own wording where it has some (Events: "a content plan for
 * before, during and after, with ambassadors who are going"). Changing an event's role swaps its template.
 */
export const planTemplates: Record<EventRole, readonly PlanStep[]> = {
  speaking: [
    { phase: 'announce', kind: 'posts', brief: 'X + LinkedIn: "I’m speaking at…"', timing: '14 days before', posts: 1 },
    { phase: 'countdown', kind: 'posts', brief: '3 posts: talk teaser, what you’ll learn, find me there', timing: '3 days before', posts: 3 },
    { phase: 'live', kind: 'posts', brief: 'Slide-by-slide thread, ready to post as you speak', timing: 'On the day', posts: 1 },
    { phase: 'live', kind: 'ambassadors', brief: 'Ambassadors attending get a live kit', timing: 'On the day', posts: 0 },
    { phase: 'recap', kind: 'posts', brief: 'Recap post from your notes and photos; claims checked', timing: 'Within 24 h', posts: 1 },
    { phase: 'follow-up', kind: 'leads', brief: 'People you met become leads with a drafted follow-up', timing: 'Within 3 days', posts: 0 },
  ],
  hosting: [
    { phase: 'announce', kind: 'posts', brief: 'Invite post with the event page link', timing: '21 days before', posts: 1 },
    { phase: 'countdown', kind: 'posts', brief: '2 posts: who’s speaking, last places', timing: '5 days before', posts: 2 },
    { phase: 'live', kind: 'posts', brief: 'Live thread from the room', timing: 'On the day', posts: 1 },
    { phase: 'live', kind: 'ambassadors', brief: 'Ambassadors attending get a live kit', timing: 'On the day', posts: 0 },
    { phase: 'recap', kind: 'posts', brief: 'Recap and thank-you post; claims checked', timing: 'Within 24 h', posts: 1 },
    { phase: 'follow-up', kind: 'leads', brief: 'Guests become leads with a drafted follow-up', timing: 'Within 3 days', posts: 0 },
  ],
  sponsoring: [
    { phase: 'announce', kind: 'posts', brief: 'Sponsor announcement', timing: '14 days before', posts: 1 },
    { phase: 'countdown', kind: 'posts', brief: '2 posts: what we’re bringing, where to find us', timing: '3 days before', posts: 2 },
    { phase: 'live', kind: 'ambassadors', brief: 'Ambassadors attending get a live kit', timing: 'On the day', posts: 0 },
    { phase: 'recap', kind: 'posts', brief: 'Recap post; claims checked', timing: 'Within 24 h', posts: 1 },
    { phase: 'follow-up', kind: 'leads', brief: 'People you met become leads with a drafted follow-up', timing: 'Within 3 days', posts: 0 },
  ],
  attending: [
    { phase: 'countdown', kind: 'posts', brief: '"I’ll be there" post', timing: '3 days before', posts: 1 },
    { phase: 'recap', kind: 'posts', brief: 'What you learned, from your notes; claims checked', timing: 'Within 24 h', posts: 1 },
    { phase: 'follow-up', kind: 'leads', brief: 'People you met become leads with a drafted follow-up', timing: 'Within 3 days', posts: 0 },
  ],
};

/** One step of an event's plan. Its drafts are ordinary drafts, referenced by id; their status is the item's status. */
export interface EventPlanItem {
  id: string;
  phase: PlanPhase;
  kind: PlanStepKind;
  brief: string;
  timing: string;
  /** Planned post count (a `posts` step). */
  posts: number;
  /** Draft ids (the shared draft/post type); empty until drafted. */
  draftIds: string[];
}

/** Builds an event's plan from its role's template. Drafts already made for a phase stay with that phase. */
export function planFor(eventId: string, role: EventRole, existing: readonly EventPlanItem[] = []): EventPlanItem[] {
  return planTemplates[role].map((step, i) => {
    const kept = step.kind === 'posts' ? existing.filter((e) => e.phase === step.phase && e.kind === 'posts').flatMap((e) => e.draftIds) : [];
    return { id: `${eventId}-${step.phase}-${step.kind}-${i}`, ...step, draftIds: kept };
  });
}

/** Where an event is relative to now (canvas Event-Detail states: before, on the day, after). */
export type EventTiming = 'before' | 'live' | 'after';

/** Whether a Luma event has been accepted into the brand's events, skipped, or is waiting for a decision. */
export type EventStatus = 'pending' | 'accepted' | 'skipped';

export interface EventPerson {
  id: string;
  /** Bracketed in samples: "[Founder name]", "[Creator name]". */
  name: string;
  role: 'speaking' | 'hosting' | 'ambassador' | 'team';
}

/** Results after the event (canvas Event-Detail "Results": posts verified, reach, leads, cost). Null before it ends. */
export interface EventResults {
  postsVerified: number;
  /** Reach where the platform shares it; null shows "not available", never an estimate (canvas note n-c2). */
  reach: number | null;
  leads: number;
  /** USDC spent on ambassador payouts; null when none. */
  costUsdc: number | null;
}

export interface BrandEvent {
  id: string;
  /** Always bracketed in samples ("[Conference] side event"); never a real event. */
  name: string;
  /** Local date-time strings, "2026-10-16T18:00". */
  startsAt: string;
  endsAt: string;
  /** City, or "Online". */
  place: string;
  source: EventSource;
  status: EventStatus;
  /** Null only while a Luma event is pending: accepting asks for the role. */
  role: EventRole | null;
  campaign: string | null;
  /** Registered guests on Luma; null for hand-added events. */
  guests: number | null;
  /** Luma reported the event cancelled (canvas Event-Detail error banner). */
  cancelled: boolean;
  going: EventPerson[];
  results: EventResults | null;
  plan: EventPlanItem[];
  /** The event's page on the public events board, where attendees rate it; null when it is not listed. */
  boardId: string | null;
}

/** Where an event is on `today` (local dates, "2026-10-13"): before it starts, on its day(s), or after it ends. */
export function eventTiming(event: Pick<BrandEvent, 'startsAt' | 'endsAt'>, today: string): EventTiming {
  if (today < event.startsAt.slice(0, 10)) return 'before';
  if (today > event.endsAt.slice(0, 10)) return 'after';
  return 'live';
}

/** Kinds of event on the public events board (canvas v21 Events-Board "Kind" filter). */
export const boardEventKinds = [
  { id: 'conference', label: 'Conference' },
  { id: 'side-event', label: 'Side event' },
  { id: 'hackathon', label: 'Hackathon' },
  { id: 'meetup', label: 'Meetup' },
] as const;
export type BoardEventKind = (typeof boardEventKinds)[number]['id'];
