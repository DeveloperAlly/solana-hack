// Sample data for Dashboard (Grow > Ambassadors, brand aDNA). Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
// board Dashboard (note n-dash; every figure below is the canvas's, bracketed where the canvas brackets it); issue #50;
// backend map §4, row "Dashboard (and its empty state)". Receipt and post links point at the Ledger screen in the prototype.
// Keyed by demo brand; switching brand in the hub shows that brand's (empty) dashboard.
import type { DashboardData, DashboardScreenData } from './types';
import { emptyDashboard } from './Dashboard-Empty.fixtures';
import { perBrand } from './hubBrands.fixtures';

/** aDNA, the brand the canvas draws; the other demo brands have no campaigns yet. */
const adnaDashboard: DashboardData = {
  title: 'aDNA',
  meta: 'adna.network verified · Kit v1 · aDNA launch week (500 USDC cap)',
  kpis: [
    { label: 'Ambassador posts approved', value: '[n]', sub: 'this month', sample: true },
    { label: 'Campaign spend', value: '135 USDC', sub: 'of 500 cap', sample: true },
    { label: 'Paid to ambassadors', value: '13 posts', sub: '9 ambassadors', sample: true },
    { label: 'Awaiting your approval', value: '2', sub: '60 USDC committed', sample: true },
  ],
  pending: [
    {
      id: 's1', kind: 'LinkedIn post', author: 'Mai T.', amount: '10 USDC',
      excerpt: 'My coding agent lost a full day of work last week. Not the code. The context…',
      checks: ['On-brand 91%', 'Verified on LinkedIn'], link: { label: 'Open post', board: 'ledger' },
    },
    {
      id: 's2', kind: 'Tutorial', author: 'Dev R.', amount: '50 USDC',
      excerpt: 'Set up shared project context for your agents',
      checks: ['On-brand 84%', 'Page matches draft 96%'], link: { label: 'Open page', board: 'ledger' },
    },
  ],
  campaigns: [{ id: 'launch', name: 'aDNA launch week', channels: 'LinkedIn · Blog', ends: '12 Oct (6 days)', spent: 135, committed: 60, cap: 500, paid: '13 paid', pending: '2 pending' }],
  recent: [
    { id: 'r1', date: '5 Oct', piece: 'Blog post · "[Partner] now supports aDNA"', ambassador: '[ambassador]', paid: '2.00', receiptBoard: 'ledger' },
    { id: 'r2', date: '5 Oct', piece: 'Docs page · "Using aDNA with [tool]"', ambassador: '[ambassador]', paid: '5.00', receiptBoard: 'ledger' },
    { id: 'r3', date: '4 Oct', piece: 'Blog post · integration launch', ambassador: '[ambassador]', paid: '2.00', receiptBoard: 'ledger' },
  ],
  kit: { summary: 'Plain, precise, builder to builder. 3 pillars · 4 glossary terms · 3 banned claims.', usage: 'Approved 28 Sep · used in 32 pieces' },
  publicPageUrl: '[aDNA public page URL]',
};

export const dashboardData: DashboardScreenData = { defaultBrandId: 'adna', byBrand: { ...perBrand(emptyDashboard), adna: adnaDashboard } };
