import type { ReactNode } from 'react';
import { Button, Link } from '../../ui/primitives';
import type { HeadingLevel } from '../../ui/primitives/Heading';
import { WizardLayout } from '../../ui/layouts/WizardLayout';
import type { CampaignFlow } from './useCampaignFlow';
import styles from './CampaignStepFrame.module.css';

export interface CampaignStepFrameProps {
  flow: CampaignFlow;
  /** The step's question or heading. */
  title: string;
  intro?: ReactNode;
  /** What is still missing on this step, in words ("choose a purpose"); shown beside the disabled Next. */
  missing?: string[];
  /** Step error above the body (an Alert or StatePanel). */
  error?: ReactNode;
  titleLevel?: HeadingLevel;
  children?: ReactNode;
}

/**
 * The one Campaign v2 step frame (issue #46): L6 WizardLayout with the six-step stepper from the step table (done
 * marks from completion, not position), the step's title, and Back / Next. Next stays disabled until this step and
 * every earlier step are complete, and then says why and links to the first missing step. The page shell around it
 * (hub nav, page header) is the page's.
 */
export function CampaignStepFrame({ flow, title, intro, missing = [], error, titleLevel, children }: CampaignStepFrameProps) {
  const reason = flow.blocker?.earlier
    ? <>Finish <Link href={flow.blocker.href}>step {flow.blocker.index + 1}: {flow.blocker.label}</Link> first.</>
    : flow.blocker && missing.length > 0
      ? <>To continue: {missing.join('; ')}.</>
      : null;
  return (
    <WizardLayout
      steps={flow.steps}
      current={flow.current}
      done={flow.done}
      hrefFor={flow.hrefFor}
      title={title}
      intro={intro}
      titleLevel={titleLevel}
      error={error}
      footer={
        <>
          {reason && <p className={styles.reason} role="status">{reason}</p>}
          {flow.backHref && <Button variant="secondary" href={flow.backHref}>{flow.backLabel}</Button>}
          <Button onClick={flow.next} disabled={!flow.canAdvance}>{flow.nextLabel}</Button>
        </>
      }
    >
      {children}
    </WizardLayout>
  );
}
