import type { ReactNode } from 'react';
import { Button, Text } from '../../../ui/primitives';
import { WizardLayout } from '../../../ui/layouts/WizardLayout';
import type { CampaignFlow } from '../hooks/useCampaignFlow';
import { HubPage } from './HubPage';

export interface CampaignStepFrameProps {
  flow: CampaignFlow;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}

/** One Campaign v2 step: hub frame, L6 WizardLayout with the six-step stepper, and Back / Next from the flow hook (Next waits for a complete step and says what is missing). */
export function CampaignStepFrame({ flow, title, intro, children }: CampaignStepFrameProps) {
  return (
    <HubPage section="create" sub="campaigns" width="wizard">
      <WizardLayout
        steps={flow.steps}
        current={flow.current}
        hrefFor={flow.hrefFor}
        title={title}
        intro={intro}
        footer={
          <>
            {flow.missing.length > 0 && <Text variant="small" tone="secondary">To continue: {flow.missing.join('; ')}.</Text>}
            <Button variant="secondary" href={flow.back}>{flow.backLabel}</Button>
            <Button onClick={flow.next} disabled={flow.missing.length > 0}>{flow.nextLabel}</Button>
          </>
        }
      >
        {children}
      </WizardLayout>
    </HubPage>
  );
}
