import { Button, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { AmbDraftEditor } from '../../../ui/domain/AmbDraftEditor';
import { useDisclosure } from '../../../ui/hooks/useDisclosure';
import type { DraftState } from '../useDraft';

export interface DraftPanelProps {
  draft: DraftState;
  charLimit: number;
  generating: boolean;
}

/** The draft editor with Undo and History (canvas Amb-3 toolbar; note n-a3: "edits kept in history"). */
export function DraftPanel({ draft, charLimit, generating }: DraftPanelProps) {
  const history = useDisclosure();
  const toolbar = (
    <>
      <Button variant="secondary" onClick={draft.undo} disabled={generating || draft.history.length === 0}>Undo</Button>
      <Button variant="secondary" onClick={history.toggle} aria-expanded={history.open} disabled={generating}>History ({draft.history.length})</Button>
    </>
  );
  return (
    <Stack gap={3}>
      <AmbDraftEditor label="Draft" value={draft.text} onChange={draft.setText} highlights={draft.highlights} charLimit={charLimit} generating={generating} toolbar={toolbar} />
      {history.open && (
        <Card variant="subtle" as="div">
          <Text variant="label">Earlier versions</Text>
          {draft.history.length === 0 && <Text variant="small" tone="secondary">No earlier versions yet. Fixes and regenerations are kept here.</Text>}
          <Stack as="ol" gap={2} aria-label="Earlier versions">
            {draft.history.map((h, i) => (
              <li key={`${i}-${h.length}`}>
                <Stack direction="row" gap={3} align="center" justify="between" wrap>
                  <Text variant="small" truncate>{h.split('\n')[0]}</Text>
                  <Button variant="secondary" onClick={() => draft.restore(i)}>Restore{' '}<span className="wl-visually-hidden">version {i + 1}</span></Button>
                </Stack>
              </li>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
