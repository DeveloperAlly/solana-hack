/*
 * Data contract: Brain (canvas v24 page "Start here: the loop", board Brain, drawn as Brand's "The Brain" tab;
 * ADR-012 decision 4 and ADR-013 decision 2, module X18 brand memory; issue #90 row "Brain"). Shape: LoopBase
 * (flows/loop/useLoop.ts); Brain in src/domain/brain.ts.
 *
 * | Field          | Source                                                                                          |
 * |----------------|-------------------------------------------------------------------------------------------------|
 * | brain.kit      | kit_versions (built: version, registration); sections and facts from the evidence store (built) |
 * | brain.voices   | voices (built for the kit's voice); the other voices: not built                                 |
 * | brain.rules    | X18 brand memory, learned rules with status and evidence: not built; fixtures                   |
 * | brain.history  | X18 decision history: not built                                                                 |
 * | proposals      | N5 learn loop: not built                                                                        |
 *
 * Learned rules are Brain state, not kit content: approving or retiring one bumps the Brain version; the kit and its
 * registration on Solana stay the same (ADR-012 runtime section).
 * States (canvas Brain note): success (suggestions pending), empty (first run: kit only, no rules yet), loading,
 * error. Retiring a rule and export are actions on the success view.
 */
import { Badge, Button, Grid, Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { StatTile } from '../../ui/composites/StatTile';
import { StateView } from '../../ui/composites/StateView';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { Columns } from '../../ui/layouts/Columns';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { rulesWith } from '../../domain/brain';
import { useLoop, type LoopBase } from '../../flows/loop/useLoop';
import { BrainRules } from './BrainRules';
import { LoopFrame } from '../../ui/shells/LoopFrame';
import { useLoopLinks } from './paths';

const uses = [
  { title: 'Reads it', body: 'Create: every draft · Distribute: per-platform rules · Grow: ambassador kits, campaign briefs, event plans' },
  { title: 'Writes to it', body: 'You: kit gates, voices, facts, rule approvals · Learn: suggestions only, never directly' },
  { title: 'Guarantees', body: 'A person approves every change · nothing grades itself · only quoted sources and dated owner answers count as facts · one brand never shapes another' },
];

export function Brain({ data, state = 'success' }: { data: LoopBase; state?: ScreenState }) {
  const loop = useLoop(data);
  const { links } = useLoopLinks();
  const b = loop.brain;
  const waiting = rulesWith(b, 'suggested').length;
  return (
    <LoopFrame artboard="Brain" tag="COMING SOON" brandName={b.brandName}>
      <PageHeader
        title="The Brain"
        intro={`Everything JamJam knows about ${b.brandName}. Create, Distribute and Grow read it; Learn suggests changes; only you approve them.`}
        badges={<Badge tone="solid">Brain v{b.version}</Badge>}
        actions={<Button variant="secondary" href={links.kitExport}>Export</Button>}
      />
      <StateView state={state} loading={{ title: 'Loading the Brain' }} error={{ title: "Couldn't load the Brain", body: 'Nothing in it changed.', actions: <Button variant="secondary" href={links.brain}>Try again</Button> }}>
        <Stack gap={6}>
          <Grid min="sm" gap={4}>
            <StatTile label="Kit" value={`v${b.kit.version}`} sub={`${b.kit.registered ? 'registered on Solana' : 'not registered'} · ${b.kit.sections} sections`} href={links.kit} sample />
            <StatTile label="Voices" value={String(b.voices.length)} sub={b.voices.map((v) => v.name.replace(' voice', '')).join(', ')} href={links.voices} sample />
            <StatTile label="Facts with receipts" value={String(b.kit.factCount)} sub={`from ${b.kit.sources} ${b.kit.sources === 1 ? 'source' : 'sources'} · ${b.kit.expiringFacts} expire this month`} href={links.claims} sample />
            <StatTile label="Learned rules" value={String(rulesWith(b, 'active').length)} sub={`active · ${waiting} suggested, waiting on you`} sample />
          </Grid>
          <Card labelledBy="flow-h" header={<Heading level={2} size="lg" id="flow-h">How the Brain is used</Heading>}>
            <Grid min="md" gap={4}>
              {uses.map((u) => <Card key={u.title} variant="subtle" as="div"><Text variant="label">{u.title}</Text><Text variant="small">{u.body}</Text></Card>)}
            </Grid>
          </Card>
          <Card labelledBy="rules-h" header={<><Heading level={2} size="lg" id="rules-h">Learned rules</Heading><Text as="span" variant="small" tone="secondary">Every rule names the results it came from and can be retired. Rules change the Brain, never the registered kit.</Text></>}>
            <BrainRules loop={loop} />
          </Card>
          <Columns ratio="1-1" end={
            <Card labelledBy="hist-h" header={<Heading level={2} size="lg" id="hist-h">Change history</Heading>}>
              {b.history.map((h) => <Text key={`${h.version}-${h.summary}`} variant="small">v{h.version} · {h.summary} · {h.at}</Text>)}
              <Link href={links.ledger}>Registered kit versions on the ledger</Link>
            </Card>
          }>
            <Card labelledBy="aud-h" header={<Heading level={2} size="lg" id="aud-h">Audience</Heading>}>
              <Text variant="small">{b.kit.audience}</Text>
              <Link href={links.kit}>Edit in the kit</Link>
            </Card>
          </Columns>
        </Stack>
      </StateView>
    </LoopFrame>
  );
}
