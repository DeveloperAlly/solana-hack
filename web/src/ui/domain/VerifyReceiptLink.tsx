import { Link } from '../primitives/Link';
import { explorerTxUrl } from '../../lib/explorer';
import styles from './VerifyReceiptLink.module.css';

export interface VerifyReceiptLinkProps {
  /** Transaction signature; null while it is not known (pending, or bracketed sample data). */
  signature: string | null;
  /** Link text; the raw signature is never shown by default (inventory D32). */
  children?: string;
  /** Shown in place of the link while there is no signature. */
  placeholder?: string;
}

/** D32 ReceiptLink: opens the registration on Solana Explorer (devnet), or shows a bracketed placeholder while pending. */
export function VerifyReceiptLink({ signature, children = 'transaction', placeholder = '[tx]' }: VerifyReceiptLinkProps) {
  if (!signature) return <span className={styles.pending}>{placeholder}</span>;
  return (
    <Link href={explorerTxUrl(signature)} external>
      {children}
    </Link>
  );
}
