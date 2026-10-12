// Publishing schedule state (issue #51). Scheduling is session state as { slotId -> postId }; the calendar, the
// picker's available posts and the failed-publish alert all derive from it, so one post can sit in one slot only
// (Codex review on PR #79). INTEGRATION: PATCH /api/drafts/:id { scheduled_at } and POST /api/drafts/:id/publish.
import { useSoonSession } from './useSoonSession';
import type { CalendarSlot, PublishCalendarData } from './types';

export function useSchedule(data: PublishCalendarData) {
  const [session, set] = useSoonSession();
  const scheduled = session.schedule ?? {};
  const retried = session.retried ?? [];
  const postTitle = (id: string) => data.approvedPosts.find((p) => p.id === id)?.title;

  const slots = data.slots.map((s): CalendarSlot => {
    const post = scheduled[s.id];
    if (post) return { ...s, status: 'scheduled', time: '[time]', channel: 'LinkedIn', title: postTitle(post) };
    if (retried.includes(s.id)) return { ...s, status: 'scheduled' };
    return s;
  });
  const taken = new Set(Object.values(scheduled));
  const failedSlot = slots.find((s) => s.id === data.failed?.slotId);
  const failed = failedSlot?.status === 'failed' ? data.failed : null;

  return {
    slots,
    /** Approved posts not yet in any slot: the only ones the picker offers. */
    available: data.approvedPosts.filter((p) => !taken.has(p.id)),
    /** Slots filled in this session, with their post, so they can be unscheduled. */
    filled: Object.entries(scheduled).map(([slotId, postId]) => ({ slotId, title: postTitle(postId) ?? postId, day: data.slots.find((s) => s.id === slotId)?.day })),
    failed,
    /** The failed post's channel was reconnected on Settings-Connections, so it can be retried here. */
    reconnected: failed ? session.connections?.[failed.channel.toLowerCase()] === 'connected' : false,
    schedule: (slotId: string, postId: string) => set({ schedule: { ...scheduled, [slotId]: postId } }),
    unschedule: (slotId: string) => set({ schedule: Object.fromEntries(Object.entries(scheduled).filter(([k]) => k !== slotId)) }),
    retry: () => failed && set({ retried: [...retried, failed.slotId] }),
  };
}
