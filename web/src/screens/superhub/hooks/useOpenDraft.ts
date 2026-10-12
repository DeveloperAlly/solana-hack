import { useNavigate } from 'react-router';
import { useScreenHref } from '../../../gallery/screenPath';
import { draftBoards, type DraftBoard } from '../paths';

/**
 * The one way to open Draft-Review: it takes the draft's id, so nothing can open the screen without saying which draft
 * (Codex review on PR #81; Draft-Review is deliberately not a link key). The id travels in router state; Draft-Review
 * shows that draft or says it was not found. `board` picks a drawn state of the screen (after Beautify, polish error).
 */
export function useOpenDraft(): (draftId: string, board?: DraftBoard) => void {
  const navigate = useNavigate();
  const href = useScreenHref();
  return (draftId, board = 'review') => navigate(href(draftBoards[board]), { state: { draftId } });
}
