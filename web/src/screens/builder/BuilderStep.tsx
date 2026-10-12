import type { ReactNode } from 'react';
import type { RouteTag } from '../../config/routes';
import { Badge, Link } from '../../ui/primitives';
import { WizardLayout } from '../../ui/layouts/WizardLayout';
import { BuilderShell } from '../../ui/domain/BuilderShell';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { otherPaths } from './paths';
import { useBuilderFlow, type FlowKey } from './useBuilderFlow';
import type { BuilderBrand } from './types';

export interface BuilderStepProps {
  flow: FlowKey;
  /** The brand being built; leave out before it exists (sign in). */
  brand?: BuilderBrand;
  /** Canvas tag; FALLBACK and the other flagged tags show a chip. */
  tag?: RouteTag;
  title: string;
  intro?: ReactNode;
  estimate?: string;
  /** Extra chip beside the stepper, e.g. "Gate 1 of 3" or "Optional for now". */
  flag?: ReactNode;
  footer?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
}

/**
 * One Brand Builder wizard step: the page frame (BuilderShell), then WizardLayout with the flow's stepper.
 * Unverified brands carry the flag on every step (note n-ob2.2); every step after sign-in offers "Save and finish later".
 */
export function BuilderStep({ flow, brand, tag, title, intro, estimate, flag, footer, error, children }: BuilderStepProps) {
  const { steps, current, hrefFor } = useBuilderFlow(flow);
  return (
    <BuilderShell
      context={brand ? `Build your brand: ${brand.name}` : 'Build your brand'}
      homeHref={otherPaths.main}
      flags={brand && !brand.verified && <Badge>Unverified</Badge>}
      action={brand && <Link href={otherPaths.hubHome}>Save and finish later</Link>}
    >
      <WizardLayout steps={steps} current={current} hrefFor={hrefFor} title={title} intro={intro} estimate={estimate} footer={footer} error={error} flag={<>{tag && <ComingSoonFlag tag={tag} />}{flag}</>}>
        {children}
      </WizardLayout>
    </BuilderShell>
  );
}
