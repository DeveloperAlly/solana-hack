import styles from './EvidenceChip.module.css';

export type EvidenceStatus = 'found' | 'partly' | 'needs-you';

const labels: Record<EvidenceStatus, string> = { found: 'Found', partly: 'Partly found', 'needs-you': 'Needs you' };

/**
 * Evidence status chip (canvas J1-Read, J3-Confirm): Found (solid), Partly found (grey), Needs you (dashed).
 * The text carries the meaning; fill and border style only repeat it, so it reads the same in every theme.
 */
export function EvidenceChip({ status }: { status: EvidenceStatus }) {
  return <span className={`${styles.chip} ${styles[status]}`}>{labels[status]}</span>;
}

export const evidenceStatuses = Object.keys(labels) as EvidenceStatus[];
