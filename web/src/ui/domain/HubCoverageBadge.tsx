import { EvidenceChip, type EvidenceStatus } from './EvidenceChip';

export type CoverageStatus = 'evidenced' | 'inferred' | 'missing';

const meta: Record<CoverageStatus, { letter: string; word: string; chip: EvidenceStatus }> = {
  evidenced: { letter: 'E', word: 'Evidenced', chip: 'found' },
  inferred: { letter: 'I', word: 'Inferred', chip: 'partly' },
  missing: { letter: 'M', word: 'Missing', chip: 'needs-you' },
};

export const coverageStatuses = Object.keys(meta) as CoverageStatus[];

/** The word for a status, for legends and counts. */
export function coverageWord(status: CoverageStatus): string {
  return meta[status].word;
}

export interface HubCoverageBadgeProps {
  status: CoverageStatus;
  /** Shows the word next to the letter (section headers); otherwise the word is for screen readers only (TOC). */
  showWord?: boolean;
}

/**
 * D51 CoverageBadge: E / I / M (Evidenced, Inferred, Missing) on kit sections (canvas Brand-Build, Coverage-Map).
 * Solid, grey and dashed come from EvidenceChip, so the two status chips stay one style; it needs no stylesheet.
 */
export function HubCoverageBadge({ status, showWord = false }: HubCoverageBadgeProps) {
  const m = meta[status];
  return (
    <EvidenceChip status={m.chip}>
      <span aria-hidden="true">{m.letter}</span>
      <span className={showWord ? undefined : 'wl-visually-hidden'}>{showWord ? ` ${m.word}` : m.word}</span>
    </EvidenceChip>
  );
}
