import { EvidenceChip, type EvidenceStatus } from './EvidenceChip';
import styles from './CoverageBadge.module.css';

export type CoverageStatus = 'evidenced' | 'inferred' | 'missing';

/** Letter, word, legend detail and chip style per status (canvas Coverage-Map legend). */
export const coverageMeta: Record<CoverageStatus, { letter: 'E' | 'I' | 'M'; word: string; detail: string; chip: EvidenceStatus }> = {
  evidenced: { letter: 'E', word: 'Evidenced', detail: 'found in a source, cited', chip: 'found' },
  inferred: { letter: 'I', word: 'Inferred', detail: 'drafted from sources, you confirm', chip: 'partly' },
  missing: { letter: 'M', word: 'Missing', detail: 'we ask you', chip: 'needs-you' },
};

export const coverageStatuses = Object.keys(coverageMeta) as CoverageStatus[];

/** The word for a status, for legends and counts. */
export function coverageWord(status: CoverageStatus): string {
  return coverageMeta[status].word;
}

/**
 * `letter`: the letter only; the word is for screen readers (TOC, map cells). `word`: letter and word (section headers).
 * `legend`: letter chip, then "Word: what it means" as text beside it (the Coverage-Map legend).
 */
export type CoverageDisplay = 'letter' | 'word' | 'legend';

export interface CoverageBadgeProps {
  status: CoverageStatus;
  display?: CoverageDisplay;
}

/**
 * D51 CoverageBadge: E / I / M (Evidenced, Inferred, Missing) on kit sections (canvas Brand-Build, Coverage-Map).
 * Solid, grey and dashed come from D57 EvidenceChip, so the two status chips stay one style and one set of tokens.
 * Replaces BuilderCoverageBadge and HubCoverageBadge (issue #46, shared consolidation).
 */
export function CoverageBadge({ status, display = 'letter' }: CoverageBadgeProps) {
  const m = coverageMeta[status];
  if (display === 'legend') {
    return (
      <span className={styles.legend}>
        <EvidenceChip status={m.chip}><span aria-hidden="true">{m.letter}</span></EvidenceChip>
        <span>{m.word}: {m.detail}</span>
      </span>
    );
  }
  return (
    <EvidenceChip status={m.chip}>
      <span aria-hidden="true">{m.letter}</span>
      <span className={display === 'word' ? styles.word : 'wl-visually-hidden'}>{m.word}</span>
    </EvidenceChip>
  );
}
