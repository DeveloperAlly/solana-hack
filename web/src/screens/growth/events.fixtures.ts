// Sample data for Events and Event-Detail (canvas v21 boards Events and Event-Detail; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
// Event names stay bracketed and never name a real event; people are bracketed ("[Founder name]", "[Creator name]").
// Dates are samples around the sample "today" (13 Oct 2026). Plans come from the role's template (domain/event.ts);
// their drafts are ordinary drafts (./drafts.ts). Guest counts and results are sample figures from the boards where the
// boards give them (140 guests); the rest are marked sample in the gallery's "Sample data" flag.
import { planFor, type BrandEvent, type EventPerson, type EventRole } from '../../domain/event';
import { sampleDraft } from './drafts';
import type { EventDetailData, EventsData } from './types';

const today = '2026-10-13';
const calendarId = 'cal-[your-calendar]';

const ambassadors = (n: number): EventPerson[] => Array.from({ length: n }, (_, i) => ({ id: `amb-${i + 1}`, name: '[Creator name]', role: 'ambassador' as const }));
const founder = (role: 'speaking' | 'hosting'): EventPerson => ({ id: 'founder', name: '[Founder name]', role });

/** An event with its role's plan, and the given drafts attached by phase. */
function event(e: Omit<BrandEvent, 'plan'> & { role: EventRole | null }, drafts: Partial<Record<string, string[]>> = {}): BrandEvent {
  const plan = e.role ? planFor(e.id, e.role).map((item) => (item.kind === 'posts' ? { ...item, draftIds: drafts[item.phase] ?? [] } : item)) : [];
  return { ...e, plan };
}

export const eventDrafts = [
  sampleDraft({ id: 'd-night-announce', name: 'Announce: speaking at agent tooling night', platform: 'x', campaign: 'Launch week', text: 'I’m speaking at agent tooling night: why your agent didn’t forget, it was never told. [details]', published: true }),
  sampleDraft({ id: 'd-night-teaser', name: 'Countdown: talk teaser', platform: 'x', campaign: 'Launch week', text: '[Draft] Talk teaser: three days to agent tooling night.' }),
  sampleDraft({ id: 'd-night-learn', name: 'Countdown: what you’ll learn', platform: 'linkedin', campaign: 'Launch week', text: '[Draft] What you’ll learn at agent tooling night.' }),
  sampleDraft({ id: 'd-night-findme', name: 'Countdown: find me there', platform: 'x', campaign: 'Launch week', text: '[Draft] Find me at agent tooling night.', approved: true }),
  sampleDraft({ id: 'd-night-live', name: 'Live: slide-by-slide thread', platform: 'x', campaign: 'Launch week', text: '[Draft] Slide 1: your agent didn’t forget.' }),
  sampleDraft({ id: 'd-demo-announce', name: 'Announce: sponsoring demo day', platform: 'linkedin', campaign: 'Hackathon push', text: 'aDNA is sponsoring [Hackathon] demo day. [details]', approved: true }),
  sampleDraft({ id: 'd-clinic-countdown', name: 'Countdown: I’ll be there', platform: 'x', campaign: '', text: 'At the agent context clinic today. Say hi.', published: true }),
];

export const brandEvents: BrandEvent[] = [
  event({
    id: 'ev-clinic', name: '[Workshop] agent context clinic', startsAt: '2026-10-13T10:00', endsAt: '2026-10-13T16:00', place: 'Online',
    source: { kind: 'manual' }, status: 'accepted', role: 'attending', campaign: null, guests: null, cancelled: false,
    going: [], results: null, boardId: null,
  }, { countdown: ['d-clinic-countdown'] }),
  event({
    id: 'ev-night', name: '[Conference] side event: agent tooling night', startsAt: '2026-10-16T18:00', endsAt: '2026-10-16T21:00', place: 'Singapore',
    source: { kind: 'luma', calendarId, eventId: 'evt-[night]' }, status: 'accepted', role: 'speaking', campaign: 'Launch week', guests: 140, cancelled: false,
    going: [founder('speaking'), ...ambassadors(3)], results: null, boardId: 'b-night',
  }, { announce: ['d-night-announce'], countdown: ['d-night-teaser', 'd-night-learn', 'd-night-findme'], live: ['d-night-live'] }),
  event({
    id: 'ev-demo', name: '[Hackathon] demo day', startsAt: '2026-10-25T13:00', endsAt: '2026-10-25T18:00', place: 'Online',
    source: { kind: 'luma', calendarId, eventId: 'evt-[demo]' }, status: 'accepted', role: 'sponsoring', campaign: 'Hackathon push', guests: null, cancelled: false,
    going: ambassadors(5), results: null, boardId: 'b-demo',
  }, { announce: ['d-demo-announce'] }),
  event({
    id: 'ev-meetup', name: '[City] builders meetup', startsAt: '2026-11-04T18:00', endsAt: '2026-11-04T21:00', place: 'Melbourne',
    source: { kind: 'manual' }, status: 'accepted', role: 'hosting', campaign: null, guests: null, cancelled: false,
    going: [], results: null, boardId: 'b-meetup',
  }),
  event({
    id: 'ev-summit-side', name: '[Summit] side event', startsAt: '2026-11-12T19:00', endsAt: '2026-11-12T22:00', place: 'Lisbon',
    source: { kind: 'luma', calendarId, eventId: 'evt-[summit]' }, status: 'pending', role: null, campaign: null, guests: null, cancelled: false,
    going: [], results: null, boardId: null,
  }),
  event({
    id: 'ev-main-stage', name: '[Conference] main stage', startsAt: '2026-09-18T09:00', endsAt: '2026-09-19T18:00', place: 'Singapore',
    source: { kind: 'luma', calendarId, eventId: 'evt-[main]' }, status: 'accepted', role: 'speaking', campaign: 'Launch week', guests: null, cancelled: false,
    going: [founder('speaking'), ...ambassadors(2)], results: { postsVerified: 6, reach: null, leads: 4, costUsdc: 60 }, boardId: 'b-main',
  }),
  event({
    id: 'ev-meetup-sep', name: '[City] builders meetup, September', startsAt: '2026-09-02T18:00', endsAt: '2026-09-02T21:00', place: 'Melbourne',
    source: { kind: 'manual' }, status: 'accepted', role: 'hosting', campaign: null, guests: null, cancelled: false,
    going: [founder('hosting')], results: { postsVerified: 3, reach: null, leads: 2, costUsdc: null }, boardId: 'b-meetup',
  }),
  event({
    id: 'ev-hack-aug', name: '[Hackathon] kickoff', startsAt: '2026-08-20T10:00', endsAt: '2026-08-20T17:00', place: 'Online',
    source: { kind: 'luma', calendarId, eventId: 'evt-[kickoff]' }, status: 'accepted', role: 'attending', campaign: null, guests: null, cancelled: false,
    going: [], results: { postsVerified: 1, reach: null, leads: 1, costUsdc: null }, boardId: 'b-demo',
  }),
];

const base: EventsData = { brand: 'aDNA', today, events: brandEvents, drafts: eventDrafts, lumaCalendar: 'lu.ma/[your-calendar]' };

export const events: EventsData = base;
/** No events yet, and Luma not connected (canvas Events: "no events (connect Luma or add one)"). */
export const eventsEmpty: EventsData = { ...base, events: [], drafts: [], lumaCalendar: null };

export const eventDetail: EventDetailData = { ...base, defaultId: 'ev-night' };
/** Canvas Event-Detail "plan empty": the event has no plan yet. */
export const eventDetailPlanEmpty: EventDetailData = { ...eventDetail, events: brandEvents.map((e) => (e.id === 'ev-night' ? { ...e, plan: [] } : e)) };
/** Canvas Event-Detail "Luma event cancelled (error banner)". */
export const eventDetailCancelled: EventDetailData = { ...eventDetail, events: brandEvents.map((e) => (e.id === 'ev-night' ? { ...e, cancelled: true } : e)) };
