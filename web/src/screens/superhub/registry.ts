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
import { ContentDashboard } from './ContentDashboard';
import { contentDashboard, contentDashboardEmpty } from './ContentDashboard.fixtures';
import { DraftReview } from './DraftReview';
import { draftBeautified, draftPolishError, draftReview } from './DraftReview.fixtures';
import { CampaignGoal } from './CampaignGoal';
import { CampaignMeasure } from './CampaignMeasure';
import { campaign } from './Campaign.fixtures';
import { EngageQueue } from './EngageQueue';
import { EngageRules } from './EngageRules';
import { Partners } from './Partners';
import { Leads } from './Leads';
import { InfluencerSetup } from './InfluencerSetup';
import { InfluencerQueue } from './InfluencerQueue';
import { engageQueue, engageRules, influencerQueue, influencerSetup, leads, partners } from './Grow.fixtures';
import { Analytics } from './Analytics';
import { analytics } from './Analytics.fixtures';

// Canvas page "Superhub (v2)" (issue #52). Tags and states are the canvas board titles and notes (canvas.json).
// Variants (…-Empty, Draft-Review-Beautified, Draft-Review-PolishError) are the same screen with other fixtures.
export const screens: ScreenEntry[] = [
  { artboard: 'Hub-Home', page: 'licensee', title: 'Hub home', tag: 'HACKATHON', states: ['success'], render: () => createElement(HubHome, { data: hubHome }) },
  { artboard: 'Inbox-All', page: 'utilities', title: 'Inbox: all inboxes', tag: 'STRETCH', states: ['success'], render: () => createElement(InboxAll, { data: inboxAll }) },
  { artboard: 'Inbox-NeedsReply', page: 'utilities', title: 'Inbox: needs reply', tag: 'STRETCH', states: ['success'], render: () => createElement(InboxNeedsReply, { data: needsReply }) },
  {
    artboard: 'Inbox-Connect',
    page: 'utilities',
    title: 'Inbox: connect sources (empty + error)',
    tag: 'STRETCH',
    states: ['error', 'empty'],
    render: (state) => createElement(InboxConnect, { key: state, data: state === 'empty' ? inboxConnectEmpty : inboxConnect }),
  },
  {
    artboard: 'Brand-Build',
    page: 'brand',
    title: 'Brand kit: 6 sections built, 11 coming soon',
    tag: 'HACKATHON (THIN)',
    states: ['success', 'empty', 'loading', 'error'],
    render: (state) => createElement(BrandBuild, { key: state, data: state === 'empty' ? brandBuildEmpty : brandBuild, state }),
  },
  {
    artboard: 'Voice-Templates',
    page: 'brand',
    title: 'Voices: 12 templates, 8 dimensions + claims gate',
    tag: 'HACKATHON',
    states: ['success', 'empty', 'loading', 'error'],
    render: (state) => createElement(VoiceTemplates, { data: state === 'empty' ? voiceTemplatesEmpty : voiceTemplates, state }),
  },
  {
    artboard: 'Voice-Editor',
    page: 'brand',
    title: 'Voice editor: template, 8 dials, claims level, one sample built; overrides roadmap',
    tag: 'HACKATHON (THIN)',
    states: ['success', 'loading', 'error'],
    render: (state) => createElement(VoiceEditor, { data: voiceEditor, state }),
  },
  {
    artboard: 'Content-Dashboard',
    page: 'create',
    title: 'Content dashboard',
    tag: 'HACKATHON',
    states: ['success', 'empty'],
    render: (state) => createElement(ContentDashboard, { key: state, data: state === 'empty' ? contentDashboardEmpty : contentDashboard, state }),
  },
  { artboard: 'Content-Dashboard-Empty', page: 'create', title: 'Content: empty', tag: 'HACKATHON', states: ['empty'], render: (state) => createElement(ContentDashboard, { data: contentDashboardEmpty, state }) },
  {
    artboard: 'Draft-Review',
    page: 'create',
    title: 'Review a draft: polish and slop built; scores self-graded today',
    tag: 'HACKATHON',
    states: ['success', 'loading', 'error', 'empty'],
    render: (state) => createElement(DraftReview, { key: state, data: state === 'error' ? draftPolishError : draftReview, state, boardDraftId: 'd1' }),
  },
  { artboard: 'Draft-Review-Beautified', page: 'create', title: 'Draft after Beautify (success, undo)', tag: 'HACKATHON', states: ['success'], render: () => createElement(DraftReview, { data: draftBeautified, boardDraftId: 'd1' }) },
  { artboard: 'Draft-Review-PolishError', page: 'create', title: 'Polish action failed (error)', tag: 'HACKATHON', states: ['error'], render: (state) => createElement(DraftReview, { data: draftPolishError, state, boardDraftId: 'd1' }) },
  { artboard: 'Campaign-v2-1-Goal', page: 'grow', title: 'Campaign v2: goal + platforms', tag: 'HACKATHON', states: ['success'], render: () => createElement(CampaignGoal, { data: campaign }) },
  { artboard: 'Campaign-v2-2-Measure', page: 'grow', title: 'Campaign v2: success metrics', tag: 'HACKATHON', states: ['success'], render: () => createElement(CampaignMeasure, { data: campaign }) },
  { artboard: 'Engage-Queue', page: 'grow', title: 'Engagement: reply queue', tag: 'STRETCH', states: ['success'], render: () => createElement(EngageQueue, { data: engageQueue }) },
  { artboard: 'Engage-Rules', page: 'grow', title: 'Engagement: rules, lists, opt-in auto-replies', tag: 'ROADMAP', states: ['success'], render: () => createElement(EngageRules, { data: engageRules }) },
  { artboard: 'Partners', page: 'grow', title: 'Partner access', tag: 'ROADMAP', states: ['success'], render: () => createElement(Partners, { data: partners }) },
  { artboard: 'Leads', page: 'grow', title: 'Lead finder', tag: 'EXPERIMENTAL', states: ['success'], render: () => createElement(Leads, { data: leads }) },
  { artboard: 'Influencer-Setup', page: 'grow', title: 'AI influencer: setup', tag: 'EXPERIMENTAL', states: ['success'], render: () => createElement(InfluencerSetup, { data: influencerSetup }) },
  { artboard: 'Influencer-Queue', page: 'grow', title: 'AI influencer: approval queue', tag: 'EXPERIMENTAL', states: ['success'], render: () => createElement(InfluencerQueue, { data: influencerQueue }) },
  {
    artboard: 'Analytics',
    page: 'learn',
    title: 'Analytics',
    tag: 'ROADMAP',
    states: ['success', 'empty', 'loading', 'error'],
    render: (state) => createElement(Analytics, { key: state, data: analytics, state }),
  },
  {
    artboard: 'Analytics-Empty',
    page: 'learn',
    title: 'Analytics: connect, collecting, error',
    tag: 'ROADMAP',
    states: ['empty', 'loading', 'error'],
    render: (state) => createElement(Analytics, { key: state, data: analytics, state }),
  },
];
