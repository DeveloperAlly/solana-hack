import styles from './BuilderCoverageBadge.module.css';

export type CoverageState = 'E' | 'I' | 'M';

export const coverageMeaning: Record<CoverageState, { name: string; detail: string }> = {
  E: { name: 'Evidenced', detail: 'found in a source, cited' },
  I: { name: 'Inferred', detail: 'drafted from sources, you confirm' },
  M: { name: 'Missing', detail: 'we ask you' },
};

/**
 * D51 CoverageBadge: E / I / M as solid, grey and dashed letters, with the full word for assistive tech; `withDetail`
 * adds the meaning (legend form). Canvas board Coverage-Map.
 */
export function BuilderCoverageBadge({ state, withDetail = false }: { state: CoverageState; withDetail?: boolean }) {
  const m = coverageMeaning[state];
  return (
    <span className={styles.item}>
      <span className={`${styles.badge} ${styles[state]}`} aria-hidden="true">{state}</span>
      {withDetail ? <span>{m.name}: {m.detail}</span> : <span className="wl-visually-hidden">{m.name}</span>}
    </span>
  );
}
