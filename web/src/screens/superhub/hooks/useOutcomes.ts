import { useCallback, useState } from 'react';

/**
 * What happened to each item in a review queue (sent, skipped, snoozed, approved…), kept in local state.
 * Shared by every approval list on this page (Engage-Queue, Inbox-NeedsReply, Influencer-Queue, Leads, Analytics).
 */
export function useOutcomes<T extends string = string>() {
  const [outcomes, setOutcomes] = useState<Record<string, T>>({});
  const set = useCallback((id: string, outcome: T) => setOutcomes((o) => ({ ...o, [id]: outcome })), []);
  const clear = useCallback((id: string) => setOutcomes((o) => {
    const next = { ...o };
    delete next[id];
    return next;
  }), []);
  return { outcomes, outcomeOf: (id: string): T | undefined => outcomes[id], set, clear };
}
