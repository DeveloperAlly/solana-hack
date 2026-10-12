import { Link, Text } from '../../../ui/primitives';
import { StatePanel } from '../../../ui/composites/StatePanel';
import { StateView } from '../../../ui/composites/StateView';
import type { ScreenState } from '../../../ui/composites/DemoStateSwitcher';
import { Columns } from '../../../ui/layouts/Columns';
import { PageHeader } from '../../../ui/layouts/PageHeader';
import { SampleFlag } from '../../../ui/composites/SampleFlag';
import { useDraftReview } from '../hooks/useDraftReview';
import { useHubLinks } from '../paths';
import type { DraftContent, DraftReviewData } from '../types';
import { ChecksAndPublish } from './ChecksAndPublish';
import { DraftEditor } from './DraftEditor';
import { SlopAndHistory } from './SlopAndHistory';

export interface DraftReviewBodyProps {
  data: DraftReviewData;
  draftId: string;
  draft: DraftContent;
  state: ScreenState;
}

/**
 * One draft under review: its own title, versions and checks, the editor, history and the publish card. Mounted per
 * draft id (keyed by the screen), so one draft's edits and decision never carry into another.
 */
export function DraftReviewBody({ data, draftId, draft, state }: DraftReviewBodyProps) {
  const links = useHubLinks();
  const review = useDraftReview(data, draftId, draft, state === 'loading');
  return (
    <>
      <PageHeader badges={<SampleFlag />} title={draft.title} intro={draft.context} back={{ href: links.content, label: 'Back to drafts awaiting approval' }} />
      <Columns end={<ChecksAndPublish review={review} data={data} />}>
        <StateView
          state={state}
          views={{
            success: <DraftEditor review={review} data={data} />,
            loading: <StatePanel kind="loading" title="Writing…" body="The writer is drafting from your brief; the slop check runs before you see it." />,
          }}
        />
        <Text variant="small" tone="secondary">Prototype states: <Link href={links.draftBeautified}>after Beautify</Link> · <Link href={links.draftPolishError}>a polish action fails</Link></Text>
        <SlopAndHistory review={review} />
      </Columns>
    </>
  );
}
