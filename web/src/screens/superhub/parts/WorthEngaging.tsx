import { useId } from 'react';
import { Button, Heading, Stack, Text } from '../../../ui/primitives';
import type { HeadingLevel } from '../../../ui/primitives/Heading';
import { Card } from '../../../ui/composites/Card';
import type { EngageQueueData } from '../types';

export interface WorthEngagingProps {
  suggestions: EngageQueueData['suggestions'];
  note: string;
  isDrafted: (id: string) => boolean;
  onDraft: (id: string) => void;
  level?: HeadingLevel;
}

/** D42 SuggestionCard list, "Worth engaging with" (n-eq 3): public conversations you may reply to; you choose. */
export function WorthEngaging({ suggestions, note, isDrafted, onDraft, level = 2 }: WorthEngagingProps) {
  const headingId = useId();
  return (
    <Card labelledBy={headingId} header={<Heading level={level} size="lg" id={headingId}>Worth engaging with</Heading>}>
      {suggestions.map((s) => (
        <Stack key={s.id} gap={2}>
          <Text variant="small"><strong>{s.who}</strong> {s.what}</Text>
          {/* INTEGRATION: POST a reply draft for this public post (DraftWorkflow); it joins the reply queue for approval. */}
          {isDrafted(s.id)
            ? <Text variant="small" role="status">Reply drafted. It waits in your reply queue.</Text>
            : <Button variant="secondary" onClick={() => onDraft(s.id)}>Draft a reply</Button>}
        </Stack>
      ))}
      <Text variant="small" tone="secondary">{note}</Text>
    </Card>
  );
}
