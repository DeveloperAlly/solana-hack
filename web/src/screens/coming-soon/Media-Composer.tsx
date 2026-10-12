/*
 * Data contract: Media-Composer (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Media-Composer; issue #51)
 * Backend map: no row yet; the canvas cites the draft backlog's media rows (unmerged). Closest row: §4 "Draft-Review"
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
import { SoonHubFrame } from '../../ui/domain/SoonHubFrame';
import { SoonSlideEditor } from '../../ui/domain/SoonSlideEditor';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { StateView } from './StateView';
import { soonRoutes } from './routes';
import type { MediaComposerData, MediaFormat, MediaKind } from './types';

export function MediaComposer({ data, state = 'success' }: { data: MediaComposerData; state?: ScreenState }) {
  const navigate = useNavigate();
  const [formats, setFormats] = useState<MediaFormat[]>(data.formats);
  const [tab, setTab] = useState<MediaKind>('carousel');
  // No format is pre-selected: the person chooses one before review (review finding: never pre-select).
  const [exportAs, setExportAs] = useState('');
  const chosen = data.exportOptions.find((o) => o.value === exportAs);
  const [blocked, setBlocked] = useState(false);
  const edit = (kind: MediaKind) => (id: string, text: string) =>
    setFormats((fs) => fs.map((f) => (f.id === kind ? { ...f, slides: f.slides.map((s) => (s.id === id ? { ...s, text } : s)) } : f)));
  // INTEGRATION: PATCH /api/drafts/:id with the slides, then the same checks as a post (Media-Review).
  const review = () => {
    const empty = formats.find((f) => f.id === tab)?.slides.some((s) => s.text.trim() === '');
    setBlocked(Boolean(empty));
    if (!empty) navigate(soonRoutes.mediaReview);
  };
  return (
    <SoonHubFrame header={{ title: 'Make a carousel', intro: 'Carousels, image cards and short videos from your kit, in your look.', definedIn: 'draft backlog (media rows, unmerged); research cited there is not yet in the repo' }}>
      <StateView
        state={state}
        loading={{ title: 'Drafting slides', body: 'Writing each slide from the post, in your voice.' }}
        error={{ title: 'Could not draft slides', body: 'The writer did not finish. Nothing was saved.', actions: <Button variant="secondary" href={soonRoutes.mediaComposer}>Try again</Button> }}
        empty={{ title: 'No approved post yet', body: 'Media is drafted from an approved post. Approve one first.', actions: <Button href={soonRoutes.contentDashboard}>Go to your posts</Button> }}
      >
        <Tabs
          label="Media type"
          value={tab}
          onChange={(id) => setTab(id as MediaKind)}
          items={formats.map((f) => ({
            id: f.id,
            label: f.label,
            panel: (
              <Stack gap={3}>
                <SoonSlideEditor label={`${f.label} slides`} slides={f.slides} onChange={edit(f.id)} />
                <Text variant="small" tone="secondary">{f.hint}</Text>
              </Stack>
            ),
          }))}
        />
        <Choice legend="Format" options={data.exportOptions} value={exportAs} onChange={setExportAs} />
        <Text variant="small" tone="secondary" role="status">{chosen ? chosen.detail : 'Choose a format to continue.'}</Text>
        {blocked && <Alert tone="danger" title="Every slide needs text before review." />}
        <Stack direction="row" gap={3} wrap>
          <Button onClick={review} disabled={!chosen}>Check and review</Button>
        </Stack>
      </StateView>
    </SoonHubFrame>
  );
}
