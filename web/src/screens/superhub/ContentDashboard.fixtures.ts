// Sample data for Content-Dashboard and Content-Dashboard-Empty (issue #52). Source: wireframe canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Content-Dashboard and Content-Dashboard-Empty, notes n-cd
// and n-cde (text and sample scores as drawn). Backend map row "Content-Dashboard (and its empty state), Hub-Home"
// (.agentic/what/context/backend_map.md §4 Create).
import type { ContentDashboardData } from './types';

const base: Omit<ContentDashboardData, 'drafts' | 'tabs'> = {
  pipeline: ['Writer', 'Brand Guard', 'Slop check', 'You', 'Scheduled or posted'],
  channels: ['All', 'X', 'LinkedIn', 'Instagram', 'TikTok', 'Threads', 'Farcaster', 'Discord', 'Blog'].map((c) => ({ id: c === 'All' ? 'all' : c, label: c })),
  calendar: [
    { day: 'Tue', text: '09:00 X · 12:30 LinkedIn' },
    { day: 'Wed', text: '09:00 X', note: '(awaiting approval)' },
    { day: 'Thu', text: 'Blog · 12:30 LinkedIn' },
    { day: 'Fri', text: '08:00 X thread · 17:00 Discord' },
  ],
  calendarNote: 'Nothing posts until you approve it.',
  starts: [
    { id: 'draft', title: 'Draft one post', body: 'Pick a channel and voice, give us an angle.', action: 'New draft', href: 'draftReview' },
    { id: 'campaign', title: 'Plan a campaign', body: 'We draft a week of posts toward one goal.', action: 'Start a campaign', href: 'campaignGoal' },
    { id: 'replies', title: 'Draft replies', body: 'Connect an account and we draft replies to mentions for you to approve.', action: 'Set up replies', href: 'engageRules' },
  ],
};

export const contentDashboard: ContentDashboardData = {
  ...base,
  tabs: [
    { id: 'approval', label: 'Needs approval', count: 6, status: 'approval' },
    { id: 'scheduled', label: 'Scheduled', count: 5, status: 'scheduled' },
    { id: 'posted', label: 'Posted', status: 'posted' },
    { id: 'replies', label: 'Replies', count: 4, href: 'engageQueue' },
    { id: 'rejected', label: 'Rejected', status: 'rejected' },
  ],
  drafts: [
    { id: 'd1', channel: 'X', format: 'X post', title: '"Your agent didn\'t forget. It was never told. Here\'s the fix."', meta: 'Founder voice · aDNA launch week', onBrand: 'On-brand 92%', slop: 'Slop check ✓ · 2 fixes', slot: 'Slot: Wed 09:00', status: 'approval' },
    { id: 'd2', channel: 'Blog', format: 'Blog', title: '"Why agents need shared project context"', meta: 'Technical voice · 1,100 words', onBrand: 'On-brand 88%', slop: 'Slop check ✓ · 5 fixes', slot: 'Slot: Thu', status: 'approval' },
    { id: 'd3', channel: 'LinkedIn', format: 'LinkedIn', title: '"Three things we learned shipping an open standard in public"', meta: 'Core voice v1', onBrand: 'On-brand 90%', slop: 'Slop check ✓', slot: 'Slot: Thu 12:30', status: 'approval' },
    { id: 'd4', channel: 'Instagram', format: 'Instagram', title: 'Carousel: "5 signs your agent is missing context"', meta: 'Playful voice · image slides [to design]', onBrand: 'On-brand 81%', slop: 'Slop check ✓ · 1 fix', slot: 'No slot yet', status: 'approval' },
    { id: 'd5', channel: 'X', format: 'X thread', title: '"How aDNA files are versioned (a short thread)"', meta: 'Technical voice · 6 posts', onBrand: 'On-brand 94%', slop: 'Slop check ✓', slot: 'Slot: Fri 08:00', status: 'approval' },
    { id: 'd6', channel: 'Discord', format: 'Discord', title: 'Weekly community update', meta: 'Playful voice', onBrand: 'On-brand 86%', slop: 'Slop check ✓', slot: 'Slot: Fri 17:00', status: 'approval' },
  ],
};

/** Content-Dashboard-Empty (n-cde): nothing waiting, every count zero. */
export const contentDashboardEmpty: ContentDashboardData = {
  ...base,
  tabs: [
    { id: 'approval', label: 'Needs approval', count: 0, status: 'approval' },
    { id: 'scheduled', label: 'Scheduled', count: 0, status: 'scheduled' },
    { id: 'posted', label: 'Posted', status: 'posted' },
    { id: 'replies', label: 'Replies', count: 0, href: 'engageQueue' },
  ],
  drafts: [],
};
