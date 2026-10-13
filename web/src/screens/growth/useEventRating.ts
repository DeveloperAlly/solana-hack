import { useEffect, useRef, useState } from 'react';
import type { Gate } from '../../lib/approval';
import {
  completeScores, currentVersion, emptyRatingDraft, proofTransition, ratingGate, withVersion,
  type AttendanceProof, type AttendanceProofKind, type EventRating, type ProofEvent, type RatingDraftScores, type RatingQuestionId, type RatingScore,
} from '../../domain/rating';
import { useGrowthParam } from './paths';
import { growthSession } from './session';
import { nowIso } from '../../lib/time';
import { useBoardEvents } from './useBoardEvents';
import type { BoardEvent, EventRatingData } from './types';

/** How long the sample proof check takes, so "proving" is a real state on screen. */
export const PROOF_DELAY_MS = 300;

export interface EventRatingFlow {
  event: BoardEvent;
  /** Rating opens after the event ends (canvas note "event upcoming"). */
  open: boolean;
  proof: AttendanceProof;
  proveWithLuma: () => void;
  proveWithEmail: (email: string) => void;
  resetProof: () => void;
  scores: RatingDraftScores;
  setScore: (q: RatingQuestionId, s: RatingScore | null) => void;
  line: string;
  setLine: (l: string) => void;
  gate: Gate;
  /** The viewer's registered rating, if any (canvas note "already rated (edit)"). */
  mine: EventRating | undefined;
  editing: boolean;
  startEdit: () => void;
  /** Adds the rating, or a new version of it. INTEGRATION: POST /api/board/events/:id/ratings, each version's hash registered on Solana (not built: ratings are ROADMAP). */
  register: () => void;
}

/** Event-Rating flow state (one hook): the event from `?event=`, attendance proof as a state machine, the five scores. */
export function useEventRating(data: EventRatingData): EventRatingFlow {
  const events = useBoardEvents(data.events);
  const param = useGrowthParam('event');
  const event = events.find((e) => e.id === param) ?? events.find((e) => e.id === data.defaultId) ?? events[0];
  const [session, set] = growthSession.use();
  // The viewer's rating: this session's latest, else the one the loaded data already holds (Codex review on PR 102).
  const mine = session.myRatings[event.id] ?? event.ratings.find((r) => r.id === event.viewerRatingId);
  const [proof, setProof] = useState<AttendanceProof>({ status: 'not-proven' });
  const [scores, setScores] = useState<RatingDraftScores>(emptyRatingDraft);
  const [line, setLine] = useState('');
  const [editing, setEditing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // Another event opened in place (`?event=` changed): start its rating from scratch.
  useEffect(() => {
    setProof({ status: 'not-proven' });
    setScores(emptyRatingDraft());
    setLine('');
    setEditing(false);
  }, [event.id]);

  const send = (e: ProofEvent) => setProof((p) => proofTransition(p, e));
  // INTEGRATION: Luma guest check-in (per-ticket checked_in_at, Luma API changelog) or the organiser's guest list.
  const prove = (kind: AttendanceProofKind, ok: boolean, reason: string) => {
    send({ type: 'start', kind });
    timer.current = setTimeout(() => send(ok ? { type: 'succeed' } : { type: 'fail', reason }), PROOF_DELAY_MS);
  };
  const open = data.today > event.endsOn;
  const gate = ratingGate(open, proof, scores);

  return {
    event, open, proof,
    proveWithLuma: () => prove('luma-checkin', event.attendance.lumaCheckedIn, 'No checked-in Luma ticket for this event on your account.'),
    proveWithEmail: (email) => prove('guest-list-email', event.attendance.guestList.includes(email.toLowerCase()), 'That email is not on the organiser’s guest list for this event.'),
    resetProof: () => send({ type: 'reset' }),
    scores, setScore: (q, s) => setScores((prev) => ({ ...prev, [q]: s })),
    line, setLine,
    gate, mine, editing,
    startEdit: () => {
      if (!mine) return;
      const v = currentVersion(mine);
      setScores(v.scores);
      setLine(v.line.replace(/^“|”$/g, ''));
      setEditing(true);
    },
    register: () => {
      const complete = completeScores(scores);
      if (gate.blocking || !complete || proof.status !== 'proven') return;
      // Append-only: an edit adds a version and keeps the earlier ones (ADR-012, canvas v26 Event-Rating).
      const version = { scores: complete, line: line.trim() ? `“${line.trim()}”` : '(no line)', at: nowIso(), registration: { hash: null, at: nowIso() } };
      const rating: EventRating = mine ? withVersion(mine, version) : { id: `mine-${event.id}`, eventId: event.id, author: 'You', proof: proof.kind, versions: [version] };
      set({ myRatings: { ...session.myRatings, [event.id]: rating } });
      setEditing(false);
    },
  };
}
