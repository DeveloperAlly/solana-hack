/*
 * Data contract: Amb-3-Generate, M-3-Generate (issue #53; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards
 * Amb-3-Generate and M-3-Generate). Backend map row "Amb-3, M-3" (.agentic/what/context/backend_map.md §4):
 * POST /api/campaigns/:id/drafts, GET /api/drafts/:id/checks; table drafts; DraftWorkflow via OpenRouter. Shape: GenerateData.
 *
 * | Field                         | Source                                                                 | Empty when                  |
 * |-------------------------------|------------------------------------------------------------------------|-----------------------------|
 * | campaign, pieceLabel          | the campaign joined on Detail (session.ts; memberships); kit version   | default: aDNA launch week   |
 * | formats[], format             | campaign payout formats (no X: ADR-002); done ones marked; the chosen  | never                       |
 * |                               | piece, the draft and its review go on to Publish and Status (session)  |                             |
 * | angle                         | the ambassador's own text, sent with POST …/drafts                     | blank until typed           |
 * | draft, generatedNote          | POST /api/campaigns/:id/drafts → drafts.body, created_at               | loading: generating (~10 s) |
 * | score, checks[]               | GET /api/drafts/:id/checks (voice fit, claims, vocabulary, disclosure) | no flags: "No flags."       |
 * | scoreWhenClean, threshold     | score with flags fixed (canvas Amb-4: 91%); publish threshold 80%      | never                       |
 *
 * States: success (draft with flags), loading (generating skeleton, canvas note n-a3).
 * Interactions: the meter updates as you type; each flag has a one-click fix; Continue unlocks at 80%+ with no banned claim and
 * the disclosure present; Regenerate keeps the angle; Undo and History (note n-a3). Mobile: meter pinned at the top, flags in a
 * bottom sheet (note n-m3).
 */
import { Button, Stack } from '../../ui/primitives';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { AmbShell } from '../../ui/domain/AmbShell';
import { HubColumns } from '../../ui/domain/HubColumns';
import { AmbOnBrandMeter } from '../../ui/domain/AmbOnBrandMeter';
import { AmbChecksList } from '../../ui/domain/AmbChecksList';
import { AmbSheet } from '../../ui/domain/AmbSheet';
import { useDisclosure } from '../../ui/hooks/useDisclosure';
import { ChecksPanel } from './parts/ChecksPanel';
import { DraftPanel } from './parts/DraftPanel';
import { GenerateControls } from './parts/GenerateControls';
import { PageTitle } from './parts/PageTitle';
import { AngleField } from './parts/AngleField';
import { DraftActions } from './parts/DraftActions';
import { useAmbassadorFlow } from './useAmbassadorFlow';
import { useDraft } from './useDraft';
import type { Device, GenerateData } from './types';

export interface AmbGenerateProps {
  data: GenerateData;
  device: Device;
  state?: ScreenState;
}

export function AmbGenerate({ data, device, state = 'success' }: AmbGenerateProps) {
  const flow = useAmbassadorFlow(device);
  const generating = state === 'loading';
  const draft = useDraft(data, { generating });
  const flags = useDisclosure();
  const editor = <DraftPanel draft={draft} charLimit={data.charLimit} generating={generating} />;
  const actions = (layout: 'stack' | 'row', publishLabel: string) => (
    <DraftActions draft={draft} generating={generating} publishLabel={publishLabel} onPublish={() => flow.go('publish')} layout={layout} />
  );

  if (device === 'desktop') {
    return (
      <AmbShell {...flow.shell} account={data.account}>
        <Stack gap={5}>
          <PageTitle title="Write your piece" context={`${draft.formatLabel} · ${data.pieceLabel}`} back={{ href: flow.back('generate'), label: draft.campaign.title }} />
          <HubColumns
            start={<GenerateControls draft={draft} formats={data.formats} />}
            end={<ChecksPanel draft={draft} threshold={data.threshold} generating={generating} actions={actions('stack', 'Continue to publish')} />}
          >
            {editor}
          </HubColumns>
        </Stack>
      </AmbShell>
    );
  }

  const flagCount = `${draft.open.length} ${draft.open.length === 1 ? 'flag' : 'flags'}`;
  return (
    <AmbShell
      {...flow.shell}
      account={data.account}
      back={{ href: flow.back('generate'), label: 'Back to the campaign' }}
      title={draft.formatLabel}
      pinned={<AmbOnBrandMeter layout="bar" score={draft.score} threshold={data.threshold} action={<Button variant="secondary" onClick={flags.show} aria-haspopup="dialog">{flagCount}</Button>} />}
      footer={actions('row', 'Publish')}
    >
      <PageTitle title="Write your piece" context={data.pieceLabel} />
      <AngleField draft={draft} multiline={false} />
      {editor}
      <AmbSheet open={flags.open} onClose={flags.hide} title="Flags">
        <AmbChecksList compact checks={draft.open} onFix={draft.fix} disabled={generating} />
      </AmbSheet>
    </AmbShell>
  );
}
