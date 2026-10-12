/*
 * Data contract: Coverage-Map (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Coverage-Map, notes n-cov and
 * n-openq.6; issue #50). Backend map §4, row "Coverage-Map" (GET /api/brands/:id/coverage -> evidence, kit_sections; rules
 * only). Shape: CoverageData in ./types.
 *
 * | Field   | Source                                                                                   | Empty                    |
 * |---------|------------------------------------------------------------------------------------------|--------------------------|
 * | brand   | brands, profiles                                                                         | never                    |
 * | brands  | The brand being built, beside a brand with a public history (film.fun) for comparison     | n/a                      |
 * | rows    | GET …/coverage: per section, state E / I / M and what the builder will do                | every section Missing    |
 * | caption | Static description of the two brands                                                     | n/a                      |
 *
 * States: success. Statuses are sample data until film.fun's sources are read (note n-cov.3). Kit v1 needs the three
 * gates approved (from the flow); Missing sections block nothing (note n-cov.4). The live kit drafts 6 sections, the
 * canvas shows 17 (decision D2, note n-openq.6).
 */
import { Alert, Button, Grid, Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import { BuilderCoverageBadge } from '../../ui/domain/BuilderCoverageBadge';
import { BuilderCoverageMap } from '../../ui/domain/BuilderCoverageMap';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { gateBoards, useBoardHref } from './paths';
import { useBuilderFlow } from './useBuilderFlow';
import type { CoverageData, GateId } from './types';

export function CoverageMap({ data }: { data: CoverageData }) {
  const { back, next, gates, allGatesApproved } = useBuilderFlow('coverage');
  const to = useBoardHref();
  const pending = (Object.keys(gates) as GateId[]).filter((g) => gates[g].status !== 'approved');
  return (
    <BuilderStep
      flow="coverage"
      brand={data.brand}
      title="What we found, and what we still need"
      intro="Every kit has the same 17 sections. Here's where yours stands, next to a brand with a public history."
      flag={<SampleFlag />}
      footer={
        // INTEGRATION: POST /api/brands/:id/kit/approve (backend map §4, row "Onboard-6-Published, Kit-RegisterFailed").
        <BuilderStepFooter back={back} next={{ label: 'Approve kit v1', href: next, blockedReason: allGatesApproved ? null : 'Approve the three gates first.' }}>
          <Button href={to('brandBuild')} variant="secondary">Review sections first</Button>
        </BuilderStepFooter>
      }
    >
      <Stack direction="row" gap={5} wrap>
        <BuilderCoverageBadge state="E" withDetail />
        <BuilderCoverageBadge state="I" withDetail />
        <BuilderCoverageBadge state="M" withDetail />
      </Stack>
      <BuilderCoverageMap caption={data.caption} brands={data.brands} rows={data.rows} />
      <Grid min="md" gap={4}>
        <Card variant="subtle" as="div">
          <Heading level={2} size="lg">What the builder won&apos;t ask</Heading>
          <Text variant="small">Evidenced facts: you only confirm them. Claims, Visual kit, Audio kit, Behaviour and Governance are not asked in the 15-minute intake; they stay Missing until you add them from the kit page.</Text>
        </Card>
        <Card variant="subtle" as="div">
          <Heading level={2} size="lg">Kit v1 can be approved with gaps</Heading>
          <Text variant="small">The three gates (Purpose, Positioning, Voice attributes) must be approved. Missing sections are listed in the kit and block nothing else.</Text>
        </Card>
      </Grid>
      {pending.length > 0 && (
        <Alert tone="warning" title="Approve the three gates first">
          Still open: {pending.map((g, i) => <span key={g}>{i > 0 && ', '}<Link href={to(gateBoards[g])}>{g}</Link></span>)}.
        </Alert>
      )}
    </BuilderStep>
  );
}
