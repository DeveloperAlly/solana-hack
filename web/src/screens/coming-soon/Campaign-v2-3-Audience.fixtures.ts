// Sample data for Campaign-v2-3-Audience. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn),
// board Campaign-v2-3-Audience, issue #51; backend map §4 row "Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing)".
import type { CampaignAudienceData } from './types';

export const campaignAudience: CampaignAudienceData = {
  source: "From your kit's audience section.",
  segments: [
    { id: 'seg-1', label: '[Audience segment 1]', tag: 'Assumption' },
    { id: 'seg-2', label: '[Audience segment 2]', tag: 'Assumption' },
  ],
};

export const campaignAudienceEmpty: CampaignAudienceData = { ...campaignAudience, segments: [] };
