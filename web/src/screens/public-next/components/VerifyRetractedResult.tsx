import { Text } from '../../../ui/primitives';
import { VerifyResultCard } from '../../../ui/domain/VerifyResultCard';
import { VerifyReceiptLink } from '../../../ui/domain/VerifyReceiptLink';
import { formatDateTime } from '../format';
import type { ApprovedPost } from '../types';

/** "Retracted by <brand>" (canvas Verify-5-Retracted): the record stays, the status changes. */
export function VerifyRetractedResult({ post }: { post: ApprovedPost }) {
  const retraction = post.retraction;
  return (
    <VerifyResultCard tone="retracted" title={`Retracted by ${post.brand.name}`}>
      <Text variant="small">
        Approved {formatDateTime(post.approvedAt)}, retracted {formatDateTime(retraction?.at ?? null)}. Reason: "{retraction?.reason ?? '[reason]'}".
      </Text>
      <Text variant="small" tone="secondary">
        Both the approval and the retraction are on the public record · <VerifyReceiptLink signature={retraction?.signature ?? null}>transactions</VerifyReceiptLink>
      </Text>
    </VerifyResultCard>
  );
}
