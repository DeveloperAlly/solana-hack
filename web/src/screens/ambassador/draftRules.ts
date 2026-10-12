// Local draft rules for Generate (canvas note n-a3; issue #53): flag detection, one-click fixes, the score and the single
// publish gate. INTEGRATION: GET /api/drafts/:id/checks returns the real checks and score; the gate keeps the same shape.
import type { DraftCheck, GenerateData } from './types';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True when `token` appears as a whole token: "#ad" matches "#ad" and "#ad." but not "#adventure" or "x#ad". */
export function hasToken(text: string, token: string): boolean {
  return new RegExp(`(^|[^\\w#])${escape(token)}(?!\\w)`, 'i').test(text);
}

/** True while the check still applies to the text: the phrase is present, or no disclosure form is. */
export function isOpen(check: DraftCheck, text: string): boolean {
  const { rule } = check;
  if (rule.kind === 'missing') return !rule.anyOf.some((form) => hasToken(text, form));
  return text.toLowerCase().includes(rule.phrase.toLowerCase());
}

/** Splits a line into sentences, keeping each sentence's trailing punctuation and space. */
const sentences = (line: string) => line.match(/[^.!?]*[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [line];

/**
 * "Remove line": removes only the sentence that holds the flagged phrase. Other sentences on that line, and every other
 * line, are left exactly as written. A line left empty is dropped with one of the blank lines around it.
 */
export function removeFlagged(text: string, phrase: string): string {
  const needle = phrase.toLowerCase();
  const lines = text.split('\n');
  const out: string[] = [];
  let skipBlank = false;
  lines.forEach((line, i) => {
    if (skipBlank && line === '') {
      skipBlank = false;
      return;
    }
    skipBlank = false;
    if (!line.toLowerCase().includes(needle)) {
      out.push(line);
      return;
    }
    const rest = sentences(line).filter((s) => !s.toLowerCase().includes(needle)).join('').trimEnd();
    if (rest !== '') {
      out.push(rest);
      return;
    }
    const nextBlank = i + 1 >= lines.length || lines[i + 1] === '';
    if (out.length && out[out.length - 1] === '' && nextBlank) out.pop();
    else if (out.length === 0) skipBlank = true;
  });
  return out.join('\n');
}

/** Applies a check's one-click fix to the text. */
export function applyFix(check: DraftCheck, text: string): string {
  const { rule } = check;
  if (rule.kind === 'missing') return `${text.trimEnd()}\n\n${rule.append}`;
  if (rule.fix.kind === 'replace') return text.replace(new RegExp(escape(rule.phrase), 'gi'), rule.fix.with);
  return removeFlagged(text, rule.phrase);
}

/**
 * Local on-brand score: the canvas gives the score as generated (74%) and with every flag fixed (91%, Amb-4), so each
 * open flag takes an equal share of the difference.
 */
export function scoreFor(openCount: number, data: Pick<GenerateData, 'score' | 'scoreWhenClean' | 'checks'>): number {
  const total = data.checks.length || 1;
  return Math.round(data.scoreWhenClean - (openCount * (data.scoreWhenClean - data.score)) / total);
}

export interface PublishGate {
  ok: boolean;
  /** Why publishing is locked, shown next to both Publish buttons (aria-describedby); null when open. */
  reason: string | null;
}

export interface GateInput {
  text: string;
  open: DraftCheck[];
  checks: DraftCheck[];
  score: number;
  threshold: number;
  charLimit: number;
  generating: boolean;
  /** The chosen piece was already written for this campaign (canvas Amb-3: "(done)"; Amb-2: one per channel). */
  pieceDone: boolean;
}

/** The text left once every disclosure form is taken out, to tell a real post from a bare "#ad". */
function body(text: string, checks: DraftCheck[]): string {
  return checks
    .flatMap((c) => (c.rule.kind === 'missing' ? c.rule.anyOf : []))
    .reduce((t, form) => t.replace(new RegExp(`(^|[^\\w#])${escape(form)}(?!\\w)`, 'gi'), '$1'), text)
    .trim();
}

/**
 * The one publish gate (canvas note n-a3): publishing unlocks only when the piece is not one already written, a draft
 * exists and is not generating, it is
 * within the channel's character limit, no blocking flag is open (banned claim, missing disclosure) and the score is at
 * least the threshold. Desktop Continue and mobile Publish both read this and nothing else.
 */
export function publishGate({ text, open, checks, score, threshold, charLimit, generating, pieceDone }: GateInput): PublishGate {
  const blocked = (reason: string): PublishGate => ({ ok: false, reason });
  if (generating) return blocked('Wait for the draft to finish generating.');
  if (pieceDone) return blocked('You already wrote this piece for this campaign. Pick another format.');
  if (body(text, checks) === '') return blocked('Write your post first.');
  if (text.length > charLimit) return blocked(`Over the ${charLimit}-character limit by ${text.length - charLimit}.`);
  const blocking = open.filter((c) => c.rule.blocks);
  if (blocking.length) return blocked(`Fix first: ${blocking.map((c) => c.title.toLowerCase()).join(', ')}.`);
  if (score < threshold) return blocked(`On-brand is ${score}%; publishing unlocks at ${threshold}%.`);
  return { ok: true, reason: null };
}
