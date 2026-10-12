// Sample data for Brand-Build (issue #52). Source: wireframe canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
// board Brand-Build, note n-bb (text as drawn; all aDNA content stays bracketed until real sources are read, n-bb 6).
// Backend map row "Brand-Build" (.agentic/what/context/backend_map.md §4 Brand Builder). Kit version, date,
// approver and hash are placeholders.
import type { BrandBuildData, KitSection } from './types';

const missing = (id: string, num: number, title: string): KitSection => ({ id, num, title, status: 'missing' });

export const brandBuild: BrandBuildData = {
  brand: 'aDNA',
  intro: '17 sections. Today JamJam drafts 6 (origin, purpose, positioning, audience, voice, messaging); the other 11 are coming soon. Every fact shows where it came from. Drafted content waits for your confirmation.',
  kit: { version: 'v[n]', approved: '[date]', approver: '[approver]', hash: '[sha256 of kit v[n]]' },
  sections: [
    { id: 's1', num: 1, title: 'Identity', status: 'evidenced', body: '[aDNA one-line description]', source: '[aDNA repo README]' },
    { id: 's2', num: 2, title: 'Purpose', gate: 'Gate 1', status: 'evidenced', body: '[aDNA purpose statement]', source: '[aDNA docs: intro]' },
    { id: 's3', num: 3, title: 'Beliefs / POV', status: 'evidenced', body: '[Belief 1] · [Belief 2]', source: '[aDNA docs: principles]' },
    missing('s4', 4, 'Values'),
    { id: 's5', num: 5, title: 'Positioning', gate: 'Gate 2', status: 'inferred', body: '[Positioning statement drafted from docs]', source: '[aDNA docs; owner to confirm]' },
    { id: 's6', num: 6, title: 'Value props', status: 'evidenced', body: '[Value prop 1] · [Value prop 2]', source: '[aDNA docs: features]' },
    {
      id: 's7', num: 7, title: 'Audience', status: 'evidenced', body: '[Audience segment]', source: "[aDNA docs: who it's for]",
      personas: [{ name: '[Persona 1]', detail: '[job, pain, channel]' }, { name: '[Persona 2]', detail: '[job, pain, channel]' }],
    },
    { id: 's8', num: 8, title: 'Messaging', status: 'evidenced', body: '[Key message]', source: '[aDNA X account: pinned post]' },
    { id: 's9', num: 9, title: 'Voice attributes', gate: 'Gate 3', status: 'inferred', body: '[Voice attributes drafted from posts]', source: '[aDNA X account: recent posts]' },
    missing('s10', 10, 'Tone presets'),
    { id: 's11', num: 11, title: 'Vocabulary', status: 'evidenced', body: '[Preferred terms] · [Terms to avoid]', source: '[aDNA docs: glossary]' },
    { id: 's12', num: 12, title: 'Claims', status: 'evidenced', body: '[n] claims, see Claims', source: '[Claims table]' },
    missing('s13', 13, 'Visual kit'),
    missing('s14', 14, 'Audio kit'),
    missing('s15', 15, 'Behaviour'),
    { id: 's16', num: 16, title: 'Examples', status: 'inferred', body: '[3 example posts picked from history]', source: '[aDNA X account]' },
    missing('s17', 17, 'Governance'),
  ],
};

/** Empty state (n-bb STATES): every section Missing, nothing drafted yet. */
export const brandBuildEmpty: BrandBuildData = {
  ...brandBuild,
  sections: brandBuild.sections.map((s) => ({ id: s.id, num: s.num, title: s.title, gate: s.gate, status: 'missing' })),
};
