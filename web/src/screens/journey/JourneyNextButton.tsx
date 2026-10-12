import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button, Text } from '../../ui/primitives';

export interface JourneyNextButtonProps {
  /** Where it goes once the step is finished. */
  href: string;
  /** The step before it truly finished; until then the button is disabled. */
  ready: boolean;
  /** What is still missing, shown while not ready. */
  hint: string;
  /** Runs before moving on, e.g. to record the choice. */
  onGo?: () => void;
  children: ReactNode;
}

/**
 * The forward action of a Journey step (issue #48): the next step opens only after this one finished, so the button is
 * disabled with the reason beside it until then (binding review rule "multi-step forms are state machines").
 * Composition only, no styles.
 */
export function JourneyNextButton({ href, ready, hint, onGo, children }: JourneyNextButtonProps) {
  const navigate = useNavigate();
  return (
    <>
      {!ready && <Text variant="small" tone="secondary" role="status">{hint}</Text>}
      <Button disabled={!ready} onClick={() => { onGo?.(); navigate(href); }}>{children}</Button>
    </>
  );
}
