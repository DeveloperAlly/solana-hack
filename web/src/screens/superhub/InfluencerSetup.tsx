/*
 * Data contract: Influencer-Setup (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * Influencer-Setup, note n-is). Shape: InfluencerSetupData in ./types.ts. Backend map §4 Grow, row "Influencer-Setup,
 * Influencer-Queue (experimental)": `POST …/personas` (tables personas, drafts, registrations; Storage; SAS
 * attestation). Watermarking is not chosen yet (G-WATERMARK).
 *
 * | Field           | Source                                                                                        |
 * |-----------------|-----------------------------------------------------------------------------------------------|
 * | name, pillars   | personas draft values                                                                         |
 * | brandOptions    | The account's brands; the persona is tied to a brand and a voice (n-is 1)                     |
 * | voiceOptions    | voices of that brand (Flirty, behind its content-policy gate)                                 |
 * | avatarFrom      | The avatar creator the set comes from (n-is 3); files go to Storage                           |
 * | disclosures     | Locked on: watermark, bio label, platform AI labels, human approval (n-is 2)                  |
 * | channels        | Channels with per-channel caps from the voice                                                 |
 *
 * States drawn: success only (a new persona starts from these defaults).
 */
import { Button, Field, Grid, Heading, SelectField, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { CheckboxRow } from '../../ui/composites/CheckboxRow';
import { HubColumns } from '../../ui/domain/HubColumns';
import { HubWatermarkMedia } from '../../ui/domain/HubWatermarkMedia';
import { HubPage } from './parts/HubPage';
import { PageHeader } from './parts/PageHeader';
import { StatusNote } from './parts/StatusNote';
import { usePersonaSetup } from './hooks/usePersonaSetup';
import type { InfluencerSetupData } from './types';

export function InfluencerSetup({ data }: { data: InfluencerSetupData }) {
  const p = usePersonaSetup(data);
  const preview = (
    <Card variant="subtle" labelledBy="persona-preview" header={<Heading level={2} size="lg" id="persona-preview">Preview</Heading>}>
      <HubWatermarkMedia label={data.preview.image} ratio="square" />
      <Text variant="small"><strong>{p.name || data.name}</strong> · {p.persona}{p.voiceName && ` · ${p.voiceName}`}</Text>
      <Text variant="small">{data.preview.caption}</Text>
    </Card>
  );
  return (
    <HubPage section="grow" sub="influencer">
      <Text variant="small" tone="secondary">{data.banner}</Text>
      <PageHeader title="Create your influencer" tag="EXPERIMENTAL" />
      <HubColumns end={preview}>
        <Card labelledBy="persona-fields" header={<Heading level={2} size="lg" id="persona-fields">Persona</Heading>}>
          <Grid min="sm" gap={3}>
            <Field label="Name" value={p.name} error={p.error} onChange={(e) => p.setName(e.target.value)} />
            <SelectField label="Represents" placeholder="Choose a brand" options={data.brandOptions} value={p.brand} onChange={(e) => p.setBrand(e.target.value)} />
            <SelectField label="Voice" placeholder="Choose a voice" options={data.voiceOptions} value={p.voice} onChange={(e) => p.setVoice(e.target.value)} />
            <Field label="Content pillars" value={p.pillars} onChange={(e) => p.setPillars(e.target.value)} />
          </Grid>
        </Card>
        <Card labelledBy="persona-avatar" header={<Heading level={2} size="lg" id="persona-avatar">Avatar</Heading>}>
          <Text variant="small" tone="secondary">Upload the avatar set from your creator. Each image or clip is stamped before it can be posted.</Text>
          <Field label="Upload avatar set" type="file" multiple accept="image/*,video/*" hint={`From: ${data.avatarFrom} · ${p.files} of ${data.avatarTotal} uploaded`} onChange={(e) => p.pickFiles(e.target.files)} />
        </Card>
        <Card labelledBy="persona-disclosure" header={<Heading level={2} size="lg" id="persona-disclosure">AI disclosure (always on)</Heading>}>
          {data.disclosures.map((d) => <CheckboxRow key={d.id} label={d.label} description={d.detail} checked disabled readOnly />)}
        </Card>
        <Card labelledBy="persona-channels" header={<Heading level={2} size="lg" id="persona-channels">Channels and caps</Heading>}>
          <Text variant="small">{data.channels}</Text>
        </Card>
        <StatusNote>{p.saved && 'Draft saved.'}</StatusNote>
        <Stack direction="row" gap={3} justify="end"><Button variant="secondary" onClick={p.save}>Save draft</Button><Button onClick={p.create} disabled={!p.ready}>Create persona</Button></Stack>
      </HubColumns>
    </HubPage>
  );
}
