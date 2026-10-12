import { useState } from 'react';
import { uniqueId } from '../../../lib/id';
import type { ReplyOutcome } from '../parts/ReplyCard';
import type { EngageQueueData, ReplyItem } from '../types';
import { useHubSession } from './useHubSession';
import { useReviewQueue } from './useReviewQueue';

/**
 * Engage-Queue state: the reply queue is state seeded from the fixture, so Draft a reply on a Worth-engaging post adds
 * a real, editable item (Codex review on PR #81). Items routed by a rule switched off on Engage-Rules leave the queue;
 * an item you drafted yourself has no rule and stays.
 */
export function useEngageQueue(data: EngageQueueData) {
  const queue = useReviewQueue<ReplyOutcome>();
  const [items, setItems] = useState<ReplyItem[]>(data.queue);
  const [draftedFrom, setDraftedFrom] = useState<string[]>([]);
  const [session] = useHubSession();

  // INTEGRATION: POST a reply draft for this public post (DraftWorkflow); it joins the reply queue for approval.
  function draftReply(suggestionId: string) {
    const s = data.suggestions.find((x) => x.id === suggestionId);
    if (!s || draftedFrom.includes(s.id)) return;
    const item: ReplyItem = { id: uniqueId('reply'), channel: s.channel, author: s.who, ago: 'just now', incoming: s.what, note: 'Drafted reply · Replies voice · you chose this post', draft: s.draft };
    setItems((prev) => [item, ...prev]);
    setDraftedFrom((prev) => [...prev, s.id]);
  }

  const routed = items.filter((q) => !q.rule || !session.rulesOff.includes(q.rule));
  return {
    queue,
    hidden: items.length - routed.length,
    waiting: routed.filter((q) => !queue.outcomeOf(q.id)),
    sent: routed.filter((q) => queue.outcomeOf(q.id) === 'sent'),
    skipped: routed.filter((q) => queue.outcomeOf(q.id) === 'skipped'),
    worth: { suggestions: data.suggestions, note: data.suggestionsNote, isDrafted: (id: string) => draftedFrom.includes(id), onDraft: draftReply },
  };
}
