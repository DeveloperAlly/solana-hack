import { Badge } from '../../../ui/primitives/Badge';
import { Box, Button, Field, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { CoverageBadge } from '../../../ui/domain/CoverageBadge';
import type { KitState } from '../hooks/useKitSections';
import type { KitSection } from '../types';

export interface KitSectionCardProps {
  section: KitSection;
  kit: KitState;
}

/** One of the 17 kit sections (n-bb 1–5): status badge, gate tag, content with its source, personas, and actions. */
export function KitSectionCard({ section: s, kit }: KitSectionCardProps) {
  const headingId = `kit-${s.id}`;
  const drafted = s.status === 'inferred' && !kit.isConfirmed(s.id);
  return (
    <Box as="section" id={s.id} aria-labelledby={headingId} padding={5} border="default" radius="box" background="surface">
      <Stack gap={3}>
        <Stack direction="row" gap={2} align="center" wrap>
          <Heading level={2} size="lg" id={headingId}>{s.num}. {s.title}</Heading>
          {s.gate && <Badge>{s.gate}</Badge>}
          <CoverageBadge status={s.status} display="word" />
        </Stack>
        {s.body ? (
          <Text>{drafted && <><Badge>Drafted, confirm</Badge>{' '}</>}{s.body}</Text>
        ) : (
          <Text variant="small" tone="secondary">Nothing in your sources covers this.</Text>
        )}
        {s.source && <Text variant="small" tone="secondary">Source: {s.source}</Text>}
        {kit.isConfirmed(s.id) && <Text variant="small" role="status">Confirmed by you.</Text>}
        {s.personas && (
          <Stack direction="row" gap={3} wrap>
            {s.personas.map((p) => (
              <Card key={p.name} as="div" variant="dashed"><Text variant="small"><Badge>Assumption</Badge> <strong>{p.name}</strong></Text><Text variant="small">{p.detail}</Text></Card>
            ))}
          </Stack>
        )}
        {kit.editing === s.id ? (
          <Stack gap={2}>
            <Field label={s.body ? `Edit ${s.title}` : `Your answer: ${s.title}`} multiline rows={3} value={kit.draft} error={kit.error} onChange={(e) => kit.setDraft(e.target.value)} />
            <Stack direction="row" gap={2}><Button onClick={kit.save}>Save</Button><Button variant="secondary" onClick={kit.cancel}>Cancel</Button></Stack>
          </Stack>
        ) : (
          <Stack direction="row" gap={2} wrap>
            {drafted && <Button variant="secondary" onClick={() => kit.confirm(s.id)}>Confirm</Button>}
            <Button variant="secondary" onClick={() => kit.edit(s.id)}>{s.body ? 'Edit' : 'Answer 2 questions'}</Button>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
