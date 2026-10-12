// The Distribute-Adapt gates (canvas v21 Distribute-Adapt notes), each one { blocking, label } (lib/approval.ts Gate).
// The badges and the Approve buttons read originalCheck and versionCheck, Schedule reads scheduleGate, and approvals
// are only made through lib/approval.ts approveThrough on those gates: a blocked badge never sits beside an enabled
// button, and nothing is approved while its checks block or are re-running (Codex review on PR 102).
import type { Gate } from '../../lib/approval';
import { postLength, type Platform } from '../../config/platforms';

const pass = (label: string): Gate => ({ blocking: false, label });
const block = (label: string): Gate => ({ blocking: true, label });

/** What the sample checks found in one text (the no-AI-slop pass and the claims gate). */
export interface CheckRun {
  /** Claims with no source. */
  unsourced: number;
  /** Phrases the no-AI-slop pass flags. */
  slop: number;
}

/** A text's check result, or pending while the checks re-read an edit. */
export type CheckResult = CheckRun | 'pending';

/** The sample checks: the seed's unsourced claims and the slop phrases still in the text. INTEGRATION: POST /api/checks. */
export function runChecks(text: string, unsourcedClaims: string[], slopPhrases: string[]): CheckRun {
  return { unsourced: unsourcedClaims.filter((p) => text.includes(p)).length, slop: slopPhrases.filter((p) => text.toLowerCase().includes(p.toLowerCase())).length };
}

/** The content checks every text shares: not empty, re-checked after an edit, no slop, every claim sourced. */
function contentCheck(what: string, text: string, checks: CheckResult): Gate | null {
  if (!text.trim()) return block(`the ${what} is empty`);
  if (checks === 'pending') return block('re-checking slop and claims');
  if (checks.slop > 0) return block('failed the no-AI-slop pass');
  if (checks.unsourced > 0) return block(`${checks.unsourced} ${checks.unsourced === 1 ? 'claim has' : 'claims have'} no source`);
  return null;
}

/** The original's gate: an edited original is pending until its slop and claims checks re-run on the new text. */
export function originalCheck(text: string, checks: CheckResult): Gate {
  return contentCheck('original', text, checks) ?? pass('Checks passed');
}

/**
 * One version's gate: the original must pass first (a version can't be approved over an original that is blocked or
 * re-checking), then not empty, within the platform's sourced limit, and its own checks, re-run after any edit.
 */
export function versionCheck(platform: Platform, text: string, checks: CheckResult, original: Gate): Gate {
  if (original.blocking) return block(`the original: ${original.label}`);
  if (text.trim() && platform.charLimit) {
    const over = postLength(platform, text) - platform.charLimit.value;
    if (over > 0) return block(`${over} over ${platform.name}’s ${platform.charLimit.value} limit`);
  }
  return contentCheck('version', text, checks) ?? pass('Checks passed');
}

export interface ScheduleInput {
  name: string;
  check: Gate;
  approved: boolean;
  /** What already holds the chosen slot, if anything. */
  conflict: string | null;
  slot: string;
}

/** Schedule: something chosen, the original passing and approved, every version passing, approved and free of conflicts. */
export function scheduleGate(original: Gate, originalApproved: boolean, chosen: ScheduleInput[]): Gate {
  if (chosen.length === 0) return block('Choose at least one platform.');
  if (original.blocking) return block(`The original: ${original.label}.`);
  if (!originalApproved) return block('The original’s approval is stale. Approve it again first.');
  const failing = chosen.find((v) => v.check.blocking);
  if (failing) return block(`Fix the ${failing.name} version first.`);
  const waiting = chosen.filter((v) => !v.approved).map((v) => v.name);
  if (waiting.length) return block(`Approve ${waiting.join(', ')} first.`);
  const clash = chosen.find((v) => v.conflict);
  if (clash) return block(`${clash.name}: ${clash.slot} is taken by ${clash.conflict}. Pick another time.`);
  return pass(`${chosen.length} ${chosen.length === 1 ? 'version' : 'versions'} ready.`);
}
