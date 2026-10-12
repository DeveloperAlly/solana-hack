import { Button } from '../primitives/Button';
import styles from './VerifyPagination.module.css';

export interface VerifyPaginationProps {
  /** Accessible name of the nav, e.g. "Ledger pages". */
  label: string;
  /** 1-based current page. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/**
 * Pager for long registration lists (inventory C20 LoadMore, as pages; used by the Ledger). Previous and Next are
 * disabled at the ends; the position is announced politely when it changes. Renders nothing for a single page.
 */
export function VerifyPagination({ label, page, pageCount, onChange }: VerifyPaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label={label} className={styles.pager}>
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className={styles.position} aria-live="polite">
        Page {page} of {pageCount}
      </span>
      <Button variant="secondary" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
