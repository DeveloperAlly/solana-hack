/*
 * The source list on J1-Read (canvas board J1-Read, notes n-j1-read 2; issue #48): add a link, text or file; resolve a
 * blocked source by pasting its text or uploading a file; or skip it. Local state over the fixture rows; nothing is
 * sent. Backend map §4, rows "Onboard-3-Sources" and "Onboard-3b-Profiling, Ingest-Error".
 */
import { useState } from 'react';
import type { JourneySource, JourneyStatusRow, SourceStatus } from './types';

const statusRow: Record<SourceStatus, (s: JourneySource) => Pick<JourneyStatusRow, 'value' | 'solid'>> = {
  read: (s) => ({ value: `Read · ${s.facts ?? 0} facts`, solid: true }),
  reading: () => ({ value: 'Reading…' }),
  queued: () => ({ value: 'Queued' }),
  blocked: () => ({ value: 'Blocked', solid: true }),
  skipped: () => ({ value: 'Skipped' }),
};

/** Rows for JourneyStatusList: each source with its status chip. */
export const sourceRows = (sources: JourneySource[]): JourneyStatusRow[] => sources.map((s) => ({ label: s.label, ...statusRow[s.status](s) }));

export function useJourneySources(initial: JourneySource[]) {
  const [sources, setSources] = useState(initial);
  const set = (id: string, patch: Partial<JourneySource>) => setSources((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  return {
    sources,
    rows: sourceRows(sources),
    blocked: sources.find((s) => s.status === 'blocked'),
    reading: sources.find((s) => s.status === 'reading'),
    // INTEGRATION: POST /api/brands/:id/sources {url} (a link), or Storage createSignedUploadUrl (a file or pasted text).
    add: (label: string) => setSources((list) => [...list, { id: `added-${list.length}`, label, status: 'queued' }]),
    /** The person supplied the blocked page's text or file instead: it is queued under its original name. */
    supply: (id: string, how: string) => set(id, { status: 'queued', label: `${sources.find((s) => s.id === id)?.label ?? ''} (${how})`, reason: undefined }),
    // INTEGRATION: DELETE /api/brands/:id/sources/:id removes the source and its facts.
    skip: (id: string) => set(id, { status: 'skipped', reason: undefined }),
  };
}

export type JourneySourcesState = ReturnType<typeof useJourneySources>;
