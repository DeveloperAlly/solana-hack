import type { ReactNode } from 'react';
import { Badge } from '../../ui/primitives';
import { DecisionGate } from '../../ui/domain/DecisionGate';
import { BuilderStep } from './BuilderStep';
import { useBuilderFlow, type FlowKey } from './useBuilderFlow';
import type { BuilderBrand, GateId } from './types';

const gateNumber: Record<GateId, number> = { purpose: 1, positioning: 2, voice: 3 };

export interface BuilderGateStepProps {
  flow: FlowKey;
  gate: GateId;
  brand: BuilderBrand;
  title: string;
  intro?: string;
  draftLabel: string;
  draftMeta?: string;
  whyLabel: string;
  backLabel?: string;
  /** The draft and its sources. */
  children: ReactNode;
}

/**
 * One of the three approval gates (canvas BB-Gate1/2/3): a wizard step whose body is the DecisionGate, wired to the
 * flow so the decision is kept for Coverage-Map and kit approval (note n-g1.3: kit v1 needs all three).
 */
export function BuilderGateStep({ flow, gate, brand, title, intro, draftLabel, draftMeta, whyLabel, backLabel, children }: BuilderGateStepProps) {
  const { back, next, gates, decide, brandFor } = useBuilderFlow(flow);
  return (
    <BuilderStep flow={flow} brand={brand} tag="FALLBACK" title={title} intro={intro} flag={<Badge tone="solid">Gate {gateNumber[gate]} of 3</Badge>}>
      <DecisionGate
        subject={gate}
        draftLabel={draftLabel}
        draftMeta={draftMeta}
        whyLabel={whyLabel}
        approver={brandFor(brand).approver}
        decision={gates[gate]}
        onDecide={(d) => decide(gate, d)}
        back={back ? { href: back, label: backLabel } : undefined}
        nextHref={next ?? ''}
      >
        {children}
      </DecisionGate>
    </BuilderStep>
  );
}
