// Sample data for Campaign-v2-6-Launch. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn),
// board Campaign-v2-6-Launch, issue #51; backend map §4 row "Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing)" (POST …/launch).
import type { CampaignLaunchData } from './types';

export const campaignLaunch: CampaignLaunchData = {
  goal: '[goal]',
  audience: '[segments]',
  metric: '[metric]',
  plan: '[n] brand posts · [n] ambassador pieces',
  cap: '500',
  balance: '[n]',
  overBalance: false,
};

export const campaignLaunchBlocked: CampaignLaunchData = { ...campaignLaunch, overBalance: true };
