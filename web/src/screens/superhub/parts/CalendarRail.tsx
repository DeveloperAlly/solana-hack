import { Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import type { ContentDashboardData } from '../types';

export interface CalendarRailProps {
  slots: ContentDashboardData['calendar'];
  note: string;
}

/** The week's posting slots (n-cd 3); unapproved items never post. Anchored as #calendar for the Calendar tab. */
export function CalendarRail({ slots, note }: CalendarRailProps) {
  return (
    <Stack as="aside" id="calendar" aria-labelledby="content-week">
      <Card as="div" variant="subtle" header={<Heading level={2} size="lg" id="content-week">This week</Heading>}>
        {slots.map((s) => (
          <Text key={s.day} variant="small"><strong>{s.day}</strong> {s.text}{s.note && <Text as="span" variant="small" tone="secondary"> {s.note}</Text>}</Text>
        ))}
        <Text variant="small" tone="secondary">{note}</Text>
      </Card>
    </Stack>
  );
}
