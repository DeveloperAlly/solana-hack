import { useMemo } from 'react';
import { growthSession } from './session';
import { splitTip } from './format';
import type { Tip, TipsReceivedData } from './types';

export interface TipRow extends Tip {
  fee: number | null;
  net: number | null;
}

export interface TipsReceivedFlow {
  rows: TipRow[];
  /** One filter option per post that has a tip. */
  posts: { id: string; label: string }[];
  /** Sums; null while any amount is still a bracketed placeholder. */
  totals: { count: number; received: number | null; fees: number | null };
}

const sum = (xs: (number | null)[]): number | null => (xs.some((x) => x === null) ? null : Math.round(xs.reduce<number>((a, x) => a + (x ?? 0), 0) * 100) / 100);

/** Tips-Received flow state: tips sent on Tip-Sheet first, then the fixture tips, with the fee split and totals. */
export function useTipsReceived(data: TipsReceivedData): TipsReceivedFlow {
  const [session] = growthSession.use();
  return useMemo(() => {
    const rows: TipRow[] = [...session.tipsSent, ...data.tips].map((t) => {
      const split = t.amount === null ? null : splitTip(t.amount, data.feeRate);
      return { ...t, fee: split?.fee ?? null, net: split?.net ?? null };
    });
    const posts = [...new Map(rows.map((r) => [r.postId, { id: r.postId, label: r.postLabel }])).values()];
    return { rows, posts, totals: { count: rows.length, received: sum(rows.map((r) => r.net)), fees: sum(rows.map((r) => r.fee)) } };
  }, [session.tipsSent, data.tips, data.feeRate]);
}
