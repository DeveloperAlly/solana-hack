import { describe, expect, it } from 'vitest';
import { approve, isStale } from '../lib/approval';
import { nextBrainVersion } from './brain';
import { approvalState, lifecycleSteps } from './post';
import { proposalGate, proposalNote } from './proposal';
import { paidCount, questWithPayouts, submissionGate } from './quest';
import { checksGate, gateFor } from './queue';
import { liveStepCount, loopProgressLabel } from './loop';
import { adnaPosts } from './fixtures/posts';
import { adnaProposals } from './fixtures/proposals';
import { today } from '../screens/loop/fixtures';

const post = (id: string) => adnaPosts.find((p) => p.id === id)!;
const states = (id: string, v = '3.1') => lifecycleSteps(post(id), v).map((s) => s.state);

describe('domain: approvals and the Brain version', () => {
  it('an approval on old inputs is stale (lib/approval.ts)', () => {
    const a = approve({ text: 'text', brainVersion: '3.1' }, { by: 'x', at: 'y' });
    expect(isStale(a, { text: 'text', brainVersion: '3.1' })).toBe(false);
    expect(isStale(a, { text: 'text', brainVersion: '3.2' })).toBe(true);
  });
  it('a changed check result makes an unpublished post approval stale', () => {
    const approvedNotPublished = { ...post('post-stale'), text: 'Project context belongs in the repo. [Draft as approved]' };
    expect(approvalState(approvedNotPublished, '3.1')).toBe('valid');
    expect(approvalState({ ...approvedNotPublished, checks: { ...approvedNotPublished.checks, claims: { backed: 1, total: 2 } } }, '3.1')).toBe('stale');
  });
  it('a rule change bumps the revision and never the kit', () => {
    expect(nextBrainVersion('3.1')).toBe('3.2');
    expect(nextBrainVersion('3')).toBe('3.1');
  });
});

describe('domain: post lifecycle (one state per step)', () => {
  it('the board post: four done, amplified current, results to do', () => {
    expect(states('post-launch')).toEqual(['done', 'done', 'done', 'done', 'current', 'todo']);
  });
  it('a draft: steps 2 to 6 not done', () => {
    expect(states('post-blog')).toEqual(['done', 'current', 'todo', 'todo', 'todo', 'todo']);
  });
  it('an edit after approval blocks the approved step (stale)', () => {
    expect(approvalState(post('post-stale'), '3.1')).toBe('stale');
    expect(states('post-stale')[1]).toBe('blocked');
  });
  it('a failed platform fails the published step; results ready finishes the strip', () => {
    expect(states('post-failed')[2]).toBe('failed');
    expect(states('post-unverified')[3]).toBe('current');
    expect(states('post-results')).toEqual(['done', 'done', 'done', 'done', 'done', 'done']);
  });
  it('a Brain change stales an unpublished approval, never a published one', () => {
    const approvedNotPublished = { ...post('post-stale'), text: 'Project context belongs in the repo. [Draft as approved]' };
    expect(approvalState(approvedNotPublished, '3.1')).toBe('valid');
    expect(approvalState(approvedNotPublished, '3.2')).toBe('stale');
    expect(approvalState(post('post-launch'), '3.2')).toBe('valid');
  });
});

describe('domain: gates ({ blocking, label })', () => {
  it('the claims gate and the slop pass block', () => {
    expect(checksGate({ slop: 'passed', claims: { backed: 1, total: 2 }, disclosure: 'n/a' })).toEqual({ blocking: true, label: '1 claim needs a source. Add one to approve.' });
    expect(checksGate({ slop: 'failed', claims: { backed: 0, total: 0 }, disclosure: 'n/a' }).blocking).toBe(true);
    expect(checksGate({ slop: 'passed', claims: { backed: 2, total: 2 }, disclosure: 'n/a' }).blocking).toBe(false);
  });
  it('a proposal judged against an older Brain is blocked until checked again', () => {
    const [p] = adnaProposals;
    expect(proposalGate(p, '3.1').blocking).toBe(false);
    expect(proposalGate(p, '3.2').blocking).toBe(true);
    expect(proposalGate({ ...p, brainVersion: '3.2' }, '3.2').blocking).toBe(false);
  });
  it('every queue kind has a gate', () => {
    const ctx = { brainVersion: '3.1', proposal: (id: string) => adnaProposals.find((p) => p.id === id), quest: () => undefined };
    const blocked = today.queue.filter((i) => gateFor(i, ctx).blocking).map((i) => i.id);
    expect(blocked).toEqual(['q-blog']);
  });
});

describe('domain: loop progress counts live steps, not a position', () => {
  it('after the first run Brand, Create and Verify are live: 3 of 6', () => {
    expect(loopProgressLabel(['live', 'live', 'not-started', 'current', 'not-started', 'not-started'])).toBe('3 of 6 steps live');
  });
  it('the current step counts as live; not-started steps do not', () => {
    expect(liveStepCount(['live', 'live', 'live', 'live', 'current', 'not-started'])).toBe(5);
    expect(liveStepCount(['not-started', 'not-started'])).toBe(0);
  });
});

describe('domain: one note per proposal status', () => {
  it('pending says what approval does, approved names its Brain version, rejected says so', () => {
    expect(proposalNote({ status: 'pending' }, '3.2')).toBe('becomes Brain v3.3 if you approve');
    expect(proposalNote({ status: 'trial' }, '3.2')).toBe('on trial for half of new drafts; becomes Brain v3.3 if you approve');
    expect(proposalNote({ status: 'approved', decided: { at: '13 Oct', version: '3.2' } }, '3.3')).toBe('active in Brain v3.2');
    expect(proposalNote({ status: 'rejected', decided: { at: '13 Oct' } }, '3.2')).toBe('rejected');
  });
});

describe('domain: quest slots are counted from payout records', () => {
  const quest = { id: 'q', task: 't', format: 'tutorial' as const, rewardUsdc: 50, slots: 3, paidSubmissionIds: ['s0'], due: null, opens: null, submissionIds: [] };
  const record = (submissionId: string, questId?: string) => ({ questId, submissionId, amount: 50, unit: 'USDC', at: '13 Oct' });
  it('a payout record keeps its slot used whatever the queue holds; seat payouts do not count', () => {
    expect(paidCount(questWithPayouts(quest, []))).toBe(1);
    expect(paidCount(questWithPayouts(quest, [record('s1', 'q'), record('seat')]))).toBe(2);
  });
  it('counts by identity: server data that already lists a session payout does not count it twice', () => {
    const refreshed = { ...quest, paidSubmissionIds: ['s0', 's1'] };
    const counted = questWithPayouts(refreshed, [record('s1', 'q')]);
    expect(paidCount(counted)).toBe(2);
    const ok = { blocking: false, label: 'ok' };
    expect(submissionGate(ok, { payout: { amount: 50, unit: 'USDC' } }, counted).blocking).toBe(false);
  });
});
