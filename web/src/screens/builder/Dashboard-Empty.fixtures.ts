// Sample data for Dashboard-Empty: every demo brand with nothing yet. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
// board Dashboard-Empty (note n-dashe; KPI labels and zeros as drawn; aDNA's line "adna.network verified · Kit v1"); issue #50;
// backend map §4, row "Dashboard (and its empty state)". Other brands' kit summaries are bracketed (note n-openq.5).
import type { DashboardData, DashboardScreenData } from './types';
import { perBrand, type HubBrand } from './hubBrands.fixtures';

const adnaKitSummary = 'Plain, precise, builder to builder. 3 pillars · 4 glossary terms · 3 banned claims.';

/** A brand's Ambassadors dashboard before any campaign. */
export function emptyDashboard(brand: HubBrand): DashboardData {
  return {
    title: brand.name,
    meta: `${brand.domain} ${brand.verified ? 'verified' : 'unverified'} · Kit v1`,
    kpis: [
      { label: 'Paid to ambassadors', value: '0 USDC' },
      { label: 'Campaign spend', value: '0 USDC' },
      { label: 'Paid to ambassadors', value: '0 posts' },
      { label: 'Awaiting approval', value: '0' },
    ],
    pending: [],
    campaigns: [],
    recent: [],
    kit: { summary: brand.id === 'adna' ? adnaKitSummary : `[${brand.name} kit v1 summary]` },
    publicPageUrl: `[${brand.name} public page URL]`,
  };
}

export const dashboardEmptyData: DashboardScreenData = { defaultBrandId: 'adna', byBrand: perBrand(emptyDashboard) };
