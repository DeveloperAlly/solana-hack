// Event rating domain type (canvas v21 boards Events-Board and Event-Rating, ROADMAP; ADR-012 #86, Grow and the
// public shell). One rating per attendee per event, made only after attendance proof, with five scores and a line.
// A rating is registered (Solana, like posts) so neither JamJam nor the organiser can quietly edit or delete it
// (canvas Events-Board copy "Can't be scrubbed"). Nothing here is built: the screens run on fixtures.

/** The five plain questions, in canvas order (Events-Board "Five plain questions"; Event-Rating meters). */
export const ratingQuestions = [
  { id: 'talks', label: 'Talks worth it' },
  { id: 'run', label: 'Well run' },
  { id: 'people', label: 'Right people' },
  { id: 'sponsors', label: 'Sponsor value' },
  { id: 'again', label: 'Would go again' },
] as const;
export type RatingQuestionId = (typeof ratingQuestions)[number]['id'];

/** 1 to 5. No score is ever pre-selected (canvas Event-Rating note: "No rating is pre-selected"). */
export const ratingScale = [1, 2, 3, 4, 5] as const;
export type RatingScore = (typeof ratingScale)[number];
export type RatingScores = Record<RatingQuestionId, RatingScore>;
/** Scores while the form is being filled: each question unanswered until the person picks. */
export type RatingDraftScores = Record<RatingQuestionId, RatingScore | null>;

/**
 * How an attendee proves they went (canvas Event-Rating "Prove I went with Luma", "or sign in with the email on the
 * guest list"; Events-Board "a checked-in ticket from the event's Luma page, or the organiser's guest list").
 */
export const attendanceProofKinds = [
  { id: 'luma-checkin', label: 'Checked-in Luma ticket' },
  { id: 'guest-list-email', label: 'Email on the organiser’s guest list' },
] as const;
export type AttendanceProofKind = (typeof attendanceProofKinds)[number]['id'];

/**
 * Attendance proof as an explicit state machine: not proven, then proving, then proven or failed. The rating form
 * unlocks only in `proven`; a failed proof can be retried (back to proving).
 */
export type AttendanceProof =
  | { status: 'not-proven' }
  | { status: 'proving'; kind: AttendanceProofKind }
  | { status: 'proven'; kind: AttendanceProofKind }
  | { status: 'failed'; kind: AttendanceProofKind; reason: string };

export type ProofEvent =
  | { type: 'start'; kind: AttendanceProofKind }
  | { type: 'succeed' }
  | { type: 'fail'; reason: string }
  | { type: 'reset' };

/** The only legal moves; any other event leaves the state as it is. */
export function proofTransition(state: AttendanceProof, event: ProofEvent): AttendanceProof {
  switch (event.type) {
    case 'start':
      return state.status === 'not-proven' || state.status === 'failed' ? { status: 'proving', kind: event.kind } : state;
    case 'succeed':
      return state.status === 'proving' ? { status: 'proven', kind: state.kind } : state;
    case 'fail':
      return state.status === 'proving' ? { status: 'failed', kind: state.kind, reason: event.reason } : state;
    case 'reset':
      return state.status === 'proving' ? state : { status: 'not-proven' };
  }
}

/** Where one version of a rating is registered: its hash on Solana. Placeholder values in samples (README "Fixtures"). */
export interface RatingRegistration {
  /** Hash of the version as registered; null until the registry is built (ratings are ROADMAP). */
  hash: string | null;
  at: string;
}

/** One version of a rating. Ratings are append-only: an edit adds a version, earlier ones stay visible. */
export interface RatingVersion {
  scores: RatingScores;
  /** "In a line": what people should know. */
  line: string;
  at: string;
  registration: RatingRegistration;
}

/**
 * A removal after a report, reviewed by a person. The rating is never deleted: it renders as a tombstone with the date
 * and reason, its registrations stay, and it still counts as registered.
 */
export interface RatingRemoval {
  at: string;
  reason: string;
  reviewedBy: string;
}

export interface EventRating {
  id: string;
  eventId: string;
  /** Who rated: always shown as "Attendee" publicly; never a name. */
  author: 'Attendee' | 'You';
  proof: AttendanceProofKind;
  /** Oldest first; the last is the current version. Never empty. */
  versions: RatingVersion[];
  removal?: RatingRemoval;
}

/** The version a rating shows now: its latest. */
export const currentVersion = (r: EventRating): RatingVersion => r.versions[r.versions.length - 1];

/** A rating with one more version: the edit is appended, never written over the earlier ones. */
export const withVersion = (r: EventRating, v: RatingVersion): EventRating => ({ ...r, versions: [...r.versions, v] });

/** A verified organiser's reply under a rating; replies never remove or edit the rating. */
export interface OrganiserReply {
  id: string;
  /** The rating it answers. */
  ratingId: string;
  organiser: string;
  text: string;
}

/** Mean of the five scores, to one decimal. */
export function overallScore(scores: RatingScores): number {
  const values = ratingQuestions.map((q) => scores[q.id]);
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** The five scores, only once every question is answered; null while any is missing. */
export function completeScores(draft: RatingDraftScores): RatingScores | null {
  return ratingQuestions.every((q) => draft[q.id] !== null) ? (draft as RatingScores) : null;
}

export const emptyRatingDraft = (): RatingDraftScores => ({ talks: null, run: null, people: null, sponsors: null, again: null });

/** An event's ratings so far: how many are registered, how many were removed, and the mean per question of those shown. */
export interface RatingSummary {
  /** Every registered rating, removed ones included ("N registered"). */
  count: number;
  /** Ratings removed after a report; shown = count - removed. */
  removed: number;
  /** Mean per question, 1 to 5; empty means no ratings yet. */
  averages: Record<RatingQuestionId, number> | null;
}

/** The summary with one more rating counted in (a new registration updates the meters). */
export function addToSummary(summary: RatingSummary, scores: RatingScores): RatingSummary {
  const n = shownCount(summary);
  const averages = Object.fromEntries(
    ratingQuestions.map((q) => [q.id, ((summary.averages ? summary.averages[q.id] * n : 0) + scores[q.id]) / (n + 1)]),
  ) as Record<RatingQuestionId, number>;
  return { count: summary.count + 1, removed: summary.removed, averages };
}

/** Ratings shown (registered minus removed). */
export const shownCount = (s: RatingSummary): number => s.count - s.removed;

/** The overall score shown in big type: the mean of the question means, to one decimal; null with no ratings. */
export function summaryScore(summary: RatingSummary): number | null {
  if (!summary.averages) return null;
  const a = summary.averages;
  return Math.round((ratingQuestions.reduce((t, q) => t + a[q.id], 0) / ratingQuestions.length) * 10) / 10;
}

/** The one gate for registering a rating (Event-Rating's Register button and its reason read it). */
export function ratingGate(open: boolean, proof: AttendanceProof, draft: RatingDraftScores): { blocking: boolean; label: string } {
  if (!open) return { blocking: true, label: 'Rating opens after the event ends.' };
  if (proof.status !== 'proven') return { blocking: true, label: 'Prove you went first.' };
  const missing = ratingQuestions.filter((q) => draft[q.id] === null).length;
  if (missing > 0) return { blocking: true, label: `Choose ${missing} more ${missing === 1 ? 'rating' : 'ratings'}.` };
  return { blocking: false, label: 'Ready to register.' };
}

/** "41 registered · 40 shown": removed ratings still count as registered (canvas v26 Events-Board). */
export const registeredLabel = (s: RatingSummary): string => `${s.count} registered · ${shownCount(s)} shown`;
