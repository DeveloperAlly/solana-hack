// Sample data for Campaign-v2-6-Launch. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn),
// board Campaign-v2-6-Launch, issue #51; backend map §4 row "Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing)" (POST …/launch).
import type { CampaignLaunchData } from './types';
import { campaignAudience } from './Campaign-v2-3-Audience.fixtures';
import { campaignPlan } from './Campaign-v2-4-Plan.fixtures';

// The cap comes from the shared campaign draft (flows/campaign/draft.ts), whose default is the canvas value 500.

export const campaignLaunch: CampaignLaunchData = {
  segments: campaignAudience.segments,
  planItems: campaignPlan.items,
  goal: '[goal]',
  audience: '[segments]',
  metric: '[metric]',
  plan: '[n] brand posts · [n] ambassador pieces',
  balance: '[n]',
  balanceCheck: null,
};

export const campaignLaunchBlocked: CampaignLaunchData = { ...campaignLaunch, balanceCheck: { checkedCap: '500', over: true } };
