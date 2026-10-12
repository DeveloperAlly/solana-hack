import { createElement } from 'react';
import type { ScreenEntry } from '../registry-types';
import { HubHome } from './HubHome';
import { hubHome } from './HubHome.fixtures';
import { InboxAll } from './InboxAll';
import { InboxNeedsReply } from './InboxNeedsReply';
import { InboxConnect } from './InboxConnect';
import { inboxAll, inboxConnect, inboxConnectEmpty, needsReply } from './Inbox.fixtures';

// Canvas page "Superhub (v2)" (issue #52). Tags and states are the canvas board titles and notes (canvas.json).
// Variants (…-Empty, Draft-Review-Beautified, Draft-Review-PolishError) are the same screen with other fixtures.
export const screens: ScreenEntry[] = [
  { artboard: 'Hub-Home', page: 'hub', title: 'Hub home', tag: 'HACKATHON', states: ['success'], render: () => createElement(HubHome, { data: hubHome }) },
  { artboard: 'Inbox-All', page: 'hub', title: 'Inbox: all inboxes', tag: 'STRETCH', states: ['success'], render: () => createElement(InboxAll, { data: inboxAll }) },
  { artboard: 'Inbox-NeedsReply', page: 'hub', title: 'Inbox: needs reply', tag: 'STRETCH', states: ['success'], render: () => createElement(InboxNeedsReply, { data: needsReply }) },
  {
    artboard: 'Inbox-Connect',
    page: 'hub',
    title: 'Inbox: connect sources (empty + error)',
    tag: 'STRETCH',
    states: ['error', 'empty'],
    render: (state) => createElement(InboxConnect, { key: state, data: state === 'empty' ? inboxConnectEmpty : inboxConnect }),
  },
];
