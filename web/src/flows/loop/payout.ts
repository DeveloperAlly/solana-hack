// The one payout path for paid submissions (Codex review on PR 102): approve through domain/quest.ts approveSubmission,
// then record the outcome and the quest's paid slots in the shared loop store, so Today and Quests read the same state.
// INTEGRATION: POST /api/payouts (not built yet).
import type { Gate } from '../../domain/approval';
import { approveSubmission, type Quest, type SubmissionApproval } from '../../domain/quest';
import { loopStore } from './store';

export function paySubmission(itemId: string, gate: Gate, questId: string | undefined, quest: Quest | undefined, payout: { amount: number; unit: 'USDC' }): SubmissionApproval {
  const r = approveSubmission(gate, questId, quest, payout);
  if (!r.ok) return r;
  const s = loopStore.read();
  loopStore.set({ outcomes: { ...s.outcomes, [itemId]: r.outcome }, ...(questId ? { questPaid: { ...s.questPaid, [questId]: r.paid } } : {}) });
  return r;
}
