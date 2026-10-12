// The one way into Draft-Review, for every page (issue #45). Draft-Review has no default draft, so every entry point
// names the draft it opens: Superhub's dashboard rows, Home's "Needs you next", New draft, and the Journey hub's
// "Draft post 2" (Codex review on PR #81). The id travels in router state; Draft-Review shows that draft or says it
// was not found.
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useScreenHref } from '../../gallery/screenPath';
import type { ArtboardName } from '../../config/artboards';

/** The Draft-Review boards: the review, and its drawn states (after Beautify, a failed polish). */
export const draftBoards = {
  review: 'Draft-Review',
  beautified: 'Draft-Review-Beautified',
  polishError: 'Draft-Review-PolishError',
} as const satisfies Record<string, ArtboardName>;
export type DraftBoard = keyof typeof draftBoards;

/** The blank draft (Draft-Review fixture `new`): a new post written from scratch or from a brief. */
export const NEW_DRAFT_ID = 'new';

/** (draftId, board?) => opens Draft-Review on that draft. The id is required. */
export function useOpenDraft(): (draftId: string, board?: DraftBoard) => void {
  const navigate = useNavigate();
  const href = useScreenHref();
  return useCallback((draftId, board = 'review') => navigate(href(draftBoards[board]), { state: { draftId } }), [navigate, href]);
}

/** The draft id Draft-Review was opened with, else the one the gallery board opens; undefined when neither names one. */
export function useSelectedDraftId(boardDraftId?: string): string | undefined {
  return (useLocation().state as { draftId?: string } | null)?.draftId ?? boardDraftId;
}
