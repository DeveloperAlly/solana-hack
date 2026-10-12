import { useState } from 'react';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Link } from '../primitives/Link';
import { Text } from '../primitives/Text';
import { useRequiredNote } from '../hooks/useRequiredNote';
import styles from './BuilderApprovalItem.module.css';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface AmbassadorSubmission {
  id: string;
  /** "LinkedIn post", "Tutorial". */
  kind: string;
  author: string;
  /** "10 USDC". */
  amount: string;
  excerpt: string;
  /** Check chips, e.g. "On-brand 91%", "Verified on LinkedIn". */
  checks: string[];
  link: { label: string; href: string };
}

export interface BuilderApprovalItemProps {
  item: AmbassadorSubmission;
  defaultStatus?: ApprovalStatus;
}

const statusLabel: Record<ApprovalStatus, string> = { pending: 'Awaiting approval', approved: 'Approved · not paid yet', rejected: 'Rejected', paid: 'Paid' };

/**
 * D1 ApprovalItem (ambassador post): the piece, its checks and Approve / Reject / Pay. Approve and Pay are separate;
 * Pay is for the owner and runs once; Reject asks for a reason the ambassador sees. Canvas board Dashboard (note n-dash).
 */
export function BuilderApprovalItem({ item, defaultStatus = 'pending' }: BuilderApprovalItemProps) {
  const [status, setStatus] = useState<ApprovalStatus>(defaultStatus);
  const [rejectedFor, setRejectedFor] = useState('');
  const rejecting = useRequiredNote('Give a reason. The ambassador sees it.');
  // INTEGRATION: POST /api/submissions/:id/reject with the reason (backend map §4, row "Dashboard (and its empty state)").
  const reject = () => rejecting.submit((reason) => { setRejectedFor(reason); setStatus('rejected'); });

  return (
    <li className={styles.item}>
      <div className={styles.body}>
        <Text><strong>{item.kind}</strong> by {item.author} · {item.amount}</Text>
        <Text tone="secondary">&ldquo;{item.excerpt}&rdquo;</Text>
        <div className={styles.row}>
          {item.checks.map((c) => <Badge key={c}>{c}</Badge>)}
          <Link href={item.link.href}>{item.link.label}</Link>
        </div>
        <Text variant="small" role="status">{statusLabel[status]}{status === 'rejected' ? `: ${rejectedFor}` : ''}</Text>
        {rejecting.open && (
          <div className={styles.row}>
            <Field label={`Reason for rejecting ${item.author}'s ${item.kind}`} value={rejecting.text} onChange={(e: { target: { value: string } }) => rejecting.setText(e.target.value)} error={rejecting.error} />
            <Button onClick={reject}>Send rejection</Button>
            <Button variant="secondary" onClick={rejecting.cancel}>Cancel</Button>
          </div>
        )}
      </div>
      <div className={styles.row}>
        {/* INTEGRATION: POST /api/submissions/:id/approve; POST /api/submissions/:id/pay (owner only, idempotent). */}
        <Button onClick={() => setStatus('approved')} disabled={status !== 'pending'}>Approve</Button>
        <Button variant="secondary" onClick={rejecting.show} disabled={status !== 'pending' || rejecting.open}>Reject</Button>
        <Button variant="secondary" onClick={() => setStatus('paid')} disabled={status !== 'approved'}>Pay (owner only)</Button>
      </div>
    </li>
  );
}
