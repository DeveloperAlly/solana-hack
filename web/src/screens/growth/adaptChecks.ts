// The Distribute-Adapt gates (canvas v21 Distribute-Adapt notes), each one { blocking, label } (domain/approval.ts
// Gate). The version badge and its Approve button read versionCheck; Schedule reads scheduleGate. So a blocked badge
// never sits beside an enabled button.
import type { Gate } from '../../domain/approval';
import { postLength, type Platform } from '../../config/platforms';

const pass = (label: string): Gate => ({ blocking: false, label });
const block = (label: string): Gate => ({ blocking: true, label });

/** The claims gate's result for a text: how many claims have no source, or pending while it re-checks an edit. */
export type ClaimsResult = number | 'pending';

/**
 * One version's content check: not empty, within the platform's sourced limit, every claim sourced. An edited text is
 * pending, and blocking, until the claims gate has re-read it: an edit never invents a pass (Codex review on PR 102).
 */
export function versionCheck(platform: Platform, text: string, claims: ClaimsResult): Gate {
  if (!text.trim()) return block('the version is empty');
  const limit = platform.limit;
  if (limit) {
    const over = postLength(platform, text) - limit.max;
    if (over > 0) return block(`${over} over ${platform.name}’s ${limit.max} limit`);
  }
  if (claims === 'pending') return block('re-checking claims');
  if (claims > 0) return block(`${claims} ${claims === 1 ? 'claim has' : 'claims have'} no source`);
  return pass('Checks passed');
}

export interface ScheduleInput {
  name: string;
  check: Gate;
  approved: boolean;
  /** What already holds the chosen slot, if anything. */
  conflict: string | null;
  slot: string;
}

/** Schedule: something chosen, the original's approval current, every version passing, approved and free of conflicts. */
export function scheduleGate(originalApproved: boolean, chosen: ScheduleInput[]): Gate {
  if (chosen.length === 0) return block('Choose at least one platform.');
  if (!originalApproved) return block('The original changed. Approve it again first.');
  const failing = chosen.find((v) => v.check.blocking);
  if (failing) return block(`Fix the ${failing.name} version first.`);
  const waiting = chosen.filter((v) => !v.approved).map((v) => v.name);
  if (waiting.length) return block(`Approve ${waiting.join(', ')} first.`);
  const clash = chosen.find((v) => v.conflict);
  if (clash) return block(`${clash.name}: ${clash.slot} is taken by ${clash.conflict}. Pick another time.`);
  return pass(`${chosen.length} ${chosen.length === 1 ? 'version' : 'versions'} ready.`);
}
