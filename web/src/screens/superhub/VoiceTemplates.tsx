/*
 * Data contract: Voice-Templates (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * Voice-Templates, note n-vt). Shape: VoiceTemplatesData in ./types.ts. Backend map §4 Create, row "Voice-Templates":
 * `GET /api/templates` (table templates; seeded from research 06: 12 templates, 9 dimensions); the kit's voices come
 * from the voices table (row "Voice-Editor").
 *
 * | Field               | Source                                                                                  |
 * |---------------------|-----------------------------------------------------------------------------------------|
 * | kitVersion          | kit_versions (current); the title names the brand chosen in the switcher                |
 * | voices[]            | voices: name, template, overrides (roadmap), status (approved at Gate 3 or draft)       |
 * | templates[]         | templates: name, preset values (8 dials + claims gate), content-policy flag             |
 * | templates[].desc    | Read off each preset's 1 and 5 values, not written copy (n-vt 3)                        |
 * | dimensions          | The 9 dimensions (research 06)                                                          |
 *
 * States (n-vt): success; empty = only the core voice from Gate 3; loading = skeleton cards; error = templates failed
 * to load, Retry.
 */
import { Badge } from '../../ui/primitives/Badge';
import { Button, Heading, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { StatePanel } from '../../ui/composites/StatePanel';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { List, ListRow } from '../../ui/composites/ListRow';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';


import { StateView } from '../../ui/composites/StateView';
import { TemplateGallery } from './parts/TemplateGallery';
import { PresetMatrix } from './parts/PresetMatrix';
import { useHubLinks } from './paths';
import { useActiveBrand } from '../../flows/brand/activeBrand';
import type { VoiceTemplatesData } from './types';

export function VoiceTemplates({ data, state = 'success' }: { data: VoiceTemplatesData; state?: ScreenState }) {
  const links = useHubLinks();
  const brand = useActiveBrand();
  const templates = (
    <StateView
      state={state}
      views={{
        success: <><TemplateGallery data={data} /><PresetMatrix data={data} /></>,
        loading: <StatePanel kind="loading" title="Loading templates" />,
        error: <StatePanel kind="error" title="Templates failed to load" body="Your voices are safe. Try loading the templates again." actions={<Button href={links.voiceTemplates}>Retry</Button>} />,
      }}
    />
  );
  return (
    <HubPage section="brand" sub="voices">
      <PageHeader
        title="Voices"
        intro="A voice is a template plus per-channel overrides. Every template is a preset of the same 9 dimensions: 8 dials and claims strictness as a gate. Your kit can hold several voices."
        actions={<Button href={links.voiceEditor}>New voice</Button>}
      />
      <Card labelledBy="voices-kit" header={<Heading level={2} size="lg" id="voices-kit">{brand.name} voices in kit {data.kitVersion}</Heading>}>
        <List label="Voices in this kit">
          {data.voices.map((v) => (
            <ListRow key={v.id} title={v.name} detail={v.detail} aside={<Badge>{v.status}</Badge>} actions={<Button variant="secondary" href={links.voiceEditor}>Edit</Button>} />
          ))}
        </List>
      </Card>
      {templates}
      <Text variant="small" tone="secondary">{data.flirtyNote}</Text>
    </HubPage>
  );
}
