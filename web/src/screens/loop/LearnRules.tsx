/*
 * Data contract: Learn-Rules (canvas v24 page "6 · Learn from what works", board Learn-Rules; ADR-013 decision 3,
 * module N5 learn loop; issue #90 row "Learn-Rules"). Shape: LearnRulesData in ./types.ts; Proposal in
 * src/domain/proposal.ts.
 *
 * | Field        | Source                                                                                            |
 * |--------------|---------------------------------------------------------------------------------------------------|
 * | proposals[]  | N5 learn loop: proposals with cited outcomes, signal source, evaluator, Brain version: not built  |
 * | brain        | X18 brand memory: the version a decision bumps: not built; fixtures                               |
 * | collecting   | analytics ingest: days of results so far (N1 to N4): not built                                    |
 *
 * Approving a proposal makes its rule active and bumps the Brain version; the kit version and its registration stay
 * the same. "Try on half of drafts" runs it as an experiment. A proposal judged against an older Brain is blocked
 * until it is checked again.
 * States (canvas Learn-Rules note): success (proposals waiting), empty (collecting: under 14 days, nothing to
 * suggest yet), loading, error; "none to review" once every proposal is decided.
 */
import { Badge, Button, Stack } from '../../ui/primitives';
import { EmptyState } from '../../ui/composites/EmptyState';
import { StateView } from '../../ui/composites/StateView';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { RuleProposal } from '../../ui/domain/RuleProposal';
import { nextBrainVersion } from '../../domain/brain';
import { proposalGate } from '../../domain/proposal';
import { useLoop } from '../../flows/loop/useLoop';
import { LoopFrame } from '../../ui/shells/LoopFrame';
import { DecidedProposals } from './DecidedProposals';
import { useLoopLinks } from './paths';
import type { LearnRulesData } from './types';

export function LearnRules({ data, state = 'success' }: { data: LearnRulesData; state?: ScreenState }) {
  const loop = useLoop(data);
  const { links, to } = useLoopLinks();
  const open = loop.proposals.filter((p) => p.status === 'pending' || p.status === 'trial');
  const version = loop.brain.version;
  return (
    <LoopFrame artboard="Learn-Rules" tag="COMING SOON" brandName={data.brain.brandName}>
      <PageHeader
        title="Suggested rules"
        intro="What your results say, as changes to the Brain. Nothing changes until you approve it, and every rule can be retired. Rules live in the Brain; the registered kit never changes because of one."
        badges={<><Badge>{open.length} waiting</Badge><SampleFlag /></>}
      />
      <StateView
        state={state}
        empty={{ title: 'Nothing to suggest yet', body: `Learn needs ${data.collecting.needed} days of results; it has ${data.collecting.days}. Suggestions appear here, and nothing changes until you approve one.`, actions: <Button variant="secondary" href={links.contentDashboard}>Keep posting</Button> }}
        loading={{ title: 'Loading suggestions' }}
        error={{ title: "Couldn't load suggestions", body: 'Nothing in the Brain changed.', actions: <Button variant="secondary" href={links.learnRules}>Try again</Button> }}
      >
        <Stack gap={5}>
          {open.length === 0 && <EmptyState title="None to review" body="Every suggestion is decided. New ones appear as results come in." actions={<Button variant="secondary" href={links.brain}>Open the Brain</Button>} />}
          {open.map((p, i) => (
            <RuleProposal
              key={p.id}
              proposal={p}
              gate={proposalGate(p, version)}
              brainVersion={version}
              nextVersion={nextBrainVersion(version)}
              citesHref={to(p.cites.artboard)}
              onApprove={() => loop.approveProposal(p)}
              onReject={() => loop.rejectProposal(p)}
              onTrial={() => loop.trialProposal(p)}
              onRecheck={() => loop.recheckProposal(p)}
              emphasis={i === 0}
            />
          ))}
          <DecidedProposals brainVersion={version} rules={loop.brain.rules} proposals={loop.proposals.filter((p) => p.status === 'approved' || p.status === 'rejected')} />
        </Stack>
      </StateView>
    </LoopFrame>
  );
}
