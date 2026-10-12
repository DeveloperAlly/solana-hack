import type { ReactNode } from 'react';
import styles from './EvidenceChip.module.css';

export type EvidenceStatus = 'found' | 'partly' | 'needs-you';

const labels: Record<EvidenceStatus, string> = { found: 'Found', partly: 'Partly found', 'needs-you': 'Needs you' };

/**
 * Evidence status chip (canvas J1-Read, J3-Confirm): Found (solid), Partly found (grey), Needs you (dashed).
 * The text carries the meaning; fill and border style only repeat it, so it reads the same in every theme.
 */
// children (optional, issue #52): replaces the label, e.g. the E / I / M letters of D51 CoverageBadge, same styles.
export function EvidenceChip({ status, children }: { status: EvidenceStatus; children?: ReactNode }) {
  return <span className={`${styles.chip} ${styles[status]}`}>{children ?? labels[status]}</span>;
}

export const evidenceStatuses = Object.keys(labels) as EvidenceStatus[];
