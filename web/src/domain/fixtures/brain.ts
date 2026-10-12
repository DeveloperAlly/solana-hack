// Sample Brain for the demo brand aDNA, from canvas v24 boards Brain, Post-Detail and Learn-Rules
// (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). People are bracketed; dial values the canvas does not give are
// bracketed. Shared by every page that reads the Brain (Create, Grow, Learn), so all of them agree.
import type { Brain } from '../brain';

export const OWNER = '[Founder name]';

export const adnaBrain: Brain = {
  brandName: 'aDNA',
  version: '3.1',
  kit: {
    version: 3,
    registered: true,
    sections: 17,
    factCount: 86,
    sources: 9,
    expiringFacts: 3,
    audience: 'Developers running coding agents on shared repos · team leads adopting agents · open-source maintainers',
  },
  voices: [
    { id: 'founder', name: 'Founder voice', version: 'v2', dials: 'candid 4, technical 3, playful 2' },
    { id: 'technical', name: 'Technical voice', version: 'v1', dials: '[dials]' },
    { id: 'replies', name: 'Replies voice', version: 'v1', dials: '[dials]' },
    { id: 'community', name: 'Community voice', version: 'v1', dials: '[dials]' },
  ],
  facts: [
    { id: 'f-folder', quote: 'Every agent reads the folder first.', source: { kind: 'page', label: 'adna.network/docs', at: '3 Oct' } },
    { id: 'f-context', quote: "Context lives in the repo, not in people's heads.", source: { kind: 'owner-answer', label: 'Owner answer', at: '2 Oct' } },
  ],
  rules: [
    { id: 'r-problem-x', text: 'Open X threads with the problem, not the product', appliesTo: 'Create · X', origin: 'learn', status: 'suggested', evidence: [{ kind: 'posts', label: '14 posts' }] },
    { id: 'r-recaps', text: 'Post event recaps within 24 hours', appliesTo: 'Grow · events', origin: 'learn', status: 'suggested', evidence: [{ kind: 'events', label: '3 events' }] },
    { id: 'r-lead', text: 'Lead with the problem', appliesTo: 'All voices', origin: 'learn', status: 'active', evidence: [{ kind: 'posts', label: 'Learn' }], decided: { by: OWNER, at: '10 Oct' } },
    { id: 'r-user-count', text: 'Never claim a user count without a source', appliesTo: 'Claims gate', origin: 'kit', status: 'active', evidence: [{ kind: 'kit-gate', label: 'Kit v1 gate' }] },
    { id: 'r-agent-context', text: 'Use "agent context", not "AI memory"', appliesTo: 'All voices', origin: 'owner', status: 'active', evidence: [{ kind: 'edit', label: 'Your edit, 4 Oct' }] },
    { id: 'r-no-hype', text: 'No "revolutionary", no "game-changer"', appliesTo: 'All voices', origin: 'kit', status: 'active', evidence: [{ kind: 'kit-gate', label: 'Kit v1 voice gate' }] },
  ],
  history: [
    { version: '3.1', summary: `Rule "Lead with the problem" approved by ${OWNER}`, at: '10 Oct' },
    { version: '3', summary: 'Kit re-registered after voice edit', at: '6 Oct' },
    { version: '2', summary: 'Gate 3 approved', at: '3 Oct' },
  ],
};

/** The same brand on its first run: the kit only, no learned rules yet (canvas Brain note: first run). */
export const adnaBrainFirstRun: Brain = {
  ...adnaBrain,
  version: '1',
  kit: { ...adnaBrain.kit, version: 1 },
  rules: adnaBrain.rules.filter((r) => r.origin !== 'learn'),
  history: [{ version: '1', summary: 'Kit v1 approved and registered', at: '[date]' }],
};
