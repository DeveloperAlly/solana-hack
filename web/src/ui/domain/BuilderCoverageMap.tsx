import { Badge } from '../primitives/Badge';
import { BuilderCoverageBadge, type CoverageState } from './BuilderCoverageBadge';
import styles from './BuilderCoverageMap.module.css';

export interface CoverageCell {
  state: CoverageState;
  /** What the builder will do, e.g. "Confirm draft", "Ask: step 2". */
  action: string;
}

export interface CoverageRow {
  section: string;
  /** Gate marker, e.g. "Gate 1". */
  gate?: string;
  /** One cell per brand, in brand order. */
  cells: CoverageCell[];
}

export interface BuilderCoverageMapProps {
  caption: string;
  /** Brands compared side by side (the compare variant has two). */
  brands: string[];
  rows: CoverageRow[];
}

const states: CoverageState[] = ['E', 'I', 'M'];

/** "E 0 · I 2 · M 15": totals are counted from the rows, never typed in. */
export function coverageTotals(rows: CoverageRow[], brandIndex: number): string {
  return states.map((s) => `${s} ${rows.filter((r) => r.cells[brandIndex]?.state === s).length}`).join(' · ');
}

/**
 * D13 CoverageMap (compare variant): the kit sections down the side, each brand's E / I / M state and what the builder
 * will do, with totals per brand. Canvas board Coverage-Map (note n-cov).
 */
export function BuilderCoverageMap({ caption, brands, rows }: BuilderCoverageMapProps) {
  return (
    <div className={styles.scroll} tabIndex={0} role="region" aria-label={caption}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Section</th>
            {brands.map((b) => [<th key={b} scope="col">{b}</th>, <th key={`${b}-do`} scope="col">The builder will</th>])}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.section}>
              <td>{i + 1}</td>
              <th scope="row" className={styles.section}>{r.section} {r.gate && <Badge>{r.gate}</Badge>}</th>
              {r.cells.map((c, j) => [
                <td key={`${j}-s`}><BuilderCoverageBadge state={c.state} /></td>,
                <td key={`${j}-a`} className={j > 0 ? styles.muted : undefined}>{c.action}</td>,
              ])}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <th scope="row">Totals</th>
            {brands.map((b, j) => <td key={b} colSpan={2}>{coverageTotals(rows, j)}</td>)}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
