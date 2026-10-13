/*
 * Data contract: Media-Composer (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Media-Composer; issue #51)
 * Backend map: no row yet; proposed in issue #51. Closest row: §4 "Draft-Review"
 * (GET/PATCH /api/drafts/:id, table drafts), since slides are drafted from an approved post. Shape: MediaComposerData.
 *
 * | Field                   | Source                                                      | Empty when                  |
 * |-------------------------|-------------------------------------------------------------|-----------------------------|
 * | formats[].slides[]      | Slides drafted from the post (writer job, not built)        | no approved post to draft from |
 * | formats[].hint          | Static copy (canvas)                                        | never                       |
 * | exportOptions[]         | Static: LinkedIn document (PDF) or image set (canvas)       | never                       |
 *
 * States: success, empty (no approved post yet), loading (drafting slides), error (drafting failed).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, Choice, Stack, Text } from '../../ui/primitives';
import { Tabs } from '../../ui/composites/Tabs';
import { SoonPage } from './SoonPage';
import { SoonSlideEditor } from '../../ui/domain/SoonSlideEditor';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { StateView } from '../../ui/composites/StateView';
import { useSoonRoutes } from './routes';
import type { MediaComposerData, MediaKind } from './types';
import { mediaKindTitles, useMediaFlow } from './useMediaFlow';

export function MediaComposer({ data, state = 'success' }: { data: MediaComposerData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const navigate = useNavigate();
  // The draft lives in useMediaFlow so Media-Review renders these edits; no export format is pre-selected.
  const media = useMediaFlow(data.formats);
  const { formats, kind: tab, exportAs: chosen } = media;
  const [blocked, setBlocked] = useState(false);
  // INTEGRATION: PATCH /api/drafts/:id with the slides, then the same checks as a post (Media-Review).
  const review = () => {
    const empty = formats.find((f) => f.id === tab)?.slides.some((s) => s.text.trim() === '');
    setBlocked(Boolean(empty));
    if (!empty) navigate(routes.mediaReview);
  };
  return (
    <SoonPage artboard="Media-Composer" header={{ title: mediaKindTitles[tab], intro: 'Carousels, image cards and short videos from your kit, in your look.', definedIn: 'canvas board Media-Composer; no backend row yet (proposed in issue #51)' }}>
      <StateView
        state={state}
        loading={{ title: 'Drafting slides', body: 'Writing each slide from the post, in your voice.' }}
        error={{ title: 'Could not draft slides', body: 'The writer did not finish. Nothing was saved.', actions: <Button variant="secondary" href={routes.mediaComposer}>Try again</Button> }}
        empty={{ title: 'No approved post yet', body: 'Media is drafted from an approved post. Approve one first.', actions: <Button href={routes.contentDashboard}>Go to your posts</Button> }}
      >
        <Tabs
          label="Media type"
          value={tab}
          onChange={(id) => media.setKind(id as MediaKind)}
          items={formats.map((f) => ({
            id: f.id,
            label: f.label,
            panel: (
              <Stack gap={3}>
                <SoonSlideEditor label={`${f.label} slides`} slides={f.slides} onChange={(id, text) => media.editSlide(f.id, id, text)} />
                <Text variant="small" tone="secondary">{f.hint}</Text>
              </Stack>
            ),
          }))}
        />
        <Choice legend="Format" options={data.exportOptions} value={chosen?.value ?? ''} onChange={(v) => media.setExportAs(data.exportOptions.find((o) => o.value === v))} />
        <Text variant="small" tone="secondary" role="status">{chosen ? chosen.detail : 'Choose a format to continue.'}</Text>
        {blocked && <Alert tone="danger" title="Every slide needs text before review." />}
        <Stack direction="row" gap={3} wrap>
          <Button onClick={review} disabled={!chosen}>Check and review</Button>
        </Stack>
      </StateView>
    </SoonPage>
  );
}
