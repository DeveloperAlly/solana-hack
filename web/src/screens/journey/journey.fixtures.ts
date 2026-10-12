/*
 * Facts shared by several Journey boards, so each quote is written once. Text is the canvas sample text from boards
 * J1-Read, J3-Confirm and Main (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), built in issue #48. In the live flow
 * these are `evidence` rows from the IngestWorkflow (backend map §4, row "Onboard-3b-Profiling, Ingest-Error"), shown
 * through GET /api/brands/:id (web/worker/api.ts, brandState). Bracketed text is a placeholder the canvas brackets.
 */
import type { JourneyFact } from './types';

const home = { label: 'jamjam.tech · home page', url: 'https://jamjam.tech' };
const how = { label: 'jamjam.tech · How it works', url: 'https://jamjam.tech/how-it-works' };

export const facts = {
  positioning: {
    id: 'positioning',
    section: 'Positioning',
    status: 'found',
    statement: 'JamJam builds a brand kit, then drafts posts in that voice.',
    quote: 'Build your voice. Launch your brand.',
    source: home,
  },
  purpose: {
    id: 'purpose',
    section: 'Purpose',
    status: 'found',
    statement: 'Approved work is registered so anyone can check what came from the brand.',
    quote: 'Your approved kit and approved posts are registered on Solana, so anyone can check what really came from you.',
    source: home,
  },
  messagingChecked: {
    id: 'messaging-checked',
    section: 'Messaging',
    status: 'found',
    statement: 'Every draft is checked, and a person approves before anything goes out.',
    quote: 'Draft posts in your voice. Each one is checked for AI slop and fit before you see it. Nothing goes out until you approve it.',
    source: how,
  },
  messagingGates: {
    id: 'messaging-gates',
    section: 'Messaging',
    status: 'found',
    statement: 'Owners sign off purpose, positioning and voice, with sources.',
    quote: 'You sign off three things: purpose, positioning and voice. Every fact shows where it came from; anything we drafted waits for you.',
    source: how,
  },
  voiceRead: {
    id: 'voice',
    section: 'Voice',
    status: 'partly',
    statement: "Plain, direct sentences; second person. We'll confirm with you.",
  },
} satisfies Record<string, JourneyFact>;

/** An answer the owner gives on J4, kept as evidence (canvas J4: Saved as evidence: "owner answer, [date]"). */
export const ownerAnswer: JourneyFact = {
  id: 'owner-answer',
  section: 'Owner answer',
  status: 'found',
  statement: '[owner answer]',
  note: 'Saved as evidence: "owner answer, [date]".',
};

/** The launch post text from canvas board J6-First-Post, the draft J7 registers and checks. */
export const launchPost =
  'Every brand tool I tried asked me questions my website already answered. So JamJam reads first. It shows you each fact with the line it came from, drafts posts in your voice, and waits for you to approve them. Anyone can check what really came from you. Built in public: our own kit is on the ledger.';
