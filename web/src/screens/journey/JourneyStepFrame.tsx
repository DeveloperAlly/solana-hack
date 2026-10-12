import type { ReactNode } from 'react';
import { PublicShell } from '../../ui/shells/PublicShell';
import { WizardLayout } from '../../ui/layouts/WizardLayout';
import { Badge, Link } from '../../ui/primitives';
import { journeyPaths, publicNavHref, type JourneyStepId } from './paths';
import { useJourneyFlow } from './useJourneyFlow';

export interface JourneyStepFrameProps {
  step: JourneyStepId;
  title: string;
  intro?: ReactNode;
  /** Header chip: sign-in or registration status, e.g. "Not signed in". */
  status: string;
  footer?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

/**
 * The frame every numbered Journey step shares (canvas boards J1-Read to J7-Proof; issue #48): the public shell with
 * a status chip and "Save and exit" in place of the nav, then L6 WizardLayout with the seven steps, the time estimate,
 * and links back to done steps. Composition only: no styles.
 */
export function JourneyStepFrame({ step, title, intro, status, footer, error, children }: JourneyStepFrameProps) {
  const flow = useJourneyFlow(step);
  return (
    <PublicShell
      navHref={publicNavHref}
      actions={
        <>
          <Badge>{status}</Badge>
          <Link href={journeyPaths.main}>Save and exit</Link>
        </>
      }
    >
      <WizardLayout steps={flow.steps} current={flow.index} estimate={flow.estimate} hrefFor={flow.stepHref} title={title} intro={intro} footer={footer} error={error}>
        {children}
      </WizardLayout>
    </PublicShell>
  );
}
