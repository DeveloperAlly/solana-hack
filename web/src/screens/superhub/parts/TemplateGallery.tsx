import { Badge } from '../../../ui/primitives/Badge';
import { Grid, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { paths } from '../paths';
import type { VoiceTemplatesData } from '../types';

/** D21 TemplateGallery: the 12 template cards; each opens the voice editor; the core voice's template is selected. */
export function TemplateGallery({ data }: { data: VoiceTemplatesData }) {
  return (
    <Stack as="section" gap={3} aria-labelledby="voices-start">
      <Stack direction="row" gap={3} align="baseline" wrap>
        <Heading level={2} size="lg" id="voices-start">Start from a template</Heading>
        <Text variant="small" tone="secondary">Descriptions are read off each preset's 1 and 5 values</Text>
      </Stack>
      <Grid min="sm" gap={3}>
        {data.templates.map((tpl) => (
          <Card key={tpl.id} href={paths.voiceEditor} variant={tpl.id === data.selectedTemplate ? 'selected' : 'default'}>
            <Text as="span" variant="label">{tpl.name}{tpl.id === data.selectedTemplate && <span className="wl-visually-hidden"> (used by the core voice)</span>}</Text>
            {tpl.contentPolicy && <Badge>Content-policy gate</Badge>}
            <Text as="span" variant="small" tone="secondary">{tpl.description}</Text>
            <Text as="span" variant="mono">Claims gate {tpl.claimsGate}/5</Text>
          </Card>
        ))}
      </Grid>
    </Stack>
  );
}
