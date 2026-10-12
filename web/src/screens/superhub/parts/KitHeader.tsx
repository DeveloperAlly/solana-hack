import { Link, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { SampleFlag } from '../../../ui/composites/SampleFlag';
import { CoverageBadge, coverageStatuses, coverageWord, type CoverageStatus } from '../../../ui/domain/CoverageBadge';
import { useHubLinks } from '../paths';
import type { BrandBuildData } from '../types';

const legend: Record<CoverageStatus, string> = {
  evidenced: 'found in a source, cited',
  inferred: 'drafted from sources, you confirm',
  missing: 'we ask you',
};

export interface KitHeaderProps {
  kit: BrandBuildData['kit'];
  counts: Record<CoverageStatus, number>;
}

/** D18 KitVersionBadge (version, approver, hash, registration, download) and the D51 legend with section counts (n-bb 4). */
export function KitHeader({ kit, counts }: KitHeaderProps) {
  const links = useHubLinks();
  return (
    <Stack gap={3}>
      <Card as="div" variant="subtle">
        <Text variant="small"><strong>Kit {kit.version}</strong> · approved {kit.approved} by {kit.approver}</Text>
        <Text variant="mono">hash {kit.hash}</Text>
        <Text variant="small"><Link href={links.ledger}>Registered on Solana</Link> · <Link href={links.kitExport}>Download (aDNA)</Link></Text>
      </Card>
      <Stack direction="row" gap={4} align="center" wrap>
        {coverageStatuses.map((s) => (
          <Text key={s} as="span" variant="small"><CoverageBadge status={s} /> {coverageWord(s)}: {legend[s]}</Text>
        ))}
        <SampleFlag />
        <Text as="span" variant="small">E {counts.evidenced} · I {counts.inferred} · M {counts.missing}</Text>
      </Stack>
    </Stack>
  );
}
