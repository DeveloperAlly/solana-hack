import { createElement } from 'react';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import type { ScreenEntry } from '../registry-types';
import { AmbCampaigns } from './AmbCampaigns';
import { AmbDetail } from './AmbDetail';
import { AmbGenerate } from './AmbGenerate';
import { AmbPublish } from './AmbPublish';
import { AmbStatus } from './AmbStatus';
import { campaignDetail, campaignsData, campaignsEmpty, generateData, publishData, statusBudget, statusFailed, statusPaid, statusVerifying } from './fixtures';
import { ambArtboards as a } from './routes';
import type { PostStatusData } from './types';

// Canvas page "Ambassador" (issue #53). Every board is tagged "STRETCH (H8, ADR-008)" on the canvas
// (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn); titles are the board titles without the tag. Five screen components
// render all 14 boards: desktop and mobile, and each status outcome, are the same component with different data.
const page = 'ambassador' as const;
const tag = 'STRETCH' as const;

/** M-5 shows the paid post; its loading and error states reuse the verifying and failed outcomes. */
const mobileStatus: Record<ScreenState, PostStatusData> = { success: statusPaid, loading: statusVerifying, error: statusFailed, empty: statusPaid };

export const screens: ScreenEntry[] = [
  { artboard: a.campaigns, page, tag, title: '5a Campaign list', states: ['success', 'empty'], render: (state) => createElement(AmbCampaigns, { data: state === 'empty' ? campaignsEmpty : campaignsData, device: 'desktop', state }) },
  { artboard: a.campaignsEmpty, page, tag, title: '5a Empty: no campaigns', states: ['empty'], render: (state) => createElement(AmbCampaigns, { data: campaignsEmpty, device: 'desktop', state }) },
  { artboard: a.detail, page, tag, title: '5b Campaign detail', states: ['success'], render: (state) => createElement(AmbDetail, { data: campaignDetail, device: 'desktop', state }) },
  { artboard: a.generate, page, tag, title: '5c Generate + edit', states: ['success', 'loading'], render: (state) => createElement(AmbGenerate, { data: generateData, device: 'desktop', state }) },
  { artboard: a.publish, page, tag, title: '5d Publish', states: ['success'], render: (state) => createElement(AmbPublish, { data: publishData, device: 'desktop', state }) },
  { artboard: a.verifying, page, tag, title: '5e Loading: verifying', states: ['loading'], render: (state) => createElement(AmbStatus, { data: statusVerifying, device: 'desktop', state }) },
  { artboard: a.paid, page, tag, title: '5e Success: paid', states: ['success'], render: (state) => createElement(AmbStatus, { data: statusPaid, device: 'desktop', state }) },
  { artboard: a.failed, page, tag, title: '5e Error: verification failed', states: ['error'], render: (state) => createElement(AmbStatus, { data: statusFailed, device: 'desktop', state }) },
  { artboard: a.budget, page, tag, title: '5e Error: budget exhausted', states: ['error'], render: (state) => createElement(AmbStatus, { data: statusBudget, device: 'desktop', state }) },
  { artboard: a.mCampaigns, page, tag, title: 'Mobile 5a List', states: ['success'], render: (state) => createElement(AmbCampaigns, { data: campaignsData, device: 'mobile', state }) },
  { artboard: a.mDetail, page, tag, title: 'Mobile 5b Detail', states: ['success'], render: (state) => createElement(AmbDetail, { data: campaignDetail, device: 'mobile', state }) },
  { artboard: a.mGenerate, page, tag, title: 'Mobile 5c Generate + edit', states: ['success', 'loading'], render: (state) => createElement(AmbGenerate, { data: generateData, device: 'mobile', state }) },
  { artboard: a.mPublish, page, tag, title: 'Mobile 5d Publish', states: ['success'], render: (state) => createElement(AmbPublish, { data: publishData, device: 'mobile', state }) },
  { artboard: a.mStatus, page, tag, title: 'Mobile 5e Paid', states: ['success', 'loading', 'error'], render: (state) => createElement(AmbStatus, { data: mobileStatus[state], device: 'mobile', state }) },
];
