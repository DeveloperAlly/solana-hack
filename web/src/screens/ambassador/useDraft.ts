import { useMemo, useState } from 'react';
import type { DraftCheck, GenerateData } from './types';

/** True while the check still applies to the text: the phrase is present, or no disclosure form is. */
export function isOpen(check: DraftCheck, text: string): boolean {
  const lower = text.toLowerCase();
  if (check.rule.kind === 'missing') return !check.rule.anyOf.some((s) => lower.includes(s.toLowerCase()));
  return lower.includes(check.rule.phrase.toLowerCase());
}

/** Applies a check's one-click fix to the text. */
export function applyFix(check: DraftCheck, text: string): string {
  const { rule } = check;
  if (rule.kind === 'missing') return `${text.trimEnd()}\n\n${rule.append}`;
  if (rule.fix.kind === 'replace') return text.replace(new RegExp(rule.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), rule.fix.with);
  return text
    .split('\n\n')
    .filter((p) => !p.toLowerCase().includes(rule.phrase.toLowerCase()))
    .join('\n\n');
}

/**
 * Local on-brand score: the canvas gives the score as generated (74%) and with every flag fixed (91%, Amb-4), so each
 * open flag takes an equal share of the difference. INTEGRATION: GET /api/drafts/:id/checks returns the real score.
 */
export function scoreFor(openCount: number, data: Pick<GenerateData, 'score' | 'scoreWhenClean' | 'checks'>): number {
  const total = data.checks.length || 1;
  return Math.round(data.scoreWhenClean - (openCount * (data.scoreWhenClean - data.score)) / total);
}

/**
 * Draft editing state for Generate (canvas note n-a3): the text, angle and format; open flags and the score update as
 * you type; one-click fixes; Regenerate keeps the angle; Undo and History keep earlier versions. Publish unlocks at
 * the threshold with no blocking flag (banned claim, missing disclosure).
 */
export function useDraft(data: GenerateData) {
  const [text, setText] = useState(data.draft);
  const [angle, setAngle] = useState(data.angle);
  const [format, setFormat] = useState(data.format);
  const [history, setHistory] = useState<string[]>([]);
  const [note, setNote] = useState(data.generatedNote);

  const open = useMemo(() => data.checks.filter((c) => isOpen(c, text)), [data.checks, text]);
  const score = scoreFor(open.length, data);
  const canPublish = score >= data.threshold && !open.some((c) => c.rule.blocks);

  function snapshot(next: string, why: string) {
    setHistory((h) => [text, ...h]);
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
    formatLabel: data.formats.find((f) => f.id === format)?.label ?? data.formatLabel,
    note,
    open,
    highlights: open.flatMap((c) => (c.phrase ? [c.phrase] : [])),
    score,
    canPublish,
    history,
    fix: (id: string) => {
      const check = data.checks.find((c) => c.id === id);
      if (check) snapshot(applyFix(check, text), `Fixed: ${check.title.toLowerCase()} · edits saved`);
    },
    // INTEGRATION: POST /api/campaigns/:id/drafts with { format, angle } regenerates in the kit voice (DraftWorkflow via OpenRouter).
    regenerate: () => snapshot(data.draft, 'Regenerated from your angle · the previous version is in History'),
    undo: () => {
      if (history.length === 0) return;
      setText(history[0]);
      setHistory((h) => h.slice(1));
      setNote('Undone · edits saved');
    },
    restore: (index: number) => snapshot(history[index], 'Restored from History · edits saved'),
  };
}

export type DraftState = ReturnType<typeof useDraft>;
