// Sample data for Hub-Home (issue #52). Source: wireframe canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
// board Hub-Home (text as drawn; brackets kept). Backend map row "Content-Dashboard (and its empty state), Hub-Home"
// (.agentic/what/context/backend_map.md §4 Create). Numbers are the canvas's sample figures, not real data.
import type { HubHomeData } from './types';

export const hubHome: HubHomeData = {
  weekday: 'Tuesday',
  status: 'adna.network verified ✓ · 4 voices · Plan: [plan name] · 3 seats',
  reviewCount: 12,
  kpis: [
    { label: 'Drafts awaiting you', value: '6', sub: 'all passed slop check', href: 'content' },
    { label: 'Replies drafted', value: '4', sub: 'X 2 · LinkedIn 1 · Discord 1', href: 'engageQueue' },
    { label: 'Ambassador posts to approve', value: '2', sub: '60 USDC on approval', href: 'ambassadors' },
    { label: 'Scheduled today', value: '2', sub: '09:00 X · 12:30 LinkedIn', href: 'content' },
  ],
  needs: [
    { id: 'n1', chip: 'Inbox · 2 overdue', text: 'A likely lead on LinkedIn and a journalist on X are waiting on you · replies drafted', href: 'inboxNeedsReply' },
    { id: 'n2', chip: 'X post', text: '"Your agent didn\'t forget. It was never told. Here\'s the fix." · Founder voice · launch week', draftId: 'd1' },
    { id: 'n3', chip: 'Reply · X', text: '@[handle] asked whether aDNA works with [agent tool] · reply drafted in Replies voice', href: 'engageQueue' },
    { id: 'n4', chip: 'LinkedIn · ambassador', text: "Mai T.'s post is verified and waiting · 10 USDC on approval", href: 'ambassadors' },
    { id: 'n5', chip: 'Blog', text: '"Why agents need shared project context" · Technical voice · 1,100 words', draftId: 'd2' },
  ],
  campaign: { name: 'aDNA launch week', goal: 'Goal: 40 verified posts · 15 so far', done: 15, target: 40, caption: '6 days left · 305 of 500 USDC left' },
  brandPack: { title: 'Brand pack 80% complete', missing: 'Missing: proof points, tone for replies' },
  week: { best: 'X thread "Why agents forget" · 3.1% engagement', weakest: 'LinkedIn image post · 0.4%' },
};
