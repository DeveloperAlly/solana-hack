import type { ReactNode } from 'react';
import { Link, Stack, Text } from '../../../ui/primitives';
import { KeyValueList } from '../../../ui/composites/KeyValueList';
import { VerifyReceiptLink } from '../../../ui/domain/VerifyReceiptLink';
import { VerifyResultCard } from '../../../ui/domain/VerifyResultCard';
import { formatDateTime } from '../format';
import { useVerifyLinks } from '../paths';
import type { ApprovedPost } from '../types';

/** "LinkedIn · 5 Oct 2026, 16:21 · Open post"; unknown parts stay bracketed. */
function publishedValue(published: ApprovedPost['published']): ReactNode {
  if (!published) return '[where published]';
  const link = published.url ? <Link href={published.url} external>Open post</Link> : '[post link]';
  return <>{published.platform} · {formatDateTime(published.at)} · {link}</>;
}

/** "Brand-approved: yes" (canvas Verify-1-Match; note n-v1: brand, kit version, approver, where it was published). */
export function VerifyMatchResult({ post }: { post: ApprovedPost }) {
  const { brand } = post;
  const links = useVerifyLinks();
  // Unverified brands show the name as self-declared (canvas note n-ob2).
  const domain = brand.domainVerified ? `${brand.domain} verified` : `${brand.domain} · self-declared`;
  const where = publishedValue(post.published);
  return (
    <VerifyResultCard tone="match" title="Brand-approved: yes" summary={`Exact match to a post ${brand.name} approved and registered on Solana.`}>
      <KeyValueList
        label="Registration"
        items={[
          { label: 'Brand', value: `${brand.name} · ${domain}` },
          { label: 'Kit', value: `v${post.kitVersion}` },
          { label: 'Approved by', value: `${brand.name} · ${post.approver} · ${formatDateTime(post.approvedAt)}` },
          { label: 'Published', value: where },
          { label: 'Receipt', value: <VerifyReceiptLink signature={post.signature}>Registration transaction</VerifyReceiptLink> },
        ]}
      />
      <Stack gap={1}>
        <Text variant="small" tone="secondary">For an ambassador post, the result also shows the ambassador, the campaign and the payout receipt.</Text>
        <Text variant="small" tone="secondary">
          Match type: exact fingerprint. <Link href={links.ledger(brand.id)}>See {brand.name}'s public ledger</Link>
        </Text>
      </Stack>
    </VerifyResultCard>
  );
}
