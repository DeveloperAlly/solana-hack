import { Button, Stack, Text } from '../../../ui/primitives';
import { StatePanel } from '../../../ui/composites/StatePanel';
import { StateView } from '../../../ui/composites/StateView';
import type { ScreenState } from '../../../ui/composites/DemoStateSwitcher';
import { Columns } from '../../../ui/layouts/Columns';
import { PageHeader } from '../../../ui/layouts/PageHeader';
import { SampleFlag } from '../../../ui/composites/SampleFlag';
import { useDraftReview } from '../hooks/useDraftReview';
import { useHubLinks } from '../paths';
import { useOpenDraft } from '../../../flows/drafts/openDraft';
import type { DraftContent, DraftReviewData } from '../types';
import { ChecksAndPublish } from './ChecksAndPublish';
import { DraftPostCard } from './DraftPostCard';
import { SlopAndHistory } from './SlopAndHistory';

export interface DraftReviewBodyProps {
  data: DraftReviewData;
  draftId: string;
  draft: DraftContent;
  state: ScreenState;
  /** True for the draft the canvas draws (the after-Beautify and polish-error boards show that draft). */
  drawnDraft: boolean;
}

/**
 * One draft under review: its own title, versions and checks, the editor, history and the publish card. Mounted per
 * draft id (keyed by the screen), so one draft's edits and decision never carry into another.
 */
export function DraftReviewBody({ data, draftId, draft, state, drawnDraft }: DraftReviewBodyProps) {
  const links = useHubLinks();
  const openDraft = useOpenDraft();
  const review = useDraftReview(data, draftId, draft, state === 'loading');
  return (
    <>
      <PageHeader badges={<SampleFlag />} title={draft.title} intro={draft.context} back={{ href: links.content, label: 'Back to drafts awaiting approval' }} />
      <Columns end={<ChecksAndPublish review={review} data={data} />}>
        <StateView
          state={state}
          views={{
            success: <DraftPostCard review={review} data={data} />,
            loading: <StatePanel kind="loading" title="Writing…" body="The writer is drafting from your brief; the slop check runs before you see it." />,
          }}
        />
        {drawnDraft && (
          <Stack direction="row" gap={2} align="center" wrap>
            <Text variant="small" tone="secondary">Prototype states of this draft:</Text>
            <Button variant="secondary" onClick={() => openDraft(draftId, 'beautified')}>After Beautify</Button>
            <Button variant="secondary" onClick={() => openDraft(draftId, 'polishError')}>A polish action fails</Button>
          </Stack>
        )}
        <SlopAndHistory review={review} />
      </Columns>
    </>
  );
}
