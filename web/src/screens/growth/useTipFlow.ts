import { useState } from 'react';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { uniqueId } from '../../lib/id';
import { firstBlocking, tipAmountCheck, walletCheck } from './checks';
import { growthSession, nowIso } from './session';
import { splitTip } from './format';
import { useVisitedPost } from './useBadge';
import type { ApprovedPost, Check, TipSheetData } from './types';

/** amount -> review -> (sending) -> sent | failed. Each step is reachable only from the one before it. */
export type TipStep = 'amount' | 'review' | 'sending' | 'sent' | 'failed';

// The gallery's demo state (C28) picks where the flow starts; "empty" is the no-wallet data, at the amount step.
const startStep: Record<ScreenState, TipStep> = { success: 'amount', empty: 'amount', loading: 'sending', error: 'failed' };

export interface TipFlow {
  post: ApprovedPost;
  open: boolean;
  setOpen: (open: boolean) => void;
  step: TipStep;
  raw: string;
  setRaw: (raw: string) => void;
  /** Valid amount in USDC, or null. */
  amount: number | null;
  split: { fee: number; net: number } | null;
  /** The one gate for Review and Confirm: the wallet check, then the amount check. */
  check: Check;
  review: () => void;
  back: () => void;
  confirm: () => void;
  retry: () => void;
}

/** Tip-Sheet flow state: the sheet, the amount, the fee split and the step machine; a sent tip joins Tips-Received. */
export function useTipFlow(data: TipSheetData, state: ScreenState): TipFlow {
  const visited = useVisitedPost(data.posts, data.defaultPostId);
  const post = visited.post ?? data.posts[0];
  const [session, set] = growthSession.use();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<TipStep>(startStep[state]);
  const [raw, setRaw] = useState('');
  const check = firstBlocking([walletCheck(data.creator.wallet), tipAmountCheck(raw)], 'Ready to review.');
  const amount = check.blocking ? null : Number(raw.trim());
  function confirm() {
    if (step !== 'review' || amount === null) return;
    // INTEGRATION: the fan's wallet signs a USDC transfer to data.creator.wallet plus the 3% fee (not built yet;
    // backend map has no tips row). JamJam never holds the money (ADR-006).
    set({ tipsSent: [{ id: uniqueId('tip'), postId: post.id, postLabel: post.label, from: '[your wallet]', amount, at: nowIso(), signature: null }, ...session.tipsSent] });
    setStep('sent');
  }
  return {
    post,
    open,
    setOpen,
    step,
    raw,
    setRaw,
    amount,
    split: amount === null ? null : splitTip(amount, data.feeRate),
    check,
    review: () => !check.blocking && step === 'amount' && setStep('review'),
    back: () => step === 'review' && setStep('amount'),
    confirm,
    retry: () => step === 'failed' && setStep(check.blocking ? 'amount' : 'review'),
  };
}
