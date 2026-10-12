// Sample data for Analytics and Analytics-Empty (issue #52). Source: wireframe canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Analytics and Analytics-Empty, notes n-an and n-ane
// ("All numbers are sample data", n-an; values as drawn, brackets kept). Backend map Roadmap line "Analytics and
// Analytics-Empty" (.agentic/what/context/backend_map.md §4).
import { paths } from './paths';
import type { AnalyticsData, AnalyticsRange } from './types';

/** Last 30 days, as drawn (n-an: all numbers are sample data). */
const last30: AnalyticsRange = {
  kpis: [
    { label: 'Posts', value: '64', sub: 'brand 38 · ambassadors 26' },
    { label: 'Reach', value: '[n]', sub: 'where platforms share it' },
    { label: 'Engagement rate', value: '1.8%', sub: 'goal 2%' },
    { label: 'Clicks to site', value: '1,240', sub: 'tracked links' },
    { label: 'Cost per verified post', value: '9 USDC', sub: 'ambassadors' },
  ],
  byVoice: [
    { label: 'Founder', value: 3.1, display: '3.1%' },
    { label: 'Technical', value: 2.0, display: '2.0%' },
    { label: 'Core voice', value: 1.5, display: '1.5%' },
    { label: 'Playful', value: 1.0, display: '1.0%' },
  ],
  byFormat: [
    { label: 'X thread', value: 2.9, display: '2.9%' },
    { label: 'Tutorial', value: 2.3, display: '2.3%' },
    { label: 'X post', value: 1.7, display: '1.7%' },
    { label: 'LinkedIn image', value: 0.4, display: '0.4%' },
  ],
  top: [
    { id: 't1', post: 'X thread "Why agents forget"', rate: '3.1%' },
    { id: 't2', post: 'Tutorial by Dev R. (ambassador)', rate: '2.6%' },
    { id: 't3', post: 'LinkedIn "Three things we learned"', rate: '2.2%' },
  ],
  notWorking: [
    { id: 'w1', what: 'LinkedIn image posts', rate: '0.4%', posts: '4 posts' },
    { id: 'w2', what: 'Posts after 18:00 on X', rate: '0.6%', posts: '9 posts' },
    { id: 'w3', what: 'Playful voice on LinkedIn', rate: '0.7%', posts: '3 posts' },
  ],
};

/** Launch week is not drawn: its numbers stay bracketed and its breakdowns empty until analytics exist. */
const launchWeek: AnalyticsRange = {
  kpis: last30.kpis.map((k) => ({ ...k, value: '[n]' })),
  byVoice: [],
  byFormat: [],
  top: [],
  notWorking: [],
};

export const analytics: AnalyticsData = {
  ranges: [{ value: '30d', label: 'Last 30 days' }, { value: 'launch', label: 'Launch week' }],
  byRange: { '30d': last30, launch: launchWeek },
  suggestions: [
    { id: 'g1', text: 'Move 2 LinkedIn image slots to X threads in Founder voice.', action: "Apply to next week's plan" },
    { id: 'g2', text: 'Stop scheduling X posts after 18:00.', action: 'Update posting windows', href: paths.engageRules },
  ],
  suggestionsNote: 'Suggestions change the plan only when you apply them.',
  connect: {
    intro: 'We only read numbers each platform shares with connected apps. Anything a platform doesn\'t share is shown as "not available".',
    sources: [
      { id: 'x', name: 'X', status: 'collecting', note: 'first numbers in about 24 h' },
      { id: 'li', name: 'LinkedIn', status: 'connected' },
      { id: 'ig', name: 'Instagram', status: 'not-connected' },
      { id: 'dc', name: 'Discord', status: 'not-connected' },
      { id: 'web', name: 'Website (tracked links)', status: 'default-on' },
    ],
    error: { message: 'Instagram disconnected 2 days ago. Numbers after 4 Oct are missing.', source: 'ig' },
  },
};
