/*
 * Data contract: Draft-Review, Draft-Review-Beautified, Draft-Review-PolishError (issue #52; canvas
 * https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards of those names, notes n-dr, n-drb, n-dre).
 * Shape: DraftReviewData in ./types.ts. Backend map §4 Create, row "Draft-Review": `GET`/`PATCH /api/drafts/:id`,
 * `POST …/polish`, `POST …/polish/undo`, `POST …/approve` (table drafts; OpenRouter). Publish: row "Publish and
 * Registered (screens missing)", `POST /api/drafts/:id/publish`.
 *
 * | Field             | Source                                                                                      |
 * |-------------------|---------------------------------------------------------------------------------------------|
 * | draftId           | The draft opened (router state from the content dashboard), else the default                |
 * | drafts[id]        | That draft's title, context, channel, polish history (v1, v2 slop fixes, then each polish   |
 * |                   | action) and slop fixes; X length is weighted as the Worker counts it (lib/xLength)          |
 * | slopPhrases       | The no-AI-slop rules, run again on edits (sample list here)                                 |
 * | avoidTerms        | kit vocabulary: terms to avoid (Brand-Build section 11; sample list here)                   |
 * | approvedNumbers   | claims (approved) that the claims gate allows                                               |
 * | polishResults     | `POST …/polish` output per action                                                           |
 * | scores            | Voice fit and platform scores: [placeholders], self-graded in the same call today (n-dr 3)  |
 * | publishOptions    | connections (post now), suggested slot (static default), manual paste-back                  |
 * | failedAction      | A polish call that failed, with the reason (Draft-Review-PolishError)                       |
 *
 * States (n-dr): success = editing; loading = "Writing…" skeleton in the editor; error = a polish action failed
 * (Draft-Review-PolishError); empty = nothing to review (Content-Dashboard-Empty). Beautified = success after Beautify.
 */
import { Button } from '../../ui/primitives';
import { EmptyState } from '../../ui/composites/EmptyState';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { HubPage } from './parts/HubPage';
import { DraftReviewBody } from './parts/DraftReviewBody';
import { useSelectedDraftId } from './hooks/useDraftReview';
import { useHubLinks } from './paths';
import type { DraftReviewData } from './types';

export function DraftReview({ data, state = 'success' }: { data: DraftReviewData; state?: ScreenState }) {
  const links = useHubLinks();
  const draftId = useSelectedDraftId(data);
  const draft = data.drafts[draftId];
  const toContent = <Button href={links.contentEmpty}>Go to content</Button>;
  if (state === 'empty') return <HubPage section="create" sub="content"><EmptyState level={1} title="Nothing to review" body="Drafts land here after the brand and slop checks." actions={toContent} /></HubPage>;
  // No content for this id: say so, with no editor or decisions, rather than show another draft.
  if (!draft) return <HubPage section="create" sub="content"><EmptyState level={1} title="Draft not found" body="This draft is not in your drafts any more." actions={<Button href={links.content}>Back to content</Button>} /></HubPage>;
  return (
    <HubPage section="create" sub="content">
      <DraftReviewBody key={draftId} data={data} draftId={draftId} draft={draft} state={state} />
    </HubPage>
  );
}
