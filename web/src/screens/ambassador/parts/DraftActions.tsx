import { Button, Stack } from '../../../ui/primitives';
import type { DraftState } from '../useDraft';
import { PublishButton } from './PublishButton';

export interface DraftActionsProps {
  draft: DraftState;
  generating: boolean;
  /** "Continue to publish" (desktop, canvas Amb-3) or "Publish" (mobile, M-3). */
  publishLabel: string;
  onPublish: () => void;
  /** `stack` in the desktop rail; `row` in the mobile bottom bar. */
  layout: 'stack' | 'row';
}

/** Generate's actions on both layouts: Regenerate (keeps your angle) and the gated Publish (canvas note n-a3). */
export function DraftActions({ draft, generating, publishLabel, onPublish, layout }: DraftActionsProps) {
  return (
    <Stack direction={layout === 'row' ? 'row' : 'column'} gap={2} align={layout === 'row' ? 'start' : 'stretch'}>
      <Button variant="secondary" onClick={draft.regenerate} disabled={generating}>Regenerate</Button>
      <PublishButton label={publishLabel} gate={draft.gate} onPublish={onPublish} fullWidth={layout === 'row'} />
    </Stack>
  );
}
