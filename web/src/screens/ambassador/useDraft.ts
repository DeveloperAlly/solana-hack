import { useEffect, useMemo, useRef, useState } from 'react';
import { applyFix, isOpen, publishGate, scoreFor } from './draftRules';
import { pieceLabel } from './copy';
import { ambSession } from './session';
import type { GenerateData } from './types';

export { applyFix, isOpen, scoreFor };

/**
 * Draft editing state for Generate (canvas note n-a3): the text, angle and format; open flags and the score update as
 * you type; one-click fixes; Regenerate keeps the angle; Undo and History keep earlier versions. `gate` (draftRules.ts
 * publishGate) is the only thing that decides whether the draft can be published.
 */
export function useDraft(data: GenerateData, { generating = false }: { generating?: boolean } = {}) {
  // Start from what this tab already chose (a draft edited earlier, the piece picked); the fixture is only the default.
  const [text, setText] = useState(() => ambSession.get().draft ?? data.draft);
  const [angle, setAngle] = useState(data.angle);
  const [format, setFormat] = useState(() => ambSession.get().piece?.id ?? data.format);
  const campaign = ambSession.get().campaign ?? data.campaign;
  const piece = data.formats.find((f) => f.id === format) ?? data.formats[0];
  // Earlier versions, newest first. Ids come from a counter that only goes up, so they never repeat after an undo.
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const nextId = useRef(1);
  const [note, setNote] = useState(data.generatedNote);

  const open = useMemo(() => data.checks.filter((c) => isOpen(c, text)), [data.checks, text]);
  const score = scoreFor(open.length, data);
  const gate = publishGate({ text, open, checks: data.checks, score, threshold: data.threshold, charLimit: data.charLimit, generating, pieceDone: Boolean(piece.done) });
  const disclosed = !open.some((c) => c.rule.kind === 'missing');

  // Hand the piece, the draft and its review to Publish and Status (session.ts), on every change.
  useEffect(() => {
    ambSession.update({ piece, draft: text, review: { score, openFlags: open.length, disclosed } });
  }, [piece, text, score, open.length, disclosed]);

  function snapshot(next: string, why: string) {
    const id = nextId.current++;
    setHistory((h) => [{ id, text }, ...h]);
    setText(next);
    setNote(why);
  }

  return {
    text,
    setText,
    angle,
    setAngle,
    format,
    setFormat,
    campaign,
    piece,
    formatLabel: pieceLabel(piece),
    note,
    open,
    highlights: open.flatMap((c) => (c.phrase ? [c.phrase] : [])),
    score,
    gate,
    history,
    fix: (id: string) => {
      const check = data.checks.find((c) => c.id === id);
      if (check) snapshot(applyFix(check, text), `Fixed: ${check.title.toLowerCase()} · edits saved`);
    },
    // INTEGRATION: POST /api/campaigns/:id/drafts with { format, angle } regenerates in the kit voice (DraftWorkflow via OpenRouter).
    regenerate: () => snapshot(data.draft, 'Regenerated from your angle · the previous version is in History'),
    undo: () => {
      if (history.length === 0) return;
      setText(history[0].text);
      setHistory((h) => h.slice(1));
      setNote('Undone · edits saved');
    },
    restore: (id: number) => {
      const version = history.find((h) => h.id === id);
      if (version) snapshot(version.text, 'Restored from History · edits saved');
    },
  };
}

export type DraftState = ReturnType<typeof useDraft>;
