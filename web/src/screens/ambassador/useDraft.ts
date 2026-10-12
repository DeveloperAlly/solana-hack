import { useEffect, useMemo, useState } from 'react';
import { uniqueId } from '../../lib/id';
import { applyFix, draftChecks, gateFor, isOpen, scoreFor } from './draftRules';
import { pieceLabel } from './copy';
import { ambSession } from './session';
import { charLimitFor } from '../../config/platforms';
import type { GenerateData } from './types';

export { applyFix, isOpen, scoreFor };

/**
 * Draft editing state for Generate (canvas note n-a3): the text, angle and format; open flags and the score update as
 * you type; one-click fixes; Regenerate keeps the angle; Undo and History keep earlier versions. `checks` (draftRules.ts
 * draftChecks) is every check shown, and `gate` is only "none of them is blocking".
 */
export function useDraft(data: GenerateData, { generating = false }: { generating?: boolean } = {}) {
  // Start from what this tab already chose (a draft edited earlier, the piece picked); the fixture is only the default.
  const [text, setText] = useState(() => ambSession.read().draft ?? data.draft);
  const [angle, setAngle] = useState(() => ambSession.read().angle ?? data.angle);
  const [format, setFormat] = useState(() => ambSession.read().piece?.id ?? data.format);
  const campaign = ambSession.read().campaign ?? data.campaign;
  const piece = data.formats.find((f) => f.id === format) ?? data.formats[0];
  // Earlier versions, newest first. Ids come from the shared uniqueId, so they never repeat after an undo.
  const [history, setHistory] = useState<{ id: string; text: string }[]>([]);
  const [note, setNote] = useState(data.generatedNote);

  const open = useMemo(() => data.checks.filter((c) => isOpen(c, text)), [data.checks, text]);
  const score = scoreFor(open.length, data);
  // Every check shown (list, badges) and the gate come from this one function (draftRules.ts).
  // The limit comes from the selected piece's channel (config/platforms.ts), not one fixture value (Codex review on PR #78).
  const charLimit = charLimitFor(piece.channel);
  const checks = draftChecks({ text, rules: data.checks, score, threshold: data.threshold, charLimit, pieceDone: Boolean(piece.done) });
  const gate = gateFor(checks, generating);
  const disclosed = !open.some((c) => c.rule.kind === 'missing');

  // Hand the piece, the draft, the angle and the review to later screens (session.ts), on every change.
  useEffect(() => {
    ambSession.set({ piece, draft: text, angle, review: { score, openFlags: open.length, disclosed } });
  }, [piece, text, angle, score, open.length, disclosed]);

  function snapshot(next: string, why: string) {
    const id = uniqueId('version');
    setHistory((h) => [{ id, text }, ...h]);
    setText(next);
    setNote(why);
  }

  return {
    text,
    setText,
    /** The selected piece's character limit, or null. */
    charLimit,
    angle,
    setAngle,
    format,
    setFormat,
    campaign,
    piece,
    formatLabel: pieceLabel(piece),
    note,
    open,
    checks,
    /** The meter's chip reads the same score check the list and the gate use. */
    scoreBlocks: checks.some((c) => c.id === 'score'),
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
    restore: (id: string) => {
      const version = history.find((h) => h.id === id);
      if (version) snapshot(version.text, 'Restored from History · edits saved');
    },
  };
}

export type DraftState = ReturnType<typeof useDraft>;
