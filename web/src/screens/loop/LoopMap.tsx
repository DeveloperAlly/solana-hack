// The exported canvas's Loop-Map overview: navigation and stage names come from the existing registry, not a
// second navigation system. This is a product map, not a claim that every linked stage is integrated (ADR-012).
import { loopSteps, mobileTabs, stages, type LoopStageId } from '../../config/nav';
import { Button, Grid, Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { LoopFrame } from '../../ui/shells/LoopFrame';
import { useNavHref } from '../../ui/hooks/useNavHref';

const exchange: Record<LoopStageId, { reads: string; gives: string }> = {
  brand: { reads: 'sources, owner answers', gives: 'kit versions, voices, facts' },
  create: { reads: 'kit, voice, facts, rules', gives: 'approved posts' },
  distribute: { reads: 'per-platform rules', gives: 'where and when it ran' },
  verify: { reads: 'registered hashes', gives: 'checks by others, badge traffic' },
  grow: { reads: 'kit for ambassadors, briefs', gives: 'reach, leads, payouts' },
  learn: { reads: 'everything above', gives: 'rule suggestions you approve' },
};

export function LoopMap() {
  const href = useNavHref();
  return (
    <LoopFrame artboard="Loop-Map" tag="HACKATHON" brandName="JamJam">
      <Stack gap={6}>
        <PageHeader title="JamJam: build your brand, run it, prove it"
          intro="One loop of six steps. One Brain every step reads from and Learn writes back to, with you approving every change. Today is the front door."
          actions={<Button href={href({ artboard: 'Today', live: '/home' })}>Open Today</Button>} />
        <Card variant="subtle" labelledBy="map-today" header={<Heading level={2} size="lg" id="map-today">Today</Heading>}>
          <Text>One queue of decisions: drafts, replies, ambassador posts, event content, learned rules. One tap to approve, on desktop or phone.</Text>
          <Stack direction="row" gap={4}><Link href={href({ artboard: 'Today', live: '/home' })}>Desktop</Link><Link href={href({ artboard: 'M-Today', live: '/home' })}>Mobile</Link></Stack>
        </Card>
        <Grid min="sm">
          {loopSteps.map((stage) => {
            const io = exchange[stage.id as LoopStageId];
            return <Card key={stage.id} labelledBy={`map-${stage.id}`} header={<Heading level={2} size="lg" id={`map-${stage.id}`}>{stage.step} {stage.label}</Heading>}>
              <Stack gap={3}>
                <Text>{stage.summary}</Text>
                <Stack as="ul" gap={2}>{stage.tabs.map((tab) => <li key={tab.id}><Link href={href(tab)}>{tab.label}</Link></li>)}</Stack>
                <Text variant="small"><strong>Reads from the Brain:</strong> {io.reads}</Text>
                <Text variant="small"><strong>Gives back:</strong> {io.gives}</Text>
              </Stack>
            </Card>;
          })}
        </Grid>
        <Card variant="subtle" labelledBy="map-brain" header={<Heading level={2} size="lg" id="map-brain">The Brain</Heading>}>
          <Text>Kit · voices · audience · facts with receipts · learned rules · change history</Text>
          <Link href={href({ artboard: 'Brain' })}>Open the Brain</Link>
        </Card>
        <Grid min="md">
          <Card labelledBy="map-nav" header={<Heading level={2} size="lg" id="map-nav">One navigation, everywhere</Heading>}>
            <Text>{stages.map((s) => s.label).join(' · ')} · brand switcher. Sections inside a step are tabs.</Text>
            <Text variant="small">Mobile tabs: {mobileTabs.map((t) => t.label).join(', ')}.</Text>
          </Card>
          <Card labelledBy="map-rules" header={<Heading level={2} size="lg" id="map-rules">Rules that hold on every screen</Heading>}>
            <Text>A person approves everything that posts, pays or changes the Brain. Approvals go stale when what was approved changes. Every fact has a receipt. Proof shows wherever a post shows.</Text>
          </Card>
          <Card labelledBy="map-shells" header={<Heading level={2} size="lg" id="map-shells">Shells by role</Heading>}>
            <Text>Owner and team: the full loop. Ambassador: brand seats and public campaigns. Public: landing, Verify, ledger, events board.</Text>
          </Card>
        </Grid>
        <Text variant="caption" tone="secondary">Product map for ADR-012 and ADR-013. Linked screens marked Coming soon use sample data; Roadmap screens show later features.</Text>
      </Stack>
    </LoopFrame>
  );
}
