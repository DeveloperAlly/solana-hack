import { Button } from '../../ui/primitives';
import { soonToggle, type SoonStatusId } from './status';
import type { StatusRowItem } from './types';

export interface StatusToggleButtonProps {
  row: StatusRowItem;
  onToggle: (id: string, next: SoonStatusId) => void;
}

/** The row button for a toggleable status (Connect, Reconnect, Disconnect, Link wallet, Unlink); none for other statuses. */
export function StatusToggleButton({ row, onToggle }: StatusToggleButtonProps) {
  const t = soonToggle[row.status];
  if (!t) return null;
  return (
    <Button variant="secondary" aria-label={`${t.label} ${row.name}`} onClick={() => onToggle(row.id, t.next)}>
      {t.label}
    </Button>
  );
}
