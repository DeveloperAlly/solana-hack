import { useId, type ReactNode } from 'react';
import { Badge, Heading, Stack } from '../../ui/primitives';

export interface BuilderSectionProps {
  title: string;
  /** Chip beside the heading, e.g. "AI drafts · pick one". */
  badge?: string;
  /** Link or button at the end of the heading row, e.g. "+ New" or "Full ledger". */
  action?: ReactNode;
  children?: ReactNode;
}

/** A named section (canvas BB-4 options, BB-5 personas, Dashboard modules): heading, optional chip and action, then content. */
export function BuilderSection({ title, badge, action, children }: BuilderSectionProps) {
  const id = useId();
  return (
    <Stack as="section" gap={4} aria-labelledby={id}>
      <Stack direction="row" gap={3} align="center" justify={action ? 'between' : 'start'} wrap>
        <Stack direction="row" gap={3} align="center" wrap>
          <Heading level={2} size="xl" id={id}>{title}</Heading>
          {badge && <Badge>{badge}</Badge>}
        </Stack>
        {action}
      </Stack>
      {children}
    </Stack>
  );
}
