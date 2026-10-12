// Event-source registry (issue #90 coordination comment, row "Events": "source registry"). Shaped like the platform
// registry (config/platforms.ts): one entry per source, with its status, what JamJam plans to do with it, how it
// connects and the facts behind it, each with a source. A new source (Eventbrite, Meetup and the like) is one more
// entry here plus one more EventSource kind in domain/event.ts; no screen changes.
//
// Truth rules (AGENTS rule 6): nothing syncs yet. web/worker has no event integration, so no source is Live. Facts carry
// the page they were read from; what is not confirmed says so in `unverified`, and the screens show it.
import { statusLabel, type PlatformStatus, type Source } from './platforms';
import type { EventSourceKind } from '../domain/event';

/** What JamJam does with an event source. */
export const eventSourceCapabilities = {
  list: 'List the calendar’s events',
  details: 'Read an event’s details',
  guests: 'Read who registered',
  webhooks: 'Hear about new and changed events',
  manual: 'Add an event by hand',
} as const;
export type EventSourceCapability = keyof typeof eventSourceCapabilities;

export interface EventSourceFact {
  text: string;
  source: Source;
}

export interface EventSourceDef {
  kind: EventSourceKind;
  name: string;
  status: PlatformStatus;
  plans: EventSourceCapability[];
  /** How a brand connects it. */
  connect: string;
  facts: EventSourceFact[];
  /** What connecting needs, and what to do without it; said on screen beside Connect. */
  requirement?: string;
  /** What is not confirmed yet, said on screen as unverified. */
  unverified: string[];
}

// Luma: read 2026-10-13, each page reached through a web search result.
// - Luma's API docs, "Getting started with your API" (https://docs.luma.com/reference/getting-started-with-your-api):
//   "To use the Luma API, you need a Luma Plus subscription", and each API key works for one calendar only.
// - The changelog (https://docs.luma.com/reference/changelog) lists GET /v1/calendars/events/list (a calendar's events),
//   GET /v1/events/get (one event), GET /v1/events/guests/list and /get (guests), and webhooks (POST /v2/webhooks/create
//   and related). It names a per-ticket `checked_in_at` field.
// - The help centre (https://help.luma.com/p/luma-api) says the same about Luma Plus and per-calendar keys.
// - Not confirmed: whether a third party (JamJam's public events board) can check one attendee's check-in for an event
//   whose organiser has not connected their calendar.
const lumaGettingStarted: Source = { label: 'Luma API docs, "Getting started with your API"', href: 'https://docs.luma.com/reference/getting-started-with-your-api' };
const lumaChangelog: Source = { label: 'Luma API changelog', href: 'https://docs.luma.com/reference/changelog' };

export const eventSources: EventSourceDef[] = [
  {
    kind: 'luma',
    name: 'Luma',
    status: 'planned',
    plans: ['list', 'details', 'guests', 'webhooks'],
    connect: 'Paste your Luma calendar API key',
    facts: [
      { text: 'The API lists a calendar’s events, gets one event, lists its guests and sends webhooks.', source: lumaChangelog },
      { text: 'The API needs a Luma Plus subscription, and each API key works for one calendar only.', source: lumaGettingStarted },
    ],
    requirement: 'Importing needs Luma Plus: Luma’s API requires it, and each API key covers one calendar. Without it, add events by hand.',
    unverified: ['Proving one guest’s check-in for an event whose organiser has not connected their calendar.'],
  },
  {
    kind: 'manual',
    name: 'Added by hand',
    status: 'soon',
    plans: ['manual'],
    connect: 'Nothing to connect',
    facts: [],
    unverified: [],
  },
];

export const findEventSource = (kind: EventSourceKind): EventSourceDef => eventSources.find((s) => s.kind === kind)!;
export const eventSourceStatus = (kind: EventSourceKind): string => statusLabel(findEventSource(kind).status);
