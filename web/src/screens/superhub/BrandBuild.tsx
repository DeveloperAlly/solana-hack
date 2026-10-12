/*
 * Data contract: Brand-Build (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Brand-Build,
 * note n-bb). Shape: BrandBuildData in ./types.ts. Backend map §4 Brand Builder, row "Brand-Build":
 * `GET …/kit/current`, `PATCH …/sections/:section`, `POST …/draft-section`, `POST …/ingest` (re-read);
 * tables kit_versions, kit_sections, evidence.
 *
 * | Field                | Source                                                                               |
 * |----------------------|--------------------------------------------------------------------------------------|
 * | (title)              | The brand chosen in the switcher (hub session); intro is product copy                |
 * | intro                | Product copy                                                                         |
 * | kit.version/approved | kit_versions (version, approved_at, approver); hash = registrations content hash     |
 * | sections[].status    | kit_sections.state: Evidenced / Inferred / Missing (D51; same badge as Coverage-Map) |
 * | sections[].body      | kit_sections content; Inferred carries "Drafted, confirm" (n-bb 2)                   |
 * | sections[].source    | evidence: the cited source of each Evidenced or Inferred fact                        |
 * | sections[].gate      | Gate sections: Purpose, Positioning, Voice attributes (n-bb 5)                       |
 * | sections[].personas  | audiences, labelled Assumption (n-bb 3)                                              |
 *
 * States (n-bb): success = kit v1 approved; empty = every section Missing; loading = Onboard-3b (sources being read);
 * error = Ingest-Error (a source failed).
 */
import { Button, Stack, Text } from '../../ui/primitives';
import { StatePanel } from '../../ui/composites/StatePanel';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { Columns } from '../../ui/layouts/Columns';
import { HubSideNav } from '../../ui/domain/HubSideNav';
import { CoverageBadge } from '../../ui/domain/CoverageBadge';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { KitHeader } from './parts/KitHeader';
import { KitSectionCard } from './parts/KitSectionCard';
import { StateView } from '../../ui/composites/StateView';
import { useKitSections } from './hooks/useKitSections';
import { useActiveBrand } from '../../flows/brand/activeBrand';
import { useHubLinks } from './paths';
import type { BrandBuildData } from './types';

export function BrandBuild({ data, state = 'success' }: { data: BrandBuildData; state?: ScreenState }) {
  const links = useHubLinks();
  const kit = useKitSections(data.sections);
  const brand = useActiveBrand();
  const toc = kit.sections.map((s) => ({ id: s.id, label: `${s.num} ${s.title}`, href: `#${s.id}`, badge: <CoverageBadge status={s.status} /> }));
  const body = (
    <Stack gap={5}>
      <KitHeader kit={data.kit} counts={kit.counts} />
      <Columns start={<HubSideNav label="Kit sections" sections={[{ items: toc }]} />}>
        {kit.sections.map((s) => <KitSectionCard key={s.id} section={s} kit={kit} />)}
        <Stack direction="row" gap={3} justify="end" wrap>
          {/* INTEGRATION: POST /api/brands/:id/ingest re-reads the sources; progress is Onboard-3b-Profiling. */}
          <Button variant="secondary" href={links.profiling}>Re-read sources</Button>
          {kit.unconfirmed > 0 && <Text variant="small" tone="secondary">Confirm the {kit.unconfirmed} drafted sections to approve.</Text>}
          {kit.unconfirmed > 0 ? <Button disabled>Approve as kit v[n+1]</Button> : <Button href={links.kitPublished}>Approve as kit v[n+1]</Button>}
        </Stack>
      </Columns>
    </Stack>
  );
  return (
    <HubPage artboard="Brand-Build">
      <PageHeader badges={<ComingSoonFlag tag="HACKATHON (THIN)" />} title={`${brand.name} brand kit`} intro={data.intro} />
      <StateView
        state={state}
        views={{
          success: body,
          empty: body,
          loading: <StatePanel kind="loading" title="Reading your sources" body="Sections fill in as facts are found." actions={<Button variant="secondary" href={links.profiling}>See progress</Button>} />,
          error: <StatePanel kind="error" title="A source could not be read" body="The kit keeps what was found so far. Retry the source or skip it." actions={<Button href={links.ingestError}>Fix the source</Button>} />,
        }}
      />
    </HubPage>
  );
}
