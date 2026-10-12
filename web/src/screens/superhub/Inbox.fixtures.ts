// Sample data for the Inbox screens (issue #52). Source: wireframe canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
// boards Inbox-All, Inbox-NeedsReply and Inbox-Connect, notes n-inb1–n-inb3 (text as drawn; brackets kept).
// Backend map row "Inbox-All, Inbox-NeedsReply, Inbox-Connect (coming soon)" (.agentic/what/context/backend_map.md §4).
// Only the first thread is drawn in full; the others show their one drawn message and a bracketed drafted reply.
import type { InboxConnectData, InboxData, NeedsReplyData } from './types';

const folders: InboxData['folders'] = [
  { id: 'all', label: 'All inboxes', count: 37, href: 'inboxAll' },
  { id: 'needs', label: 'Needs reply', count: 6, href: 'inboxNeedsReply' },
];

const draftedReply = '[Drafted reply in the right voice]';

export const inboxAll: InboxData = {
  folders,
  sources: [
    { id: 'tg', label: 'Telegram', count: 12 },
    { id: 'wa', label: 'WhatsApp Business', count: 5 },
    { id: 'x', label: 'X DMs', count: 4 },
    { id: 'li', label: 'LinkedIn', count: 6 },
    { id: 'dc', label: 'Discord', count: 7 },
    { id: 'ig', label: 'Instagram', count: 2 },
    { id: 'fc', label: 'Farcaster', count: 1 },
  ],
  labels: [
    { id: 'partners', label: 'Partners', count: 4 },
    { id: 'leads', label: 'Leads', count: 3 },
    { id: 'ambassadors', label: 'Ambassadors', count: 5 },
    { id: 'press', label: 'Press', count: 1 },
  ],
  assignees: ['[Teammate 1]', '[Teammate 2]'],
  messages: [
    {
      id: 't1', source: 'tg', sourceLabel: 'Telegram', from: '[Name] · [partner]', time: '09:41', unread: true, labels: ['partners'],
      preview: 'Still up for the co-marketing post next week? We need a date by Thursday',
      thread: [
        { id: 'a', from: 'me', text: "Love the integration. Let's do a joint post once it's live." },
        { id: 'b', from: 'them', text: "It's live! Still up for the co-marketing post next week? We need a date by Thursday" },
      ],
      replyNote: 'Suggested reply · Founder voice · Slop check ✓',
      reply: "Yes, let's do it. How about Wednesday 15 Oct? I'll send a draft on Monday for you to check.",
      linked: 'Linked: partner [partner] · 2 earlier threads on LinkedIn',
    },
    { id: 't2', source: 'li', sourceLabel: 'LinkedIn', from: '[Name], [role]', time: '09:12', unread: true, labels: ['leads'], preview: 'Saw the aDNA launch. Could we talk about [company] adopting it?', thread: [{ id: 'a', from: 'them', text: 'Saw the aDNA launch. Could we talk about [company] adopting it?' }], replyNote: 'Suggested reply · [voice]', reply: draftedReply },
    { id: 't3', source: 'wa', sourceLabel: 'WhatsApp', from: '[Customer]', time: '08:55', unread: true, labels: [], preview: 'Hi, is there an enterprise version?', thread: [{ id: 'a', from: 'them', text: 'Hi, is there an enterprise version?' }], replyNote: 'Suggested reply · [voice]', reply: draftedReply },
    { id: 't4', source: 'dc', sourceLabel: 'Discord', from: 'Mai T. (ambassador)', time: '08:30', unread: false, labels: ['ambassadors'], preview: 'When does the LinkedIn payout land?', thread: [{ id: 'a', from: 'them', text: 'When does the LinkedIn payout land?' }], replyNote: 'Suggested reply · [voice]', reply: draftedReply },
    { id: 't5', source: 'x', sourceLabel: 'X DM', from: '@[journalist]', time: 'Mon', unread: false, labels: ['press'], preview: 'Writing a piece on agent memory. Got 10 minutes this week?', thread: [{ id: 'a', from: 'them', text: 'Writing a piece on agent memory. Got 10 minutes this week?' }], replyNote: 'Suggested reply · [voice]', reply: draftedReply },
    { id: 't6', source: 'tg', sourceLabel: 'Telegram', from: '[Group] · 3 new', time: 'Mon', unread: false, labels: [], preview: 'gm, anyone tried aDNA with [agent tool]?', thread: [{ id: 'a', from: 'them', text: 'gm, anyone tried aDNA with [agent tool]?' }], replyNote: 'Suggested reply · [voice]', reply: draftedReply },
    { id: 't7', source: 'ig', sourceLabel: 'Instagram', from: '@[user]', time: 'Sun', unread: false, labels: [], preview: 'love the carousel', thread: [{ id: 'a', from: 'them', text: 'love the carousel' }], replyNote: 'Suggested reply · [voice]', reply: draftedReply },
  ],
};

export const needsReply: NeedsReplyData = {
  folders,
  targets: [
    { label: 'Partners, leads', value: '4 h' },
    { label: 'Ambassadors', value: '24 h' },
    { label: 'Everyone else', value: '48 h' },
  ],
  items: [
    { id: 'r1', group: 'Overdue', due: 'Overdue 5 h', overdue: true, source: 'LinkedIn', from: '[Name], [role]', label: 'Leads', quote: 'Saw the aDNA launch. Could we talk about [company] adopting it?', why: 'Why flagged: direct question from a likely lead, unanswered 9 h (target 4 h)', canSnooze: true, canDismiss: true },
    { id: 'r2', group: 'Overdue', due: 'Overdue 1 h', overdue: true, source: 'X DM', from: '@[journalist]', label: 'Press', quote: 'Writing a piece on agent memory. Got 10 minutes this week?', why: 'Why flagged: meeting request with a deadline ("this week")', canSnooze: true, canDismiss: true },
    { id: 'r3', group: 'Due today', due: 'Due 13:41', overdue: false, source: 'Telegram', from: '[Name] · [partner]', label: 'Partners', quote: 'Still up for the co-marketing post next week? We need a date by Thursday', why: 'Why flagged: partner asked for a date; deadline Thursday', canSnooze: true, canDismiss: false },
    { id: 'r4', group: 'Due today', due: 'Due 12:55', overdue: false, source: 'WhatsApp', from: '[Customer]', quote: 'Hi, is there an enterprise version?', why: 'Why flagged: buying question', canSnooze: true, canDismiss: false },
    { id: 'r5', group: 'Due today', due: 'Due tomorrow', overdue: false, source: 'Discord', from: 'Mai T.', label: 'Ambassadors', quote: 'When does the LinkedIn payout land?', why: 'Why flagged: payout question · answer found: paid 17:05 yesterday, receipt attached to draft', canSnooze: false, canDismiss: false },
  ],
  footnote: '"No reply needed" teaches the flagger. Group chatter and reactions are never flagged.',
};

export const inboxConnect: InboxConnectData = {
  error: { message: 'Discord stopped syncing 40 min ago (permission removed in [server]).', source: 'dc' },
  sources: [
    { id: 'tg', name: 'Telegram', status: 'connected-bot', sees: "Messages to your brand bot and groups it's in. Your personal DMs: [needs a signed-in Telegram client, to be confirmed]" },
    { id: 'wa', name: 'WhatsApp Business', status: 'connected', sees: "One-to-one chats on your business number, plus up to 6 months of history. Not group chats. Personal WhatsApp accounts can't connect." },
    { id: 'x', name: 'X', status: 'connected', sees: '[DM access to be confirmed against the X API]' },
    { id: 'li', name: 'LinkedIn', status: 'connected', sees: '[Messaging access to be confirmed; may be limited to company page]' },
    { id: 'dc', name: 'Discord', status: 'sync-error', sees: 'Channels and DMs the JamJam bot is allowed into' },
    { id: 'ig', name: 'Instagram', status: 'not-connected', sees: '[DM access for business accounts, to be confirmed]' },
    { id: 'fc', name: 'Farcaster', status: 'not-connected', sees: '[To be confirmed]' },
    { id: 'em', name: 'Email', status: 'not-connected', sees: 'Optional: forward a shared inbox' },
  ],
};

/** Empty state: nothing connected yet (n-inb3: each source still states what it can see). */
export const inboxConnectEmpty: InboxConnectData = {
  sources: inboxConnect.sources.map((s) => ({ ...s, status: 'not-connected' })),
};
