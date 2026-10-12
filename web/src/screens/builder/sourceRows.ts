// D12 SourceList rows drawn with the shared C32 StatusList (screens/README.md, migration table: BuilderSourceList).
import type { StatusListRow } from '../../ui/composites/StatusList';
import type { SourceRow, SourceRowTone } from './types';

const listTone: Record<SourceRowTone, StatusListRow['tone']> = { done: 'default', active: 'default', waiting: 'muted', failed: 'failed' };

/** Solid chips for work in progress and failures (canvas "chipd"); waiting rows muted; failed rows framed with their reason. */
export function toStatusRows(rows: SourceRow[]): StatusListRow[] {
  return rows.map((r) => ({ id: r.id, label: r.name, status: r.status, solid: r.tone === 'active' || r.tone === 'failed', tone: listTone[r.tone], detail: r.error }));
}
