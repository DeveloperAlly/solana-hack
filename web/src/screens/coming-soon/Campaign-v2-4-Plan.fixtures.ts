// Sample data for Campaign-v2-4-Plan. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn),
// board Campaign-v2-4-Plan, issue #51; backend map §4 row "Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing)" (POST …/plan).
import type { CampaignPlanData } from './types';

export const campaignPlan: CampaignPlanData = {
  items: [
    { id: 'mon', day: 'Mon', brandPosts: 'LinkedIn: announcement · X thread: the problem', ambassadorPieces: 'Brief opens', slot: '09:00' },
    { id: 'wed', day: 'Wed', brandPosts: 'Blog: [title]', ambassadorPieces: 'LinkedIn posts, blog posts, tutorials', slot: '12:30' },
  ],
  rule: "Every item goes to approval. X posts are the brand's own; ambassadors are never paid for X posts (ADR-002).",
};
