import { Link, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { verifyPaths } from '../paths';

const samples = [
  { href: verifyPaths.match, label: 'Brand-approved' },
  { href: verifyPaths.noMatch, label: 'Not found' },
  { href: verifyPaths.edited, label: 'Edited from original' },
  { href: verifyPaths.retracted, label: 'Retracted' },
  { href: verifyPaths.lookup, label: 'Account, kit or claim' },
];

/** The canvas "Prototype results" box (Verify-1-Match): jumps to each sample result. */
export function VerifySampleLinks() {
  return (
    <Card variant="dashed" as="nav" labelledBy="verify-samples">
      <Stack direction="row" gap={4} wrap align="baseline">
        <Text as="span" variant="small" tone="secondary" id="verify-samples">Sample results:</Text>
        {samples.map((s) => (
          <Link key={s.href} href={s.href}>{s.label}</Link>
        ))}
      </Stack>
    </Card>
  );
}
