import type { ReactNode } from 'react';
import { Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import type { ReferralOffer } from '../types';

/** The referral offer ("You both get 2 months free") with its source; Referral and Referral-Landing share it. */
export function GrowthOfferCard({ offer, actions }: { offer: ReferralOffer; actions?: ReactNode }) {
  return (
    <Card variant="selected" as="div">
      <Stack gap={2}>
        <Heading level={2} size="xl">{offer.headline}</Heading>
        <Text>{offer.detail}</Text>
        <Text variant="small" tone="secondary">Source: {offer.source}.</Text>
        {actions}
      </Stack>
    </Card>
  );
}
