/*
 * Data contract: Draft-Review, Draft-Review-Beautified, Draft-Review-PolishError (issue #52; canvas
 * https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards of those names, notes n-dr, n-drb, n-dre).
 * Shape: DraftReviewData in ./types.ts. Backend map §4 Create, row "Draft-Review": `GET`/`PATCH /api/drafts/:id`,
 * `POST …/polish`, `POST …/polish/undo`, `POST …/approve` (table drafts; OpenRouter). Publish: row "Publish and
 * Registered (screens missing)", `POST /api/drafts/:id/publish`.
 *
 * | Field             | Source                                                                                      |
 * |-------------------|---------------------------------------------------------------------------------------------|
 * | title, context    | drafts: channel, voice, brief                                                               |
 * | charLimit         | Channel registry (M2): X = 280                                                              |
 * | versions[]        | drafts polish history (v1 first draft, v2 slop fixes, then each polish action)              |
 * | slopFixes         | drafts slop fixes from the no-AI-slop pass                                                  |
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
import { Button, Link, Text } from '../../ui/primitives';
import { EmptyState } from '../../ui/composites/EmptyState';
import { StatePanel } from '../../ui/composites/StatePanel';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { HubColumns } from '../../ui/domain/HubColumns';
import { HubPage } from './parts/HubPage';
import { PageHeader } from './parts/PageHeader';
import { DraftEditor } from './parts/DraftEditor';
import { SlopAndHistory } from './parts/SlopAndHistory';
import { ChecksAndPublish } from './parts/ChecksAndPublish';
import { StateView } from './parts/StateView';
import { useDraftReview } from './hooks/useDraftReview';
import { useHubLinks } from './paths';
import type { DraftReviewData } from './types';

export function DraftReview({ data, state = 'success' }: { data: DraftReviewData; state?: ScreenState }) {
  const links = useHubLinks();
  const review = useDraftReview(data, state === 'loading');
  const editor = (
    <StateView
      state={state}
      views={{
        success: <DraftEditor review={review} data={data} />,
        loading: <StatePanel kind="loading" title="Writing…" body="The writer is drafting from your brief; the slop check runs before you see it." />,
      }}
    />
  );
  return (
    <HubPage section="create" sub="content">
      <PageHeader title={data.title} intro={data.context} back={{ href: links.content, label: 'Back to drafts awaiting approval' }} sample />
      <StateView
        state={state}
        views={{
          success: (
            <HubColumns end={<ChecksAndPublish review={review} data={data} />}>
              {editor}
              <Text variant="small" tone="secondary">Prototype states: <Link href={links.draftBeautified}>after Beautify</Link> · <Link href={links.draftPolishError}>a polish action fails</Link></Text>
              <SlopAndHistory review={review} data={data} />
            </HubColumns>
          ),
          empty: <EmptyState title="Nothing to review" body="Drafts land here after the brand and slop checks." actions={<Button href={links.contentEmpty}>Go to content</Button>} />,
        }}
      />
    </HubPage>
  );
}
