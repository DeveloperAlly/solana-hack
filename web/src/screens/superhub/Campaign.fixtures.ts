// Sample data for Campaign-v2-1-Goal and Campaign-v2-2-Measure (issue #52). Source: wireframe canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Campaign-v2-1-Goal and Campaign-v2-2-Measure, notes n-c1 and
// n-c2 (text, targets and payouts as drawn; brackets kept). Backend map row "Campaign-v2-1, Campaign-v2-2 (steps 4–6
// missing)" (.agentic/what/context/backend_map.md §4 Create). The canvas draws a filled-in campaign; here its name,
// dates and targets are placeholders and every choice starts empty (no pre-selection on the person's behalf).
import type { CampaignData } from './types';

export const campaign: CampaignData = {
  steps: ['Goal and platforms', 'Audience', 'Success', 'Content plan', 'People and budget', 'Review'],
  purposes: [
    { id: 'launch', label: 'Launch', description: 'A release, feature or standard' },
    { id: 'awareness', label: 'Awareness', description: 'Get known by a new audience' },
    { id: 'community', label: 'Community growth', description: 'Members, contributors, ambassadors' },
    { id: 'leads', label: 'Leads', description: 'Sign-ups, demos, conversations' },
    { id: 'event', label: 'Event', description: 'Before, during, after' },
    { id: 'hiring', label: 'Hiring', description: 'Roles and culture' },
    { id: 'thought', label: 'Thought leadership', description: 'Opinions, research, essays' },
    { id: 'custom', label: 'Custom', description: 'Describe it' },
  ],
  platforms: [
    { id: 'x', label: 'X', detail: 'posts, threads' },
    { id: 'linkedin', label: 'LinkedIn', detail: 'posts' },
    { id: 'blog', label: 'Blog', detail: 'tutorials' },
    { id: 'instagram', label: 'Instagram', detail: 'carousels, reels' },
    { id: 'tiktok', label: 'TikTok', detail: 'short video' },
    { id: 'youtube', label: 'YouTube', detail: 'shorts, long' },
    { id: 'threads', label: 'Threads' },
    { id: 'farcaster', label: 'Farcaster' },
    { id: 'discord', label: 'Discord', detail: 'announcements' },
    { id: 'newsletter', label: 'Newsletter' },
  ],
  posterOptions: [
    { value: 'brand', label: 'Brand accounts only' },
    { value: 'ambassadors', label: 'Ambassadors only (paid per verified post)' },
    { value: 'both', label: 'Both' },
  ],
  name: 'aDNA launch week',
  dates: '6–12 Oct 2026',
  mediaNote: 'Video and image formats produce scripts and briefs; you supply or approve the media.',
  metrics: [
    { id: 'verified', metric: 'Verified ambassador posts', target: '40', source: 'JamJam verification (exact)', measurable: true },
    { id: 'clicks', metric: 'Clicks to adna.network', target: '[target]', source: 'Tracked links we add to every post', measurable: true },
    { id: 'engagement', metric: 'Engagement rate', target: '2%', source: 'Connected account stats (per platform)', measurable: true },
    { id: 'reach', metric: 'Reach', target: '', source: 'Connected account stats', measurable: false },
    { id: 'signups', metric: 'Sign-ups or repo stars', target: '', source: '[Your analytics or GitHub, connect]', measurable: false },
    { id: 'leads', metric: 'Qualified leads', target: '', source: 'Lead finder (experimental)', measurable: false },
  ],
  plan: [
    { day: 'Mon', brand: 'X thread: the problem · LinkedIn: announcement', ambassadors: 'Brief opens' },
    { day: 'Wed', brand: 'Blog: why agents need shared context', ambassadors: 'Blog posts (5 USDC), LinkedIn (10 USDC)' },
    { day: 'Fri', brand: 'Discord recap · X: best ambassador posts', ambassadors: 'Tutorials (50 USDC)' },
  ],
  budget: { line: 'Ambassador payouts: spending cap 500 USDC, approved once · 30 slots · you review each post', note: "Brand-account posts cost nothing extra; they're part of your plan." },
  unavailableNote: 'Some platforms share fewer numbers with third-party apps. Where a number isn\'t available, it shows as "not available" rather than an estimate.',
};
