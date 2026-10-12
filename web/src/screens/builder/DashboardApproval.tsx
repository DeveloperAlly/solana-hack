import { useState } from 'react';
import { Badge, Button, Field, Link, Stack } from '../../ui/primitives';
import { ApprovalItem } from '../../ui/domain/ApprovalItem';
import { useRequiredNote } from '../../ui/hooks/useRequiredNote';
import type { AmbassadorSubmission, ApprovalStatus } from './types';

/** What each status says and which actions it allows; the status line and the buttons both read this one table. */
export const approvalView: Record<ApprovalStatus, { label: string; approve: boolean; reject: boolean; pay: boolean }> = {
  pending: { label: 'Awaiting approval', approve: true, reject: true, pay: false },
  approved: { label: 'Approved · not paid yet', approve: false, reject: false, pay: true },
  rejected: { label: 'Rejected', approve: false, reject: false, pay: false },
  paid: { label: 'Paid', approve: false, reject: false, pay: false },
};

export interface DashboardApprovalProps {
  item: AmbassadorSubmission;
  defaultStatus?: ApprovalStatus;
}

/**
 * An ambassador submission on the Dashboard (canvas board Dashboard, note n-dash), drawn by the shared D1 ApprovalItem.
 * The page keeps the state: Approve and Pay are separate, Pay is for the owner and runs once, Reject asks for a reason
 * the ambassador sees (one form object, so Cancel clears it).
 */
export function DashboardApproval({ item, defaultStatus = 'pending' }: DashboardApprovalProps) {
  const [status, setStatus] = useState<ApprovalStatus>(defaultStatus);
  const [rejectedFor, setRejectedFor] = useState('');
  const rejecting = useRequiredNote('Give a reason. The ambassador sees it.');
  const view = approvalView[status];
  // INTEGRATION: POST /api/submissions/:id/reject with the reason (backend map §4, row "Dashboard (and its empty state)").
  const reject = () => rejecting.submit((reason) => { setRejectedFor(reason); setStatus('rejected'); });
  return (
    <ApprovalItem
      surface="row"
      meta={<><strong>{item.kind}</strong> by {item.author} · {item.amount}</>}
      draft={<>&ldquo;{item.excerpt}&rdquo;</>}
      checks={<>{item.checks.map((c) => <Badge key={c}>{c}</Badge>)}<Link href={item.link.href}>{item.link.label}</Link></>}
      status={`${view.label}${status === 'rejected' ? `: ${rejectedFor}` : ''}`}
      actions={
        <>
          {/* INTEGRATION: POST /api/submissions/:id/approve; POST /api/submissions/:id/pay (owner only, idempotent). */}
          <Button onClick={() => setStatus('approved')} disabled={!view.approve}>Approve</Button>
          <Button variant="secondary" onClick={rejecting.show} disabled={!view.reject || rejecting.open}>Reject</Button>
          <Button variant="secondary" onClick={() => setStatus('paid')} disabled={!view.pay}>Pay (owner only)</Button>
        </>
      }
    >
      {rejecting.open && (
        <Stack direction="row" gap={2} wrap align="end">
          <Field label={`Reason for rejecting ${item.author}'s ${item.kind}`} value={rejecting.text} onChange={(e: { target: { value: string } }) => rejecting.setText(e.target.value)} error={rejecting.error} />
          <Button onClick={reject}>Send rejection</Button>
          <Button variant="secondary" onClick={rejecting.cancel}>Cancel</Button>
        </Stack>
      )}
    </ApprovalItem>
  );
}
