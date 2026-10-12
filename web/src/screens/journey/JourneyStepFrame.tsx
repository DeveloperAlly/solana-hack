import type { ReactNode } from 'react';
import { PublicShell } from '../../ui/shells/PublicShell';
import { WizardLayout } from '../../ui/layouts/WizardLayout';
import { Badge, Link } from '../../ui/primitives';
import { useJourneyHref, type JourneyStepId } from './paths';
import { useJourneyFlow } from './useJourneyFlow';

export interface JourneyStepFrameProps {
  step: JourneyStepId;
  title: string;
  intro?: ReactNode;
  footer?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

/**
 * The frame every numbered Journey step shares (canvas boards J1-Read to J7-Proof; issue #48): the public shell, then L6
 * WizardLayout with the seven steps, the time estimate, the status chip and "Save and exit" in its flag and header
 * slots, and links back to done steps. Composition only: no styles.
 */
export function JourneyStepFrame({ step, title, intro, footer, error, children }: JourneyStepFrameProps) {
  const to = useJourneyHref();
  const flow = useJourneyFlow(step);
  return (
    <PublicShell>
      <WizardLayout
        steps={flow.steps}
        current={flow.index}
        estimate={flow.estimate}
        hrefFor={flow.stepHref}
        flag={<Badge>{flow.status}</Badge>}
        headerActions={<Link href={to('main')}>Save and exit</Link>}
        title={title}
        intro={intro}
        footer={footer}
        error={error}
      >
        {children}
      </WizardLayout>
    </PublicShell>
  );
}
