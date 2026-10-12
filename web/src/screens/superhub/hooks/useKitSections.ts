import { useState } from 'react';
import type { CoverageStatus } from '../../../ui/domain/HubCoverageBadge';
import type { KitSection } from '../types';

/**
 * Brand-Build kit state (n-bb): sections in local state; Edit and "Answer 2 questions" open one inline editor at a time,
 * Save validates and stores the text, Confirm turns a drafted (Inferred) section into a confirmed one.
 */
export function useKitSections(initial: KitSection[]) {
  const [sections, setSections] = useState(initial);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const counts = sections.reduce<Record<CoverageStatus, number>>(
    (acc, s) => ({ ...acc, [s.status]: acc[s.status] + 1 }),
    { evidenced: 0, inferred: 0, missing: 0 },
  );

  function edit(id: string) {
    setEditing(id);
    setDraft(sections.find((s) => s.id === id)?.body ?? '');
    setError(null);
  }

  function save() {
    if (!draft.trim()) return setError('Write something for this section, or cancel.');
    // INTEGRATION: PATCH /api/brands/:id/sections/:section (backend map row "Brand-Build").
    // An answer to a Missing section is drafted from what you wrote, so it waits for confirmation (Inferred).
    setSections((all) => all.map((s) => (s.id === editing ? { ...s, body: draft.trim(), status: s.status === 'missing' ? 'inferred' : s.status, source: s.source ?? 'Your answer' } : s)));
    setEditing(null);
  }

  return {
    sections, counts, editing, draft, error, setDraft, edit, save,
    cancel: () => setEditing(null),
    isConfirmed: (id: string) => confirmed.includes(id),
    confirm: (id: string) => setConfirmed((c) => [...c, id]),
  };
}

export type KitState = ReturnType<typeof useKitSections>;
