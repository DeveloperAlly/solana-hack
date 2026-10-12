import { Text } from '../../../ui/primitives';
import { KeyValueList } from '../../../ui/composites/KeyValueList';
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
      {/* The registration is the SAS transaction from registerPost (web/worker/posts.ts); approval has no transaction. */}
      <Text variant="small" tone="secondary">
        The registration stays on the public record; the retraction changes its status.
      </Text>
      <KeyValueList
        label="Transactions"
        items={[
          { label: 'Registered', value: <VerifyReceiptLink signature={post.signature}>Registration transaction</VerifyReceiptLink> },
          // INTEGRATION: the retraction endpoint is not built (no retraction in web/worker); its transaction comes from it.
          { label: 'Retraction', value: <VerifyReceiptLink signature={retraction?.signature ?? null}>Retraction transaction</VerifyReceiptLink> },
        ]}
      />
    </VerifyResultCard>
  );
}
