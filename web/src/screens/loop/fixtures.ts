// Sample data for the loop screens, from canvas v24 boards Today, M-Today, Post-Detail, Brain, Learn-Rules and
// Verify-Home (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). The demo brand is aDNA, as the boards draw it;
// people, events and figures the boards bracket stay bracketed. The Brain, posts and proposals are the shared
// fixtures in src/domain/fixtures, so every page agrees.
import { adnaBrain, adnaBrainFirstRun, firstRunBrain, OWNER } from '../../domain/fixtures/brain';
import type { LoopBase } from '../../flows/loop/useLoop';
import type { LoopStageId } from '../../config/nav';
import type { LoopStepState } from '../../domain/loop';
import { adnaPosts } from '../../domain/fixtures/posts';
import { adnaProposals } from '../../domain/fixtures/proposals';
import type { LearnRulesData, PostDetailData, TodayData, VerifyHomeData } from './types';

/** The Brain screen's data, and the base every loop screen extends. */
export const brainScreen = { brain: adnaBrain, proposals: adnaProposals, approver: OWNER };
const base = brainScreen;

export const today: TodayData = {
  ...base,
  weekday: 'Tuesday',
  status: 'adna.network verified · Kit v3 on Solana · 3 seats',
  loopNote: 'Learn starts after 14 days of results',
  loop: [
    { stage: 'brand', state: 'live', detail: 'Kit v3 · 4 voices · 12 learned rules', link: { label: 'Open the Brain', artboard: 'Brain' } },
    { stage: 'create', state: 'live', detail: '6 drafts waiting', link: { label: 'Drafts', artboard: 'Content-Dashboard' } },
    { stage: 'distribute', state: 'live', detail: 'X, LinkedIn connected · 2 planned', link: { label: 'Platforms', artboard: 'Platforms' } },
    { stage: 'verify', state: 'live', detail: '41 posts registered · 212 checks by others', link: { label: 'Your proof', artboard: 'Verify-Home' } },
    { stage: 'grow', state: 'current', detail: '1 campaign · 1 event in 5 days', link: { label: 'Grow', artboard: 'Grow-Home' } },
    { stage: 'learn', state: 'not-started', detail: 'Collecting · 9 of 14 days', link: { label: 'Results so far', artboard: 'Analytics' } },
  ],
  queue: [
    { id: 'q-draft-x', kind: 'draft', chip: 'Draft · X', text: '"Your agent didn\'t forget. It was never told. Here\'s the fix."', meta: 'Founder voice · kit v3', checks: { slop: 'passed', claims: { backed: 2, total: 2 }, disclosure: 'n/a' }, open: { label: 'Edit', artboard: 'Draft-Review' }, whyThis: 'Post-Detail' },
    { id: 'q-event', kind: 'eventContent', chip: 'Event · 5 days', text: '[Conference] side event: 3 countdown posts drafted for you to approve', meta: "From your Luma calendar · you're speaking · plan: announce, countdown, live, recap", drafts: 3, open: { label: 'Open plan', artboard: 'Event-Detail' } },
    { id: 'q-reply', kind: 'reply', chip: 'Reply · LinkedIn', text: 'A likely lead asked whether aDNA works with their agent stack', meta: 'Replies voice · drafted · waiting 3 h', checks: { slop: 'passed', claims: { backed: 0, total: 0 }, disclosure: 'n/a' }, open: { label: 'Edit', artboard: 'Inbox-NeedsReply' } },
    { id: 'q-amb', kind: 'ambassadorPost', chip: 'Ambassador post', text: "[Creator name]'s LinkedIn post is live and verified against your kit", meta: '10 USDC to their wallet on approval · disclosure present', payout: { amount: 10, unit: 'USDC' }, verified: true, disclosure: 'present', open: { label: 'Review', artboard: 'Dashboard' } },
    { id: 'q-rule', kind: 'learnedRule', chip: 'Learned rule', text: '"Open X threads with the problem, not the product."', meta: 'Learn found it in 14 of your posts · checked by a second evaluator', proposalId: 'p-problem-x', open: { label: 'See evidence', artboard: 'Learn-Rules' } },
    { id: 'q-blog', kind: 'draft', chip: 'Draft · Blog', text: '"Why agents need shared project context"', meta: 'Technical voice · 1,100 words', checks: { slop: 'passed', claims: { backed: 1, total: 2 }, disclosure: 'n/a' }, open: { label: 'Add source', artboard: 'Claims' } },
    { id: 'q-campaign', kind: 'campaignDecision', chip: 'Campaign', text: 'Launch week hit 80% of its 500 USDC cap', meta: 'Raise the cap, or let it end when the cap is reached', capShare: 0.8, open: { label: 'Decide', artboard: 'Campaign-v2-5-Budget' } },
  ],
  done: ['6 drafts written in your voices', '3 posts published and registered on Solana', '2 ambassador posts verified', '212 people checked a post on Verify'],
  learned: 'Threads that open with the problem got more replies than ones that open with the product.',
  next: [
    { when: 'Thu', what: "[Conference] side event, you're speaking" },
    { when: 'Fri', what: 'Launch week campaign ends' },
    { when: 'Mon', what: 'First Learn report (14 days of results)' },
  ],
  proof: 'The check-it badge on your site sent 18 people to Verify this week; 3 started their own brand.',
};

/** All clear: nothing waits on a person (canvas Today note). */
export const todayAllClear: TodayData = { ...today, queue: [] };

export const postDetail: PostDetailData = { ...base, posts: adnaPosts };
export const postDetailEmpty: PostDetailData = { ...base, posts: [] };

export const brainFirstRun = { ...base, brain: adnaBrainFirstRun, proposals: [] };

export const learnRules: LearnRulesData = { ...base, collecting: { days: 14, needed: 14 } };
/** Collecting: under 14 days of results, so nothing to suggest yet (canvas Learn-Rules note). */
export const learnRulesCollecting: LearnRulesData = { ...base, proposals: [], collecting: { days: 9, needed: 14 } };

export const verifyHome: VerifyHomeData = {
  brandName: 'aDNA',
  kpis: [
    { label: 'Kit', value: 'v3', sub: 'registered 6 Oct · domain verified' },
    { label: 'Posts registered', value: '41', sub: 'incl. 9 ambassador posts' },
    { label: 'Checks by others', value: '212', sub: 'this month · 3 found no match' },
    { label: 'Badge visits', value: '18', sub: 'this week · 3 started a brand' },
  ],
  registered: [
    { id: 'reg-post', kind: 'post', what: 'X post · "Your agent didn\'t forget..."', when: 'Tue 09:31', approver: OWNER, record: 'Verify-1-Match' },
    { id: 'reg-amb', kind: 'ambassador', what: 'Ambassador · LinkedIn · [Creator name]', when: 'Mon 16:02', approver: OWNER, record: 'Verify-1-Match' },
    { id: 'reg-kit', kind: 'kit', what: 'Kit v3', when: '6 Oct', approver: OWNER, record: 'Verify-4-Kit-Account-Claim' },
  ],
  noMatch: [
    { id: 'nm-1', text: '"[Sample impersonation] aDNA airdrop: connect your wallet to claim..."', when: 'checked Mon' },
    { id: 'nm-2', text: '"[Pasted text]"', when: 'checked [day]' },
    { id: 'nm-3', text: '"[Pasted text]"', when: 'checked [day]' },
  ],
};

export const verifyHomeEmpty: VerifyHomeData = { ...verifyHome, kpis: [], registered: [], noMatch: [] };

/** Every loop screen's data for one brand: the full set and the empty variant each screen's empty state shows. */
export interface LoopBrandData {
  today: TodayData;
  todayAllClear: TodayData;
  postDetail: PostDetailData;
  postDetailEmpty: PostDetailData;
  brain: LoopBase;
  brainFirstRun: LoopBase;
  learnRules: LearnRulesData;
  learnRulesCollecting: LearnRulesData;
  verifyHome: VerifyHomeData;
  verifyHomeEmpty: VerifyHomeData;
}

const adna: LoopBrandData = { today, todayAllClear, postDetail, postDetailEmpty, brain: brainScreen, brainFirstRun, learnRules, learnRulesCollecting, verifyHome, verifyHomeEmpty };

/**
 * A demo brand the canvas draws no loop data for, on its first run: kit v1 and the kit gate rules in the Brain, nothing
 * waiting, no posts, nothing registered, and Learn collecting. Copy the canvas does not give is bracketed.
 */
/** On a first run the kit is live and the first post is where the work is. */
const firstRunSteps: Partial<Record<LoopStageId, LoopStepState>> = { brand: 'live', create: 'current' };

function firstRunBrand(name: string, domain: string): LoopBrandData {
  const b: LoopBase = { brain: firstRunBrain(name, domain), proposals: [], approver: OWNER };
  const day: TodayData = {
    ...b,
    weekday: 'Tuesday',
    status: `${domain} · Kit v1 on Solana`,
    loopNote: 'Learn starts after 14 days of results',
    loop: today.loop.map((s) => ({ ...s, state: firstRunSteps[s.stage] ?? 'not-started', detail: '[detail]' })),
    queue: [],
    done: [],
    learned: 'Nothing yet: Learn starts after 14 days of results.',
    next: [],
    proof: '[Badge traffic, once the badge is on your site]',
  };
  const learn: LearnRulesData = { ...b, collecting: { days: 0, needed: 14 } };
  const proof: VerifyHomeData = { brandName: name, kpis: [], registered: [], noMatch: [] };
  return { today: day, todayAllClear: day, postDetail: { ...b, posts: [] }, postDetailEmpty: { ...b, posts: [] }, brain: b, brainFirstRun: b, learnRules: learn, learnRulesCollecting: learn, verifyHome: proof, verifyHomeEmpty: proof };
}

const byBrand: Record<string, LoopBrandData> = {
  adna,
  jamjam: firstRunBrand('JamJam', 'jamjam.tech'),
  gamerslab: firstRunBrand('GamersLab', '[gamerslab domain]'),
};

/**
 * The loop data for a brand id (the one active brand, flows/brand), or undefined when there is none yet: screens then
 * say so, never showing another brand's data (Codex review on PR 111).
 */
export const loopDataFor = (brandId: string): LoopBrandData | undefined => byBrand[brandId];
