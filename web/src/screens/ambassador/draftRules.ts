// Local draft rules for Generate (canvas note n-a3; issue #53): flag detection, one-click fixes, the score and the single
// publish gate, all from one checks function. INTEGRATION: GET /api/drafts/:id/checks returns the real checks and score; the gate keeps the same shape.
import type { AmbCheck } from '../../ui/domain/AmbChecksList';
import type { DraftCheck, GenerateData } from './types';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A whole-token pattern: not preceded by a word character or '#', not followed by a word character. */
const tokenRe = (token: string, flags: string) => new RegExp(`(^|[^\\w#])${escape(token)}(?!\\w)`, flags);

/** True when `token` appears as a whole token: "#ad" matches "#ad" and "#ad." but not "#adventure" or "x#ad". */
export function hasToken(text: string, token: string): boolean {
  return tokenRe(token, 'i').test(text);
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

/** One check on the draft as shown: the list, the badges and the publish gate all read these. */
export interface DraftCheckResult extends AmbCheck {
  blocking: boolean;
  label: string;
}

export interface ChecksInput {
  text: string;
  /** The rule-based flags (banned claim, avoided term, missing disclosure). */
  rules: DraftCheck[];
  score: number;
  threshold: number;
  charLimit: number;
  /** The chosen piece was already written for this campaign (canvas Amb-3: "(done)"; Amb-2: one per channel). */
  pieceDone: boolean;
}

/** True when the text, with every disclosure form taken out, still has a letter or a digit: "#ad." alone is not a post. */
function hasBody(text: string, rules: DraftCheck[]): boolean {
  return /[\p{L}\p{N}]/u.test(withoutDisclosure(text, rules));
}

function withoutDisclosure(text: string, rules: DraftCheck[]): string {
  return rules
    .flatMap((c) => (c.rule.kind === 'missing' ? c.rule.anyOf : []))
    .reduce((t, form) => t.replace(tokenRe(form, 'gi'), '$1'), text)
    .trim();
}

/**
 * Every check on the draft, in one place (canvas note n-a3): the piece is not one already written, there is a post,
 * it is within the channel's character limit, each brand rule (banned claim, avoided term, disclosure) and the on-brand
 * score. Each returns { blocking, label }; the checks list and its badges render these, and publishing is open only
 * when none is blocking.
 */
export function draftChecks({ text, rules, score, threshold, charLimit, pieceDone }: ChecksInput): DraftCheckResult[] {
  const out: DraftCheckResult[] = [];
  if (pieceDone) out.push({ id: 'piece-done', title: 'Piece already written', label: 'You already wrote this piece for this campaign. Pick another format.', blocking: true });
  if (!hasBody(text, rules)) out.push({ id: 'empty', title: 'No post yet', label: 'Write your post first.', blocking: true });
  if (text.length > charLimit) {
    out.push({ id: 'limit', title: 'Over the limit', label: `Over the ${charLimit}-character limit by ${text.length - charLimit}.`, blocking: true });
  }
  for (const c of rules) {
    if (isOpen(c, text)) out.push({ id: c.id, title: c.title, phrase: c.phrase, label: c.label, fixLabel: c.fixLabel, shortFixLabel: c.shortFixLabel, blocking: c.rule.blocks });
  }
  if (score < threshold) out.push({ id: 'score', title: 'Below the on-brand line', label: `On-brand is ${score}%; publishing unlocks at ${threshold}%.`, blocking: true });
  return out;
}

export interface PublishGate {
  ok: boolean;
  /** Why publishing is locked, shown next to both Publish buttons (aria-describedby); null when open. */
  reason: string | null;
}

/**
 * The publish gate is only "no check is blocking" (plus: not while a draft is generating). Desktop Continue and mobile
 * Publish both read this and nothing else.
 */
export function gateFor(checks: DraftCheckResult[], generating: boolean): PublishGate {
  if (generating) return { ok: false, reason: 'Wait for the draft to finish generating.' };
  const blocking = checks.filter((c) => c.blocking);
  if (blocking.length === 0) return { ok: true, reason: null };
  if (blocking.length === 1) return { ok: false, reason: blocking[0].label };
  return { ok: false, reason: `Fix first: ${blocking.map((c) => c.title.toLowerCase()).join(', ')}.` };
}
