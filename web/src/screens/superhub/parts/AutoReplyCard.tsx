import { Badge } from '../../../ui/primitives/Badge';
import { Button, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import type { EngageRulesState } from '../hooks/useEngageRules';
import type { EngageRulesData } from '../types';
import { InlineEditor } from './InlineEditor';

export interface AutoReplyCardProps {
  autoReply: EngageRulesData['autoReply'];
  state: EngageRulesState;
}

/** Opt-in auto-replies (n-er 2): wording approved once, one reply per request, STOP to opt out; an edit needs re-approval. */
export function AutoReplyCard({ autoReply, state }: AutoReplyCardProps) {
  return (
    <Card labelledBy="rules-auto" header={<><Heading level={2} size="lg" id="rules-auto">Opt-in auto-replies</Heading><Badge>Wording approved once</Badge></>}>
      <Text variant="small" tone="secondary">Sent only to people who asked for it, one reply per request, with a way to stop.</Text>
      <Card as="div" variant="subtle">
        <Text><strong>"{autoReply.keyword}"</strong> keyword · {autoReply.where}</Text>
        {state.editingWording ? (
          <InlineEditor label="Auto-reply wording" value={state.wordingDraft} error={state.wordingError} onChange={state.setWordingDraft} onSave={state.saveWording} onCancel={state.cancelWording} />
        ) : (
          <Text variant="small">When someone sends "{autoReply.keyword}", reply once: "{state.wording}"</Text>
        )}
        <Stack direction="row" gap={2} align="center" wrap>
          <Badge tone={state.approved ? 'neutral' : 'warning'}>{state.approved ? autoReply.approved : 'Changed: needs your approval'}</Badge>
          <Badge>{state.approved ? 'On' : 'Paused'}</Badge>
          {!state.approved && <Button onClick={state.approve}>Approve wording</Button>}
          {!state.editingWording && <Button variant="secondary" onClick={state.editWording}>Edit wording</Button>}
        </Stack>
      </Card>
    </Card>
  );
}
