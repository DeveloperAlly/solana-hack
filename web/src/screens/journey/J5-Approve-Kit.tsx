/*
 * Data contract: J5-Approve-Kit, "Approve kit v1: 3 gates" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J5-Approve-Kit, note n-j5-approve-kit; issue #48). Shape: ApproveKitData in ./types. Backend map:
 * .agentic/what/context/backend_map.md §4, rows "Gate 1, Gate 2, Gate 3" and "Onboard-6-Published, Kit-RegisterFailed".
 *
 * | Field         | Source                                                                                            | Empty when |
 * |---------------|---------------------------------------------------------------------------------------------------|------------|
 * | approver      | The signed-in user (Supabase session); the `gates.approved_by` it records                         | never      |
 * | voice         | The J4 voice samples (BB-6), to name the picks in the Voice gate draft                              | never      |
 * | gates[]       | `kit_sections` drafts (POST /api/brands/:id/sections/:section/draft) with their cited `evidence`, plus any `gates` row (approved_by, approved_at, note) via GET /api/brands/:id | never: J5 follows J4 |
 * | alsoDrafted[] | `kit_sections` without a gate (audience, origin, messaging), status drafted                       | []         |
 * | onChain       | Static copy: the WL-KIT schema fields (brand_id, hash, kit_version, approver, domain_verified)     | never      |
 * | registration  | POST /api/brands/:id/kit/register failure (web/worker/api.ts, registerKit): reason, kit hash, last try | unset unless it failed |
 *
 * Drafts, evidence and "built from" follow the person's J3 decisions and J4 answers, alternatives and picks (derive.ts).
 * Each approval is bound to a fingerprint of its draft and inputs; when they change it is pending again, and Register
 * and Retry stay disabled until every gate is approved afresh.
 * Approve, Edit and Change persist through useJourneyFlow (INTEGRATION there: POST …/sections/:section/approve {note}).
 * States (note n-j5-approve-kit): success = the three gates; error = registration failed, the kit stays approved and the
 * first post waits (the Worker drafts only from a registered kit). Registering sets kitRegistered in useJourneyFlow.
 */
import { useNavigate } from 'react-router';
import { Alert, Button, Grid, Heading, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import { useJourneyTask } from './useJourneyTask';
import { StatusList } from '../../ui/composites/StatusList';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { ApproveGate } from './ApproveGate';
import { ApproveRegisterPanel } from './ApproveRegisterPanel';
import { JourneyStepFrame } from './JourneyStepFrame';
import { gateFingerprint, gateView, statusRows } from './derive';
import { useJourneyFlow } from './useJourneyFlow';
import type { ApproveKitData } from './types';

export interface ApproveKitProps {
  data: ApproveKitData;
  state?: ScreenState;
}

export function J5ApproveKit({ data, state = 'success' }: ApproveKitProps) {
  const navigate = useNavigate();
  const flow = useJourneyFlow('approveKit');
  const { selections, actions, live } = flow;
  // Each gate as the person left it on J3 and J4 (rejected facts dropped, edits and answers used), else the fixture.
  const gates = data.gates.map((g) => live ? g : gateView(g, selections, data.voice));
  // One decision per gate for every screen: an approval counts only while it matches the draft it approved.
  const supporting = data.supportingSections || [];
  const unreviewed = supporting.filter(s => !s.approved);
  const decisions = gates.map((g) => flow.gateDecision(g.id, gateFingerprint(g), g.approval));
  return (
    <JourneyStepFrame
      step="approveKit"
      title="Approve kit v1"
      intro="Three decisions. Each shows what it was built from. Your approval is recorded: who, when, and why if you say."
    >
      <Grid min="sm" gap={4}>
        {gates.map((g, i) => (
          <ApproveGate
            key={g.id}
            gate={g}
            decision={decisions[i]}
            stale={flow.gateStale(g.id, gateFingerprint(g), g.approval)}
            approver={data.approver}
            onDecide={(d) => (d.status === 'approved' ? actions.approveGate(g.id, d, gateFingerprint(g)) : actions.reopenGate(g.id))}
            onEdit={(draft) => actions.editGate(g.id, draft)}
          />
        ))}
      </Grid>
      {supporting.map(section => <SupportingSection key={section.id} section={section} onApprove={() => { if (!actions.approveSupportingSection) throw new Error('Section approval is unavailable.'); return actions.approveSupportingSection(section.id); }} />)}
      <StatusList label="Also drafted for a quick look" title surface="card" rows={statusRows(data.alsoDrafted)} />
      <ApproveRegisterPanel
        onChain={data.onChain}
        approved={decisions.filter((d) => d.status === 'approved').length}
        total={gates.length}
        blockedReason={unreviewed.length ? `Review and approve ${unreviewed.map(s => s.title.toLowerCase()).join(", ")} before registering.` : undefined}
        failure={state === 'error' ? data.registration : undefined}
        onRegister={() => { const result = actions.setKitRegistered(true); if (result) return result.then(() => navigate(flow.nextHref)); navigate(flow.nextHref); }}
        onRetry={async () => { await actions.setKitRegistered(live); if (live) navigate(flow.nextHref); }}
      />
    </JourneyStepFrame>
  );
}

function SupportingSection({ section, onApprove }: { section: NonNullable<ApproveKitData['supportingSections']>[number]; onApprove: () => Promise<void> }) {
  const task = useJourneyTask();
  return <Card><Heading level={2} size="lg">{section.title}</Heading><Text>{section.draft}</Text>
    {section.evidence.length > 0 && <details><summary>See cited evidence</summary>{section.evidence.map(fact => <JourneyFactCard key={fact.id} fact={fact} />)}</details>}
    {section.approved ? <Text role="status">Approved</Text> : <Button disabled={task.busy} onClick={() => void task.run(onApprove)}>Approve {section.title.toLowerCase()}</Button>}
    {task.error && <Alert tone="danger">{task.error}</Alert>}
  </Card>;
}
