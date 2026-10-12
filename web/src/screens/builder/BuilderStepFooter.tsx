import { useId, type ReactNode } from 'react';
import { Button, Link, Stack, Text } from '../../ui/primitives';

export interface StepNext {
  label: string;
  /** Where the step goes; leave out and pass onClick for a step that checks its input first. */
  href?: string;
  onClick?: () => void;
  /**
   * Why the step cannot move on yet (drafting still running, nothing chosen, gates open). When set, the primary action
   * is disabled and this reason is shown and tied to it with aria-describedby. Every step's primary goes through here,
   * so the rule lives in one place.
   */
  blockedReason?: string | null;
}

export interface BuilderStepFooterProps {
  back?: string;
  backLabel?: string;
  /** Where the quiet skip link goes; the link reads skipLabel. */
  skip?: string;
  skipLabel?: string;
  /** The step's primary action. */
  next?: StepNext;
  /** Other actions, before the primary. */
  children?: ReactNode;
}

/** Wizard footer used by every Brand Builder step (canvas ".foot"): Back, a skip link, other actions, then the primary. */
export function BuilderStepFooter({ back, backLabel = 'Back', skip, skipLabel = 'Skip for now', next, children }: BuilderStepFooterProps) {
  const reasonId = useId();
  const blocked = Boolean(next?.blockedReason);
  return (
    <>
      {back ? <Button href={back} variant="secondary">{backLabel}</Button> : <span />}
      <Stack direction="row" gap={4} align="center" wrap>
        {skip && <Link href={skip}>{skipLabel}</Link>}
        {children}
        {blocked && <Text as="span" variant="small" tone="secondary" id={reasonId}>{next?.blockedReason}</Text>}
        {next && (blocked || !next.href
          ? <Button onClick={next.onClick} disabled={blocked} aria-describedby={blocked ? reasonId : undefined}>{next.label}</Button>
          : <Button href={next.href} onClick={next.onClick}>{next.label}</Button>)}
      </Stack>
    </>
  );
}
