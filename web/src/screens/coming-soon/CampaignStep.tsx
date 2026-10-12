import type { ReactNode } from 'react';
import { Button } from '../../ui/primitives';
import { WizardLayout } from '../../ui/layouts/WizardLayout';
import { SoonHubFrame } from '../../ui/domain/SoonHubFrame';
import { useCampaignFlow, type CampaignStepId } from './useCampaignFlow';

export interface CampaignStepProps {
  step: CampaignStepId;
  /** Page title in the header, e.g. "New campaign: audience". */
  pageTitle: string;
  /** The step's question or heading. */
  title: string;
  intro?: string;
  definedIn: string;
  /** Runs on Continue; return false to stay on the step (validation failed). Defaults to moving on. */
  onContinue?: () => boolean;
  continueLabel?: string;
  continueDisabled?: boolean;
  /** Step error above the body (an Alert or StatePanel). */
  error?: ReactNode;
  children?: ReactNode;
}

/** One Campaign v2 step on this page: hub frame, L6 WizardLayout with the flow's stepper, and Back / Continue. */
export function CampaignStep({ step, pageTitle, title, intro, definedIn, onContinue, continueLabel = 'Continue', continueDisabled, error, children }: CampaignStepProps) {
  const flow = useCampaignFlow(step);
  const proceed = () => {
    if (onContinue && !onContinue()) return;
    flow.next();
  };
  return (
    <SoonHubFrame header={{ title: pageTitle, definedIn }}>
      <WizardLayout
        steps={flow.steps}
        current={flow.current}
        hrefFor={flow.hrefFor}
        title={title}
        intro={intro}
        titleLevel={2}
        error={error}
        footer={
          <>
            {flow.backHref && <Button href={flow.backHref} variant="secondary">Back</Button>}
            <Button onClick={proceed} disabled={continueDisabled}>{continueLabel}</Button>
          </>
        }
      >
        {children}
      </WizardLayout>
    </SoonHubFrame>
  );
}
