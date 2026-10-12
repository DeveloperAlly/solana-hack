import type { ReactNode } from 'react';
import { Button, Stack, Text } from '../../../ui/primitives';

export interface StatusNoteProps {
  children?: ReactNode;
  /** Undo for the action that produced the note. */
  onUndo?: () => void;
}

/** The polite result line after a local action ("Sent", "Snoozed"), with an optional Undo. Renders nothing when empty. */
export function StatusNote({ children, onUndo }: StatusNoteProps) {
  if (!children) return null;
  return (
    <Stack direction="row" gap={3} align="center" wrap>
      <Text variant="small" role="status">{children}</Text>
      {onUndo && <Button variant="secondary" onClick={onUndo}>Undo</Button>}
    </Stack>
  );
}
