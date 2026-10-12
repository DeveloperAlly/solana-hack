// derive.ts (issue #48): later screens follow earlier choices, and J6's badges and its gate agree.
import { describe, expect, it } from 'vitest';
import { draftClaims, evidenceView, gateView, hubView, postChecks } from './derive';
import type { JourneySelections } from './useJourneyFlow';
import { facts } from './journey.fixtures';
import { firstPostFixture } from './J6-First-Post.fixtures';
import { approveKitFixture } from './J5-Approve-Kit.fixtures';
import { hubFirstRunFixture } from './J8-Hub-FirstRun.fixtures';

const base: JourneySelections = {
  site: '', signIn: 'email', emailSentTo: '', facts: {}, alternatives: [], customAlternatives: [], answers: {},
  voice: { mode: 'picks', round: 1, picks: {} }, gateDrafts: {}, gateApprovals: {},
};
const sel = (patch: Partial<JourneySelections>): JourneySelections => ({ ...base, ...patch });
const linkedin = firstPostFixture.channels[0];

describe('evidenceView', () => {
  it('drops a rejected fact, uses an edit, and leaves an untouched fact as it is', () => {
    expect(evidenceView(facts.purpose, sel({ facts: { purpose: { decision: 'rejected' } } }))).toBeNull();
    expect(evidenceView(facts.purpose, sel({ facts: { purpose: { decision: 'edited', edit: 'New words' } } }))?.statement).toBe('New words');
    expect(evidenceView(facts.purpose, base)).toBe(facts.purpose);
  });
});

describe('postChecks: the badges and the Approve gate come from one function', () => {
  const claims = draftClaims(linkedin, firstPostFixture.claims, base);
  it('is ready when the slop pass and every claim pass', () => {
    const r = postChecks(firstPostFixture.checks, claims);
    expect(r.ready).toBe(true);
    expect(r.rows.map((x) => x.value).slice(0, 2)).toEqual(['Passed', 'Passed']);
  });
  it('blocks, and says Blocked, when the slop pass fails', () => {
    const r = postChecks({ ...firstPostFixture.checks, slop: { label: 'No-AI-slop pass', passed: false } }, claims);
    expect(r.ready).toBe(false);
    expect(r.rows[0]).toMatchObject({ value: 'Blocked', solid: false });
  });
  it('blocks, and says Blocked, when a claim lost its evidence on J3', () => {
    const r = postChecks(firstPostFixture.checks, draftClaims(linkedin, firstPostFixture.claims, sel({ facts: { purpose: { decision: 'rejected' } } })));
    expect(r.ready).toBe(false);
    expect(r.rows[1]).toMatchObject({ label: 'Claims: 1 of 2 backed', value: 'Blocked' });
  });
  it('never blocks on voice fit, which is shown only', () => {
    expect(postChecks(firstPostFixture.checks, claims).rows[2]).toBe(firstPostFixture.checks.voiceFit);
  });
});

describe('gateView', () => {
  const positioning = approveKitFixture.gates[1];
  it('keeps placeholders until J4 is answered, then fills them', () => {
    expect(gateView(positioning, base, approveKitFixture.voice).draft).toContain('Unlike [alternative], [edge].');
    expect(gateView(positioning, sel({ alternatives: ['Canva Brand Kit'], answers: { edge: 'Reads first' } }), approveKitFixture.voice).draft).toContain('Unlike Canva Brand Kit, Reads first.');
  });
  it('lets an edit made on J5 win', () => {
    expect(gateView(positioning, sel({ gateDrafts: { positioning: 'Mine' } }), approveKitFixture.voice).draft).toBe('Mine');
  });
});

describe('hubView', () => {
  it('shows the fixture by default, and an unregistered kit after a failed registration', () => {
    expect(hubView(hubFirstRunFixture, base).status).toBe('Kit v1 registered · first post official · readiness 72%');
    const v = hubView(hubFirstRunFixture, sel({ kitRegistered: false }));
    expect(v.status).toBe('Kit v1 approved, not registered · no post yet · readiness 72%');
    expect(v.checklist.find((i) => i.id === 'kit')).toMatchObject({ done: false, label: 'Register kit v1' });
  });
});
