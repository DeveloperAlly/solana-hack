// Sample posts for aDNA through the loop, one per lifecycle variant the canvas v24 Post-Detail board names: amplified
// (the board), draft, approval stale after an edit, publish failed on one platform, not verified, results ready
// (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). The first is the board's post. Other copy, people and figures
// are bracketed. Shared by Post-Detail, Today and any post card.
import { approve } from '../../lib/approval';
import { postInputs, type DraftProvenance, type Post } from '../post';
import { OWNER } from './brain';

const prompt = { id: 'draft-post', version: '[version]' };
/** ADR-013 decision 2: the default model is openrouter/free. */
const model = 'openrouter/free';
const founder = (over: Partial<DraftProvenance> = {}): DraftProvenance => ({ kitVersion: 3, brainVersion: '3.1', evidenceIds: ['f-folder', 'f-context'], ruleIds: ['r-lead', 'r-no-hype'], voice: 'founder', prompt, model, ...over });
const passed = { slop: 'passed', claims: { backed: 2, total: 2 }, disclosure: 'n/a' } as const;
const approvedAt = (post: Pick<Post, 'text' | 'provenance'>, at: string) => approve(postInputs(post, '3.1'), { by: OWNER, at });

const launchText = "Your agent didn't forget. It was never told. Every new session starts blank because project context lives in people's heads. aDNA puts it in the repo, where every agent reads it first. Here's the fix, in one folder.";
const launch = { text: launchText, provenance: founder() };

const blogText = 'Why agents need shared project context. [Draft body, 1,100 words]';
const staleOriginal = { text: 'Project context belongs in the repo. [Draft as approved]', provenance: founder() };
const staleText = 'Project context belongs in the repo, next to the code. [Draft as edited after approval]';
const failedPost = { text: 'One folder, read first by every agent. [Post copy]', provenance: founder() };
const unverifiedPost = { text: 'Agents start blank. aDNA fixes that. [Post copy]', provenance: founder() };
const resultsPost = { text: 'The problem with agent memory is that nobody wrote it down. [Post copy]', provenance: founder({ brainVersion: '3', ruleIds: ['r-no-hype'] }) };

export const adnaPosts: Post[] = [
  {
    id: 'post-launch', name: 'X · Launch week: "Your agent didn\'t forget"', platform: 'X', campaign: 'Launch week', ...launch, length: `${launchText.length} of 280 characters`,
    checks: passed,
    lifecycle: {
      drafted: { voiceLabel: 'Founder voice' },
      approval: approvedAt(launch, 'Tue 09:12'),
      published: [
        { platform: 'X', version: 'Original', status: 'published', detail: 'Published Tue 09:30', registered: true },
        { platform: 'LinkedIn', version: 'Adapted · 3 lines longer', status: 'published', detail: 'Published Tue 12:30', registered: true },
        { platform: 'Threads', version: 'Adapted', status: 'planned', detail: 'Planned platform', registered: false },
      ],
      verified: { at: 'Tue 09:31' },
      amplified: [
        { id: 'amb-1', who: '[Creator name]', platform: 'LinkedIn', note: 'from the kit, disclosed', status: 'paid', label: 'Verified · 10 USDC paid' },
        { id: 'amb-2', who: '[Creator name]', platform: 'X', status: 'awaiting-approval', label: 'Verified · awaiting your approval' },
        { id: 'amb-3', who: '[Creator name]', platform: 'X', status: 'checking', label: 'Posted · checking' },
      ],
      results: { status: 'collecting', detail: 'Collecting · 2 of 7 days' },
    },
  },
  {
    id: 'post-blog', name: 'Blog · "Why agents need shared project context" (draft)', platform: 'Blog', campaign: '[Campaign]', text: blogText, length: '1,100 words',
    provenance: founder({ voice: 'technical', evidenceIds: ['f-context'] }),
    checks: { slop: 'passed', claims: { backed: 1, total: 2 }, disclosure: 'n/a' },
    lifecycle: { drafted: { voiceLabel: 'Technical voice' }, published: [], amplified: [], results: { status: 'not-started', detail: 'Not started' } },
  },
  {
    id: 'post-stale', name: 'X · edited after approval', platform: 'X', campaign: 'Launch week', text: staleText, provenance: staleOriginal.provenance, length: `${staleText.length} of 280 characters`,
    checks: passed,
    lifecycle: {
      drafted: { voiceLabel: 'Founder voice' },
      approval: approvedAt(staleOriginal, 'Mon 16:40'),
      published: [{ platform: 'X', version: 'Original', status: 'planned', detail: 'Scheduled [day] [time]', registered: false }],
      amplified: [], results: { status: 'not-started', detail: 'Not started' },
    },
  },
  {
    id: 'post-failed', name: 'LinkedIn · publish failed', platform: 'LinkedIn', campaign: 'Launch week', ...failedPost, length: '[n] characters',
    checks: passed,
    lifecycle: {
      drafted: { voiceLabel: 'Founder voice' },
      approval: approvedAt(failedPost, 'Mon 10:02'),
      published: [
        { platform: 'X', version: 'Original', status: 'published', detail: 'Published Mon 10:30', registered: true },
        { platform: 'LinkedIn', version: 'Adapted', status: 'failed', detail: 'Failed: the LinkedIn connection expired. Reconnect it in Connections.', registered: false },
      ],
      verified: { at: 'Mon 10:31' },
      amplified: [], results: { status: 'collecting', detail: 'Collecting · 1 of 7 days' },
    },
  },
  {
    id: 'post-unverified', name: 'X · not registered yet', platform: 'X', campaign: '[Campaign]', ...unverifiedPost, length: '[n] characters',
    checks: passed,
    lifecycle: {
      drafted: { voiceLabel: 'Founder voice' },
      approval: approvedAt(unverifiedPost, 'Sun 18:20'),
      published: [{ platform: 'X', version: 'Original', status: 'published', detail: 'Published Sun 18:30', registered: false }],
      amplified: [], results: { status: 'collecting', detail: 'Collecting · 3 of 7 days' },
    },
  },
  {
    id: 'post-results', name: 'X · results ready', platform: 'X', campaign: '[Earlier campaign]', ...resultsPost, length: '[n] characters',
    checks: passed,
    lifecycle: {
      drafted: { voiceLabel: 'Founder voice' },
      approval: approve('published before this session', { by: OWNER, at: '[date]' }),
      published: [{ platform: 'X', version: 'Original', status: 'published', detail: 'Published [date]', registered: true }],
      verified: { at: '[date]' },
      amplified: [{ id: 'amb-4', who: '[Creator name]', platform: 'X', status: 'paid', label: 'Verified · [n] USDC paid' }],
      results: { status: 'ready', detail: 'Ready · [n] replies · led to the rule "Lead with the problem"' },
    },
  },
];
