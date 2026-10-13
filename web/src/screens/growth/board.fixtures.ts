// Sample data for the public events board (canvas v21 boards Events-Board and Event-Rating, ROADMAP;
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). Every event name is bracketed and never names a real event; raters
// are "Attendee" and the organiser is "[Organiser]". The overall scores and rating counts are the board's (4.1 / 212,
// 4.4 / 96, 2.2 / 41, 4.6 / 58); only [Summit] VIP dinner has a per-question split on the canvas. The other splits are
// sample values chosen to give the board's overall score. Ratings are append-only (ADR-012, canvas v26): one VIP-dinner
// rating has an earlier version, and one was removed after a report and stays as a tombstone that still counts as
// registered (41 registered · 40 shown). Attendance is the viewer's sample proof: nothing is checked.
import type { EventRating, RatingQuestionId } from '../../domain/rating';
import type { BoardEvent, EventRatingData, EventsBoardData } from './types';

const today = '2026-10-13';
const split = (talks: number, run: number, people: number, sponsors: number, again: number): Record<RatingQuestionId, number> => ({ talks, run, people, sponsors, again });
const placeholderRegistration = { hash: null, at: '[date]' };
const flat = (score: 1 | 2 | 3 | 4 | 5) => ({ talks: score, run: score, people: score, sponsors: score, again: score });

/** A sample rating with one version, or more when `earlier` gives the versions it replaced (oldest first). */
const rating = (id: string, eventId: string, score: 1 | 2 | 3 | 4 | 5, line: string, earlier: { score: 1 | 2 | 3 | 4 | 5; line: string }[] = []): EventRating => ({
  id, eventId, author: 'Attendee', proof: 'luma-checkin',
  versions: [...earlier, { score, line }].map((v) => ({ scores: flat(v.score), line: v.line, at: '[date]', registration: placeholderRegistration })),
});

export const boardEvents: BoardEvent[] = [
  {
    id: 'b-main', name: '[Conference] main stage', place: 'Singapore', when: 'Sep', kind: 'conference', endsOn: '2026-09-19', organiser: '[Organiser]',
    line: 'Great talks, crowded side events', summary: { count: 212, removed: 0, averages: split(4.5, 4.0, 4.2, 3.6, 4.2) },
    ratings: [rating('r-main-1', 'b-main', 4, '“Great talks; the side events were packed.”')], replies: [],
    attendance: { lumaCheckedIn: true, guestList: [] },
  },
  {
    id: 'b-demo', name: '[Hackathon] demo day', place: 'Online', when: 'Aug', kind: 'hackathon', endsOn: '2026-08-30', organiser: '[Organiser]',
    line: 'Organised, real builders, good judges', summary: { count: 96, removed: 0, averages: split(4.3, 4.6, 4.5, 4.1, 4.5) },
    ratings: [rating('r-demo-1', 'b-demo', 5, '“Real builders and judges who read the code.”')], replies: [],
    attendance: { lumaCheckedIn: false, guestList: ['attendee@example.com'] },
  },
  {
    id: 'b-vip', name: '[Summit] VIP dinner', place: 'Dubai', when: 'Apr', kind: 'side-event', endsOn: '2026-04-22', organiser: '[Organiser]',
    line: 'Pay-to-pitch, mostly sales', summary: { count: 41, removed: 1, averages: split(1.8, 3.4, 2.0, 1.6, 2.1) },
    ratings: [
      rating('r-vip-1', 'b-vip', 2, '“Pitched to for three hours. No builders in the room.”'),
      rating('r-vip-2', 'b-vip', 3, '“Venue and food were good; the ‘investor table’ was sales.”', [{ score: 2, line: '“The ‘investor table’ was sales.”' }]),
      {
        ...rating('r-vip-3', 'b-vip', 1, '[Removed text]'),
        removal: { at: '[date]', reason: 'Named a private person; removed after a report, reviewed by a person.', reviewedBy: '[Reviewer]' },
      },
    ],
    replies: [{ id: 'rep-vip-2', ratingId: 'r-vip-2', organiser: '[Organiser]', text: '“Thanks; next year the investor table will be curated.”' }],
    attendance: { lumaCheckedIn: false, guestList: [] },
  },
  {
    id: 'b-meetup', name: '[City] builders meetup', place: 'Melbourne', when: 'monthly', kind: 'meetup', endsOn: '2026-09-02', organiser: '[Organiser]',
    line: 'Small, technical, worth it', summary: { count: 58, removed: 0, averages: split(4.6, 4.7, 4.6, 4.3, 4.8) },
    ratings: [rating('r-meetup-1', 'b-meetup', 5, '“Small, technical, worth it.”')], replies: [],
    attendance: { lumaCheckedIn: true, guestList: [] },
  },
  {
    id: 'b-night', name: '[Conference] side event: agent tooling night', place: 'Singapore', when: 'Oct', kind: 'side-event', endsOn: '2026-10-16', organiser: '[Organiser]',
    line: 'Not rated yet', summary: { count: 0, removed: 0, averages: null }, ratings: [], replies: [],
    attendance: { lumaCheckedIn: true, guestList: [] },
  },
];

export const eventsBoard: EventsBoardData = { today, events: boardEvents };
/** No ratings yet anywhere (canvas Events-Board state "no ratings yet"). */
export const eventsBoardEmpty: EventsBoardData = { today, events: [] };

export const eventRating: EventRatingData = { today, events: boardEvents, defaultId: 'b-vip' };
/** The default event with no ratings yet. */
export const eventRatingEmpty: EventRatingData = { ...eventRating, events: boardEvents.map((e) => (e.id === 'b-vip' ? { ...e, summary: { count: 0, removed: 0, averages: null }, ratings: [], replies: [] } : e)) };
