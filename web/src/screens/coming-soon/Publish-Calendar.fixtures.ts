// Sample data for Publish-Calendar. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Publish-Calendar, issue #51; backend map §4 row "Publish and Registered (screens missing)" (POST /api/drafts/:id/publish).
// Approved post titles are bracketed: the canvas names none.
import type { PublishCalendarData } from './types';

export const publishCalendar: PublishCalendarData = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  slots: [
    { id: 'mon-0900', day: 'Mon', time: '09:00', channel: 'X', status: 'failed', title: '[title]' },
    { id: 'tue-1230', day: 'Tue', time: '12:30', channel: 'LinkedIn', status: 'scheduled', title: '[title]' },
    { id: 'wed-open', day: 'Wed', status: 'open' },
    { id: 'thu-0900', day: 'Thu', time: '09:00', channel: 'LinkedIn', status: 'scheduled', title: '[title]' },
    { id: 'fri-open', day: 'Fri', status: 'open' },
  ],
  failed: { slotId: 'mon-0900', title: '[title]', channel: 'X', time: '09:00', reason: 'connection expired', text: '[approved post text]' },
  approvedPosts: [
    { id: 'p1', title: '[approved post 1]' },
    { id: 'p2', title: '[approved post 2]' },
  ],
};

export const publishCalendarEmpty: PublishCalendarData = {
  ...publishCalendar,
  slots: publishCalendar.days.map((day) => ({ id: `${day}-open`, day, status: 'open' })),
  failed: null,
  approvedPosts: [],
};
