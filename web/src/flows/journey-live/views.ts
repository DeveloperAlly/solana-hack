import type { ConfirmData, JourneyFact, ReadData, SaveData } from '../../screens/journey/types';
import type { JourneyBrandState } from './contract';

/** A row-to-display adapter only. Coverage calculations remain authoritative on the server. */
export function factFromRow(state: JourneyBrandState, e: JourneyBrandState['evidence'][number]): JourneyFact {
  const source = state.sources.find(s => s.id === e.source_id);
  return { id: e.id, section: e.section, statement: e.claim, status: e.review_status === 'approved' ? 'found' : 'partly',
    ...(e.quote ? { quote: e.quote } : {}), ...(source ? { source: { label: source.title || source.url || 'Source', ...(source.url ? { url: source.url } : {}) } } : {}) };
}
export function readView(state: JourneyBrandState): ReadData {
  if (state.journey) return state.journey.read;
  const sections = state.coverage.sections;
  return { site: state.brand.website || state.brand.name,
    facts: state.evidence.filter(e => e.quote && e.review_status !== 'rejected').map(e => factFromRow(state, e)),
    sources: state.sources.map(s => ({ id: s.id, label: s.url || s.title || 'Source', status: s.status === 'read' ? 'read' : s.status === 'failed' ? 'blocked' : 'queued', ...(s.error ? { reason: s.error } : {}) })),
    coverage: { found: sections.filter(s => s.status === 'found').length, partly: sections.filter(s => s.status === 'partly').length, needsYou: sections.filter(s => s.status === 'needs-you').length, percent: Math.round(state.coverage.ratio * 100) } };
}
export function saveView(state: JourneyBrandState): SaveData {
  const read = readView(state);
  return { brandName: state.brand.name, summary: `${read.facts.length} facts from your sources. Save them to your account.`,
    saving: state.coverage.sections.map(s => ({ section: s.title, status: s.status })) };
}
export function confirmView(state: JourneyBrandState): ConfirmData {
  if (state.journey) return state.journey.confirm;
  return { facts: readView(state).facts, voice: { id: 'voice', section: 'Voice', status: 'needs-you', statement: 'Pick the voice that sounds like you next.' },
    missing: { id: 'missing', section: 'Kit', status: 'needs-you', statement: 'Review your answers and choose your voice next.' },
    readinessBase: Math.round(state.coverage.ratio * 100), questionsLeft: 2, timeLeft: 'Continue at your own pace', deferredNote: 'The six kit sections are reviewed before registration. Other brand tools remain available from your hub.' };
}
