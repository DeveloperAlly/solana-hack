/*
 * The source list on J1-Read (canvas board J1-Read, notes n-j1-read 2; issue #48): add a link, text or file; resolve a
 * blocked source by pasting its text or uploading a file; or skip it. Local state over the fixture rows; nothing is
 * sent. Backend map §4, rows "Onboard-3-Sources" and "Onboard-3b-Profiling, Ingest-Error".
 */
import { createContext, useContext, useState } from 'react';
import { uniqueId } from '../../lib/id';
import type { StatusListRow } from '../../ui/composites/StatusList';
import type { JourneySource, SourceStatus } from './types';

const statusRow: Record<SourceStatus, (s: JourneySource) => Pick<StatusListRow, 'status' | 'solid' | 'tone'>> = {
  read: (s) => ({ status: `Read · ${s.facts ?? 0} facts`, solid: true }),
  reading: () => ({ status: 'Reading…' }),
  queued: () => ({ status: 'Queued', tone: 'muted' }),
  blocked: () => ({ status: 'Blocked', solid: true, tone: 'failed' }),
  skipped: () => ({ status: 'Skipped', tone: 'muted' }),
};

/** Rows for C32 StatusList (the D12 SourceList mapping): each source with its status chip. */
export const sourceRows = (sources: JourneySource[]): StatusListRow[] => sources.map((s) => ({ id: s.id, label: s.label, ...statusRow[s.status](s) }));

export type SourceInput = { kind: 'url'; value: string } | { kind: 'text'; value: string } | { kind: 'file'; file: File };
export interface LiveJourneySources { sources: JourneySource[]; add: (label: string, input?: SourceInput) => void | Promise<void>; supply: (id: string, how: string, input?: SourceInput) => void | Promise<void>; skip: (id: string) => void | Promise<void> }
export const JourneySourcesContext = createContext<LiveJourneySources | null>(null);

export function useJourneySources(initial: JourneySource[]) {
  const live = useContext(JourneySourcesContext);
  const [previewSources, setSources] = useState(initial);
  const sources = live?.sources ?? previewSources;
  const set = (id: string, patch: Partial<JourneySource>) => setSources((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  return {
    sources,
    rows: sourceRows(sources),
    blocked: sources.find((s) => s.status === 'blocked'),
    reading: sources.find((s) => s.status === 'reading'),
    // INTEGRATION: POST /api/brands/:id/sources {url} (a link), or Storage createSignedUploadUrl (a file or pasted text).
    add: (label: string, input?: SourceInput) => {
      if (live) return live.add(label, input);
      // Unique for the page load, so an id is never reused after a source is added, skipped or replaced.
      const id = uniqueId('src');
      setSources((list) => [...list, { id, label, status: 'queued' }]);
    },
    /** The person supplied the blocked page's text or file instead: it is queued under its original name. */
    supply: (id: string, how: string, input?: SourceInput) => live ? live.supply(id, how, input) : set(id, { status: 'queued', label: `${sources.find((s) => s.id === id)?.label ?? ''} (${how})`, reason: undefined }),
    // INTEGRATION: DELETE /api/brands/:id/sources/:id removes the source and its facts.
    skip: (id: string) => live ? live.skip(id) : set(id, { status: 'skipped', reason: undefined }),
  };
}

export type JourneySourcesState = ReturnType<typeof useJourneySources>;
