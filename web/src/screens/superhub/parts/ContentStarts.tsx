import { Grid, Heading, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { TargetButton } from './TargetButton';
import type { ContentDashboardData } from '../types';

/** Content-Dashboard-Empty (n-cde): three ways to start, and the reminder that nothing posts without approval. */
export function ContentStarts({ starts }: { starts: ContentDashboardData['starts'] }) {
  return (
    <Card labelledBy="content-empty" header={<Heading level={2} size="lg" id="content-empty">Nothing waiting for you</Heading>}>
      <Text tone="secondary">Drafts land here after the brand and slop checks. Nothing is posted until you approve it.</Text>
      <Grid min="sm" gap={3}>
        {starts.map((s) => (
          <Card key={s.id} as="div" variant="subtle">
            <Text variant="label">{s.title}</Text>
            <Text variant="small" tone="secondary">{s.body}</Text>
            <TargetButton target={s}>{s.action}</TargetButton>
          </Card>
        ))}
      </Grid>
    </Card>
  );
}
