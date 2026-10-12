// Sample data for Dashboard-Empty: the Dashboard with nothing yet. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
// board Dashboard-Empty (note n-dashe; KPI labels and zeros as drawn); issue #50; backend map §4, row "Dashboard (and its
// empty state)".
import type { DashboardData } from './types';
import { dashboardData } from './Dashboard.fixtures';

export const dashboardEmptyData: DashboardData = {
  ...dashboardData,
  meta: 'adna.network verified · Kit v1',
  kpis: [
    { label: 'Paid to ambassadors', value: '0 USDC' },
    { label: 'Campaign spend', value: '0 USDC' },
    { label: 'Paid to ambassadors', value: '0 posts' },
    { label: 'Awaiting approval', value: '0' },
  ],
  pending: [],
  campaigns: [],
  recent: [],
  kit: { summary: dashboardData.kit.summary },
};
