import { Button, Grid, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { DataTable } from '../../../ui/composites/DataTable';
import { HubBarList } from '../../../ui/domain/HubBarList';
import { useOutcomes } from '../hooks/useOutcomes';
import { paths } from '../paths';
import type { AnalyticsData, AnalyticsRange } from '../types';
import { StatusNote } from './StatusNote';

const rate = (s: string) => Number.parseFloat(s);

/** D47 BreakdownCards by voice and format, top posts, what's not working, and D42 suggestions you apply (n-an 1–3). */
export interface AnalyticsBreakdownsProps {
  numbers: AnalyticsRange;
  suggestions: AnalyticsData['suggestions'];
  note: string;
}

const none = 'No numbers for this range yet.';

export function AnalyticsBreakdowns({ numbers, suggestions, note }: AnalyticsBreakdownsProps) {
  const { outcomeOf, set, clear } = useOutcomes<'applied'>();
  return (
    <Stack gap={5}>
      <Grid min="md" gap={4}>
        <Card labelledBy="an-voice" header={<Heading level={2} size="lg" id="an-voice">Engagement by voice</Heading>}><HubBarList label="Engagement by voice" items={numbers.byVoice} />{numbers.byVoice.length === 0 && <Text tone="secondary">{none}</Text>}</Card>
        <Card labelledBy="an-format" header={<Heading level={2} size="lg" id="an-format">Engagement by format</Heading>}><HubBarList label="Engagement by format" items={numbers.byFormat} />{numbers.byFormat.length === 0 && <Text tone="secondary">{none}</Text>}</Card>
      </Grid>
      <Grid min="md" gap={4}>
        <Card labelledBy="an-top" header={<Heading level={2} size="lg" id="an-top">Top posts</Heading>}>
          <DataTable caption="Top posts by engagement" hideCaption rows={numbers.top} empty={none} rowKey={(r) => r.id} columns={[{ key: 'post', header: 'Post', rowHeader: true }, { key: 'rate', header: 'Engagement', align: 'end', sort: (a, b) => rate(a.rate) - rate(b.rate) }]} actions={() => <Button variant="secondary" href={paths.content}>Open</Button>} />
        </Card>
        <Card labelledBy="an-not" header={<Heading level={2} size="lg" id="an-not">Not working</Heading>}>
          <DataTable caption="Patterns not working" hideCaption rows={numbers.notWorking} empty={none} rowKey={(r) => r.id} columns={[{ key: 'what', header: 'Pattern', rowHeader: true }, { key: 'rate', header: 'Engagement', align: 'end', sort: (a, b) => rate(a.rate) - rate(b.rate) }, { key: 'posts', header: 'Posts', align: 'end' }]} />
        </Card>
      </Grid>
      <Card variant="subtle" labelledBy="an-suggest" header={<Heading level={2} size="lg" id="an-suggest">Suggested changes</Heading>}>
        {suggestions.map((s) => (
          <Stack key={s.id} direction="row" gap={3} align="center" wrap>
            <Text>{s.text}</Text>
            {s.href && <Button variant="secondary" href={s.href}>{s.action}</Button>}
            {/* INTEGRATION: apply the change to next week's content plan (campaigns plan; Roadmap "Analytics"). */}
            {!s.href && !outcomeOf(s.id) && <Button variant="secondary" onClick={() => set(s.id, 'applied')}>{s.action}</Button>}
            {!s.href && <StatusNote onUndo={outcomeOf(s.id) ? () => clear(s.id) : undefined}>{outcomeOf(s.id) && "Applied to next week's plan."}</StatusNote>}
          </Stack>
        ))}
        <Text variant="small" tone="secondary">{note}</Text>
      </Card>
    </Stack>
  );
}
