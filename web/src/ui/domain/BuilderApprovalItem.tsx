import { useState } from 'react';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Link } from '../primitives/Link';
import { Text } from '../primitives/Text';
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
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  function reject() {
    if (!reason.trim()) return setReasonError('Give a reason. The ambassador sees it.');
    // INTEGRATION: POST /api/submissions/:id/reject (backend map §4, row "Dashboard (and its empty state)").
    setStatus('rejected');
    setRejecting(false);
  }

  return (
    <li className={styles.item}>
      <div className={styles.body}>
        <Text><strong>{item.kind}</strong> by {item.author} · {item.amount}</Text>
        <Text tone="secondary">&ldquo;{item.excerpt}&rdquo;</Text>
        <div className={styles.row}>
          {item.checks.map((c) => <Badge key={c}>{c}</Badge>)}
          <Link href={item.link.href}>{item.link.label}</Link>
        </div>
        <Text variant="small" role="status">{statusLabel[status]}{status === 'rejected' ? `: ${reason}` : ''}</Text>
        {rejecting && (
          <div className={styles.row}>
            <Field label={`Reason for rejecting ${item.author}'s ${item.kind}`} value={reason} onChange={(e: { target: { value: string } }) => setReason(e.target.value)} error={reasonError} />
            <Button onClick={reject}>Send rejection</Button>
            <Button variant="secondary" onClick={() => setRejecting(false)}>Cancel</Button>
          </div>
        )}
      </div>
      <div className={styles.row}>
        {/* INTEGRATION: POST /api/submissions/:id/approve; POST /api/submissions/:id/pay (owner only, idempotent). */}
        <Button onClick={() => setStatus('approved')} disabled={status !== 'pending'}>Approve</Button>
        <Button variant="secondary" onClick={() => setRejecting(true)} disabled={status !== 'pending' || rejecting}>Reject</Button>
        <Button variant="secondary" onClick={() => setStatus('paid')} disabled={status !== 'approved'}>Pay (owner only)</Button>
      </div>
    </li>
  );
}
