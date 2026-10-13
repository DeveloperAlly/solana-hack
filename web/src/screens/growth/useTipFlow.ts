import { useState } from 'react';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { uniqueId } from '../../lib/id';
import { firstBlocking, tipAmountCheck, walletCheck } from './checks';
import { growthSession } from './session';
import { nowIso } from '../../lib/time';
import { standaloneVisit } from './linkedBrand';
import { splitTip } from './format';
import { useVisitedPost } from './useBadge';
import type { ApprovedPost, Check, TipSheetData } from './types';

/** amount -> review -> (sending) -> sent | failed. Each step is reachable only from the one before it. */
export type TipStep = 'amount' | 'review' | 'sending' | 'sent' | 'failed';

// The gallery's demo state (C28) picks where the flow starts; "empty" is the no-wallet data, at the amount step.
const startStep: Record<ScreenState, TipStep> = { success: 'amount', empty: 'amount', loading: 'sending', error: 'failed' };

export interface TipFlow {
  /** The post being tipped; undefined when the link names a post that is not registered. */
  post: ApprovedPost | undefined;
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

/**
 * Tip-Sheet flow state: the sheet, the amount, the fee split and the step machine. A sent tip goes to the post's own
 * brand, the creator, so it joins that brand's Tips-Received whichever brand is active (Codex review on PR 111).
 */
export function useTipFlow(data: TipSheetData, state: ScreenState): TipFlow {
  const { post } = useVisitedPost(data.posts, data.defaultPostId);
  const [session, set] = growthSession.forBrand(post?.brand.id ?? standaloneVisit).use();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<TipStep>(startStep[state]);
  const [raw, setRaw] = useState('');
  /** Opening the sheet after a sent tip starts a new tip: amount step, empty amount (Codex review on PR #89). */
  function openSheet(next: boolean) {
    if (next && step === 'sent') {
      setStep('amount');
      setRaw('');
    }
    setOpen(next);
  }
  const check = firstBlocking([walletCheck(data.creator.wallet), tipAmountCheck(raw)], 'Ready to review.');
  const amount = check.blocking ? null : Number(raw.trim());
  function confirm() {
    if (step !== 'review' || amount === null || !post) return;
    // INTEGRATION: the fan's wallet signs a USDC transfer to data.creator.wallet plus the 3% fee (not built yet;
    // backend map has no tips row). JamJam never holds the money (ADR-006).
    set({ tipsSent: [{ id: uniqueId('tip'), postId: post.id, postLabel: post.label, from: '[your wallet]', amount, at: nowIso(), signature: null }, ...session.tipsSent] });
    setStep('sent');
  }
  return {
    post,
    open,
    setOpen: openSheet,
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
