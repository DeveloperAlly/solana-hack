import { useId } from 'react';
import { Button, Heading, Stack, Text } from '../primitives';
import { Card } from '../composites/Card';
import type { HeadingLevel } from '../primitives/Heading';

export interface SoonPlanTierProps {
  name: string;
  /** Price text; a bracketed placeholder until pricing is decided (G-BILLING). */
  price: string;
  features: string;
  cta: string;
  href: string;
  /** Called when the call to action is followed (records the choice). */
  onChoose?: () => void;
  /** Source note, e.g. a market band from research. */
  note?: string;
  /** The highlighted tier. */
  featured?: boolean;
  /** Heading level of the tier name (2 under a page title). */
  level?: HeadingLevel;
}

/** Pricing tier card (canvas Pricing): name, price, what is included, a call to action and an optional note. */
export function SoonPlanTier({ name, price, features, cta, href, note, onChoose, featured = false, level = 2 }: SoonPlanTierProps) {
  const id = useId();
  return (
    <Card as="section" labelledBy={id} variant={featured ? 'selected' : 'default'}>
      <Stack gap={3}>
        <Heading level={level} size="xl" id={id}>{name}</Heading>
        <Text variant="label">{price}</Text>
        <Text tone="secondary">{features}</Text>
        <Button href={href} onClick={onChoose} variant={featured ? 'primary' : 'secondary'}>{cta}</Button>
        {note && <Text variant="caption" tone="secondary">{note}</Text>}
      </Stack>
    </Card>
  );
}
