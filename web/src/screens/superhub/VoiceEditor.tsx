/*
 * Data contract: Voice-Editor (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Voice-Editor,
 * note n-ve). Shape: VoiceEditorData in ./types.ts. Backend map §4 Create, row "Voice-Editor": `POST …/voices`,
 * `PATCH /api/voices/:id`, `POST /api/voices/:id/preview` (table voices; OpenRouter preview; safety classifier for the content-policy template).
 *
 * | Field             | Source                                                                                     |
 * |-------------------|--------------------------------------------------------------------------------------------|
 * | name, basedOn     | voices.name, voices.template                                                               |
 * | dimensions        | The 8 dials with end labels (research 06; templates table)                                 |
 * | preset, values    | templates preset values; voices dial values (n-ve 1)                                       |
 * | claimsRules       | Claims gate rules; claimsChecked = the voice's ticked rules (n-ve 2)                       |
 * | overrides         | Per-channel overrides: ROADMAP, not built (n-ve 3)                                         |
 * | samples           | `POST /api/voices/:id/preview` output for the same brief                                   |
 *
 * States (n-ve): success = editing (Save makes kit v[n+1], n-ve 5); loading = preview regenerating; error = preview
 * failed, Retry.
 */
import { Button, Heading, Stack } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { Columns } from '../../ui/layouts/Columns';
import { Scale } from '../../ui/composites/Scale';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import { ClaimsGateFieldset } from './parts/ClaimsGateFieldset';
import { OverridesTable } from './parts/OverridesTable';
import { VoicePreview } from './parts/VoicePreview';
import { useVoiceEditor } from './hooks/useVoiceEditor';
import { useHubLinks } from './paths';
import type { VoiceEditorData } from './types';

export function VoiceEditor({ data, state = 'success' }: { data: VoiceEditorData; state?: ScreenState }) {
  const links = useHubLinks();
  const voice = useVoiceEditor(data);
  return (
    <HubPage artboard="Voice-Editor">
      <PageHeader badges={<SampleFlag />} title={data.name} intro={data.intro} back={{ href: links.voiceTemplates, label: 'Back to voices' }} />
      <Columns end={<VoicePreview note={data.previewNote} sample={voice.sample} rules={voice.rules} state={state} onAnother={voice.nextSample} />}>
        <Card labelledBy="voice-dims" header={<Heading level={2} size="lg" id="voice-dims">Dimensions</Heading>}>
          {data.dimensions.map((d) => (
            <Scale key={d.id} legend={d.legend} startLabel={d.start} endLabel={d.end} layout="stacked" value={voice.values[d.id]} onChange={(v) => voice.setValue(d.id, v)} />
          ))}
        </Card>
        <ClaimsGateFieldset level={data.claimsLevel} rules={data.claimsRules} checked={voice.checked} onToggle={voice.toggleRule} />
        <OverridesTable rows={data.overrides} />
      </Columns>
      <Stack direction="row" gap={3} justify="end" wrap>
        <Button variant="secondary" onClick={voice.reset} disabled={!voice.changed}>Reset to {data.basedOn}</Button>
        <Button variant="secondary" href={links.voiceTemplates}>Cancel</Button>
        {/* INTEGRATION: PATCH /api/voices/:id; the core voice was approved at Gate 3, so saving makes kit v[n+1]. */}
        {state === 'loading' ? <Button disabled>Save as kit v[n+1]</Button> : <Button href={links.voiceTemplates}>Save as kit v[n+1]</Button>}
      </Stack>
    </HubPage>
  );
}
