import { useState } from 'react';
import { useOutcomes } from './useOutcomes';

/**
 * A queue of drafted items a person approves, edits or skips (Engage-Queue replies, Influencer-Queue posts):
 * per-item text overrides, one inline editor at a time with validation, and the outcome of each item.
 */
export function useReviewQueue<O extends string>() {
  const { outcomeOf, set, clear } = useOutcomes<O>();
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const textOf = (id: string, original = '') => texts[id] ?? original;

  function edit(id: string, current: string) {
    setEditing(id);
    setDraft(current);
    setError(null);
  }

  function save() {
    if (!editing) return;
    if (!draft.trim()) return setError('Write the text before saving.');
    setTexts((t) => ({ ...t, [editing]: draft.trim() }));
    setEditing(null);
  }

  return { outcomeOf, act: set, undo: clear, textOf, editing, draft, setDraft, error, edit, save, cancel: () => setEditing(null) };
}

export type ReviewQueue<O extends string> = ReturnType<typeof useReviewQueue<O>>;
