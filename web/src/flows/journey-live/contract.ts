import type { ConfirmData, GapsVoiceData, ReadData } from '../../screens/journey/types';

/** Persisted API rows for compatibility with the current release; authoritative journey views take precedence. */
export interface JourneyBrandState {
  brand: { id: string; owner_id?: string; name: string; website: string | null };
  evidence: { id: string; section: string; claim: string; quote: string | null; source_id: string | null; review_status?: string; owner_decision?: string; edited_from?: string }[];
  sources: { id: string; url: string | null; title: string | null; status: string; error?: string | null }[];
  answers: { step: string; data: Record<string, string>; skipped?: boolean }[];
  sections: { section: string; body: string; status: string; citations?: string[] }[];
  gates: { gate: string; approved_by: string; approved_at: string; note?: string }[];
  kits: { id: string; version: number; status: string; hash: string; signature?: string; error?: string; created_at?: string }[];
  coverage: { sections: { section: string; title: string; status: 'found' | 'partly' | 'needs-you' }[]; ratio: number };
  journey?: {
    read: ReadData;
    confirm: ConfirmData & { conflicts?: { question: import('../../screens/journey/types').JourneyFact; sides: import('../../screens/journey/types').JourneyFact[] }[] };
    gapsVoice: Omit<GapsVoiceData, 'voice'> & { questions?: { id: string; question: string; optional: boolean; kind: string; step?: string; field?: string; sections: string[] }[] };
  };
}
