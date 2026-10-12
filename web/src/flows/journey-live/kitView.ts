import { gateFingerprint } from '../../screens/journey/derive';
import type { ApproveKitData, GapsVoiceData, JourneyGate } from '../../screens/journey/types';
import type { JourneyBrandState } from './contract';
import { factFromRow } from './views';
export function kitView(state: JourneyBrandState, voice: GapsVoiceData['voice'], approver: string): ApproveKitData {
  const ids = ['purpose', 'positioning', 'voice'] as const;
  const gates: JourneyGate[] = ids.map((id, i) => {
    const section = state.sections.find(s => s.section === id);
    const evidence = state.evidence.filter(e => section?.citations?.includes(e.id)).map(e => factFromRow(state, e));
    const gate: JourneyGate = { id, gate: (i + 1) as 1 | 2 | 3, title: id[0].toUpperCase() + id.slice(1), draft: section?.body || '', evidence, builtFrom: evidence.length ? `${evidence.length} cited facts and your answers` : 'Your answers; review before approving' };
    const approved = state.gates.find(g => g.gate === id);
    if (section?.status === 'approved' && approved) gate.approval = { decision: { status: 'approved', by: approved.approved_by, at: approved.approved_at, why: approved.note }, fingerprint: gateFingerprint(gate) };
    return gate;
  });
  return { approver, voice, gates, alsoDrafted: state.sections.filter(s => !ids.includes(s.section as typeof ids[number])).map(s => ({ label: s.section, value: s.status })), onChain: 'Brand ID, kit hash, version, approver ID and domain-verification flag. Kit words stay off chain.' };
}
