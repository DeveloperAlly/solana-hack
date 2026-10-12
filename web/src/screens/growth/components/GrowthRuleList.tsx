import { useId } from 'react';
import type { PostingRule } from '../../../config/platforms';
import { Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { GrowthSourceNote } from './GrowthSourceNote';

/** A platform's posting rules, each with its source; a rule with no official source stays bracketed. */
export function GrowthRuleList({ rules }: { rules: PostingRule[] }) {
  const headingId = useId();
  return (
    <Card labelledBy={headingId} header={<Heading level={2} size="lg" id={headingId}>Posting rules</Heading>}>
      <Stack as="ul" gap={3}>
        {rules.map((r) => (
          <li key={r.text}>
            <Text>{r.text}</Text>
            <Text variant="small" tone="secondary">
              {r.source ? <GrowthSourceNote source={r.source} /> : 'No official source checked yet, so this stays bracketed.'}
            </Text>
          </li>
        ))}
      </Stack>
    </Card>
  );
}
