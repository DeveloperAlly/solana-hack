import type { ReactNode } from 'react';
import { Badge, Heading, Link, Stack, Text } from '../../../ui/primitives';

export interface PageTitleProps {
  title: string;
  /** Line above the title ("aDNA launch week · LinkedIn post · 10 USDC"). */
  context?: string;
  /** Back link above everything ("← All campaigns"). */
  back?: { href: string; label: string };
  chips?: string[];
  /** Controls on the right of the title (the Sort select). */
  aside?: ReactNode;
  children?: ReactNode;
}

/** The Ambassador page header: optional back link, context line, h1, chips and a right-hand slot (canvas Amb-* headers). */
export function PageTitle({ title, context, back, chips = [], aside, children }: PageTitleProps) {
  return (
    <Stack gap={3}>
      {back && <Text variant="small"><Link href={back.href}>← {back.label}</Link></Text>}
      <Stack direction="row" gap={4} align="end" justify="between" wrap>
        <Stack gap={1}>
          {context && <Text tone="secondary">{context}</Text>}
          <Heading level={1} size="2xl">{title}</Heading>
          {children}
        </Stack>
        {aside}
      </Stack>
      {chips.length > 0 && (
        <Stack as="ul" direction="row" gap={2} wrap aria-label="Status">
          {chips.map((c) => <li key={c}><Badge>{c}</Badge></li>)}
        </Stack>
      )}
    </Stack>
  );
}
