import { VerifyResultCard } from '../../../ui/domain/VerifyResultCard';
import { VerifyReceiptLink } from '../../../ui/domain/VerifyReceiptLink';
import { formatDateTime } from '../format';
import type { LookupKind, LookupRecord } from '../types';

const noun: Record<LookupKind, string> = { account: 'account', kit: 'kit version', claim: 'claim' };

export interface VerifyLookupResultProps {
  kind: LookupKind;
  record: LookupRecord | null;
}

/** Verify-4 result: "Official account of JamJam" with its registration, or a neutral not-found (as on Verify-2). */
export function VerifyLookupResult({ kind, record }: VerifyLookupResultProps) {
  if (!record) {
    return (
      <VerifyResultCard
        tone="nomatch"
        title={`No registered ${noun[kind]} matches`}
        summary="That doesn't prove it's fake. It means no brand on JamJam registered it. Check the brand's own channels."
      />
    );
  }
  return (
    <VerifyResultCard
      tone="match"
      title={record.title}
      summary={
        <>
          Registered by {record.brandName} on {formatDateTime(record.registeredAt)} · <VerifyReceiptLink signature={record.signature}>transaction</VerifyReceiptLink>
        </>
      }
    />
  );
}
