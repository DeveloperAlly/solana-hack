// Sample data for Campaign-v2-5-Budget. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn),
// board Campaign-v2-5-Budget, issue #51; backend map §4 row "Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing)" (the API
// rejects a paid X format). Payouts 10 / 5 / 50 and the 500 cap are the canvas field values; the balance stays bracketed.
import type { CampaignBudgetData } from './types';

export const campaignBudget: CampaignBudgetData = {
  payouts: [
    { id: 'linkedin', format: 'LinkedIn post', where: 'LinkedIn', payout: '10' },
    { id: 'blog', format: 'Blog post', where: "Ambassador's blog", payout: '5' },
    { id: 'tutorial', format: 'Tutorial', where: "Ambassador's blog", payout: '50' },
  ],
  noXNote: 'No X formats: X bans paying for posts (ADR-002); the API rejects a paid X format (backend map).',
  cap: '500',
  balance: '[n]',
  overBalance: false,
};

export const campaignBudgetOverBalance: CampaignBudgetData = { ...campaignBudget, overBalance: true };
