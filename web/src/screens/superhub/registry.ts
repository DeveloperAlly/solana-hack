import { createElement } from 'react';
import type { ScreenEntry } from '../registry-types';
import { HubHome } from './HubHome';
import { hubHome } from './HubHome.fixtures';
import { InboxAll } from './InboxAll';
import { InboxNeedsReply } from './InboxNeedsReply';
import { InboxConnect } from './InboxConnect';
import { inboxAll, inboxConnect, inboxConnectEmpty, needsReply } from './Inbox.fixtures';
import { BrandBuild } from './BrandBuild';
import { brandBuild, brandBuildEmpty } from './BrandBuild.fixtures';
import { VoiceTemplates } from './VoiceTemplates';
import { VoiceEditor } from './VoiceEditor';
import { voiceEditor, voiceTemplates, voiceTemplatesEmpty } from './Voices.fixtures';

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
  {
    artboard: 'Brand-Build',
    page: 'hub',
    title: 'Brand kit: 6 sections built, 11 coming soon',
    tag: 'HACKATHON (THIN)',
    states: ['success', 'empty', 'loading', 'error'],
    render: (state) => createElement(BrandBuild, { key: state, data: state === 'empty' ? brandBuildEmpty : brandBuild, state }),
  },
  {
    artboard: 'Voice-Templates',
    page: 'hub',
    title: 'Voices: 12 templates, 8 dimensions + claims gate',
    tag: 'HACKATHON',
    states: ['success', 'empty', 'loading', 'error'],
    render: (state) => createElement(VoiceTemplates, { data: state === 'empty' ? voiceTemplatesEmpty : voiceTemplates, state }),
  },
  {
    artboard: 'Voice-Editor',
    page: 'hub',
    title: 'Voice editor: template, 8 dials, claims level, one sample built; overrides roadmap',
    tag: 'HACKATHON (THIN)',
    states: ['success', 'loading', 'error'],
    render: (state) => createElement(VoiceEditor, { data: voiceEditor, state }),
  },
];
