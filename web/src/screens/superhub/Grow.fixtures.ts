// Sample data for the Grow screens: Engage-Queue, Engage-Rules, Partners, Leads, Influencer-Setup, Influencer-Queue
// (issue #52). Source: wireframe canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards of those names, notes
// n-eq, n-er, n-pa, n-le, n-is, n-iq (text and counts as drawn; brackets kept). Backend map rows "Engage-Queue",
// "Leads (experimental)", "Influencer-Setup, Influencer-Queue (experimental)" (§4 Grow) and Roadmap lines
// "Engage-Rules", "Partners" (.agentic/what/context/backend_map.md §4). The influencer persona is a fictional, bracketed
// sample identity with neutral bracketed captions (public-repo firewall, AGENTS rule 5).
import type { EngageQueueData, EngageRulesData, InfluencerQueueData, InfluencerSetupData, LeadsData, PartnersData } from './types';

export const engageQueue: EngageQueueData = {
  intro: 'We find conversations and draft replies in your Replies voice. You approve every one.',
  queue: [
    { id: 'q1', rule: 'r1', channel: 'X · mention', author: '@[handle]', ago: '14 min ago', incoming: 'Does aDNA work with [agent tool] or is it another thing I have to wire up myself?', note: 'Drafted reply · Replies voice · Slop check ✓', draft: 'Works out of the box. Drop an aDNA file in your repo root and [agent tool] reads it at the start of each session. Setup: adna.network/[docs]' },
    { id: 'q2', rule: 'r1', channel: 'LinkedIn · comment on your post', author: '[Name], [role]', ago: '1 h ago', incoming: 'How is this different from just keeping a README for the agent?', note: 'Drafted reply · Core voice · Slop check ✓ · 1 fix', draft: 'Fair question. A README is written for people and drifts. aDNA is structured for agents, versioned with the code, and the same file works across tools.' },
    { id: 'q3', rule: 'r2', channel: 'Discord · #help', author: '[member]', ago: '3 h ago', incoming: 'Is there a template for monorepos?', note: 'No confident answer found in your sources. Draft held for you to write.' },
  ],
  suggestions: [
    { id: 's1', who: '@[account]', what: 'posted about agents losing context mid-task · 2 h ago · 40 replies', channel: 'X · public post', draft: 'This is the problem aDNA exists for: the context lives in a file in the repo, so every session starts with it.' },
    { id: 's2', who: '[Newsletter]', what: 'wrote about agent memory formats · yesterday', channel: 'LinkedIn · article', draft: 'Good roundup. One format to add: aDNA keeps project context versioned with the code, readable by any agent.' },
  ],
  suggestionsNote: 'Picked from public posts about your content pillars. Nothing is sent without you.',
  listsCount: 2,
  never: 'Follow, unfollow, like or reply on your behalf without your approval. Opt-in auto-replies are the only exception, and you approve their wording once.',
};

export const engageRules: EngageRulesData = {
  rules: [
    { id: 'r1', when: 'Someone mentions aDNA', where: 'X, LinkedIn, Threads, Farcaster', then: 'Draft a reply for approval', on: true },
    { id: 'r2', when: 'A question in #help', where: 'Discord', then: 'Draft a reply for approval', on: true },
    { id: 'r3', when: 'A post about "agent context" with 20+ replies', where: 'X, LinkedIn', then: 'Suggest in "Worth engaging"', on: true },
  ],
  autoReply: { keyword: 'setup', where: 'X DMs and Discord', wording: "Here's the 2-minute setup guide: adna.network/[docs]. Reply STOP to opt out.", approved: 'Approved by you 3 Oct' },
  lists: [
    { id: 'l1', name: 'Agent tooling builders', accounts: 24, why: 'Post about coding agents weekly' },
    { id: 'l2', name: 'Open standards people', accounts: 11, why: 'Discuss specs and interoperability' },
  ],
  windows: 'X: weekdays 08:00–10:00 · LinkedIn: Tue–Thu 12:00–13:00 · Discord: Fri 17:00',
};

export const partners: PartnersData = {
  intro: 'Let agencies and integration partners write in your voice. Their drafts come to your approval queue like everything else.',
  voiceOptions: [{ value: 'founder-technical', label: 'Founder, Technical' }, { value: 'technical', label: 'Technical' }],
  approvalOptions: [{ value: 'every', label: 'You approve every piece' }],
  seatsTotal: 3,
  defaultEmail: 'team@[agency].com',
  partners: [
    { id: 'p1', name: '[Agency name]', voices: 'Founder, Technical', pieces: '4 (3 approved)', status: 'Active' },
    { id: 'p2', name: '[Integration partner]', voices: 'Technical', pieces: '1', status: 'Invited' },
  ],
  pricingNote: 'Pricing for extra partner seats: [TBD]. Paid per-piece licensing to outside parties is parked.',
};

export const leads: LeadsData = {
  banner: 'Experimental · built on the GamersLab lead finder · sources and scoring to be confirmed from that build',
  intro: "Describe who you're looking for. We surface organisations and public conversations that match, with the reason for each.",
  query: { who: 'Teams building products with coding agents', size: '2–200 people · any region', signals: '[Signal types from GamersLab lead finder]', sources: '[Sources from GamersLab lead finder]' },
  prefillNote: 'Pre-filled from your brand pack audiences',
  total: 32,
  leads: [
    { id: 'o1', name: '[Organisation A]', fit: 'High', why: '[Public signal, e.g. discussion of agent context problems]', status: 'new' },
    { id: 'o2', name: '[Organisation B]', fit: 'High', why: '[Public signal]', status: 'queued' },
    { id: 'o3', name: '[Community C]', fit: 'Medium', why: '[Public signal]', status: 'new' },
  ],
  outreachNote: 'Outreach drafts go through the brand and slop checks and wait for your approval like any post.',
};

export const influencerSetup: InfluencerSetupData = {
  banner: 'Experimental · an AI persona that posts in your voice, always labelled as AI',
  name: '[Influencer name]',
  brandOptions: [{ value: 'creator', label: '[Creator name] (brand)' }],
  personaOf: { creator: 'AI persona of [creator]' },
  voiceOptions: [{ value: 'persona', label: '[Persona voice]' }],
  pillars: '[Content pillar 1] · [Content pillar 2] · [Content pillar 3]',
  avatarFrom: '[avatar creator]',
  avatarTotal: '[n]',
  disclosures: [
    { id: 'watermark', label: '"AI-generated" watermark on every image and video', detail: 'Burned into the media, bottom-right.' },
    { id: 'bio', label: 'Bio says this is an AI persona of [creator]', detail: 'Added to each connected profile.' },
    { id: 'labels', label: "Use each platform's own AI label where one exists" },
    { id: 'approval', label: 'You approve every post and reply' },
  ],
  channels: 'Instagram · X · Threads · limits per channel come from the persona voice',
  preview: { image: '[Avatar image]', persona: 'AI persona of [creator]', caption: "[Caption in the creator's voice]" },
};

export const influencerQueue: InfluencerQueueData = {
  banner: 'Experimental · every post below carries the AI label and waits for you',
  title: '[Influencer name]: this week',
  subtitle: '[Persona voice] · AI persona of [creator]',
  posts: [
    { id: 'i1', image: '[Avatar at the writing desk]', stamped: true, channel: 'Instagram', when: 'Wed 20:00', caption: "[Caption in the creator's voice]", checks: 'On-brand [score] · Slop check ✓ · AI label ✓ · within Instagram limits' },
    { id: 'i2', image: '[Avatar, close-up, smiling]', stamped: true, channel: 'X', when: 'Thu 21:00', caption: '[Second caption in the creator\'s voice]', checks: 'On-brand [score] · Slop check ✓ · AI label ✓' },
    { id: 'i3', image: '[Avatar image]', stamped: false, channel: 'Threads', when: 'Fri 19:00', caption: '[Caption]', checks: '[Checks after re-stamp] · AI label ✓', blockedReason: 'Blocked: watermark not found on this image. Re-stamp to continue.' },
  ],
};
