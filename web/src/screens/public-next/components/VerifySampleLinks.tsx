import { Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { ScreenLink } from '../../../gallery/ScreenLink';
import { verifyArtboards } from '../paths';

const samples = [
  { artboard: verifyArtboards.match, label: 'Brand-approved' },
  { artboard: verifyArtboards.noMatch, label: 'Not found' },
  { artboard: verifyArtboards.edited, label: 'Edited from original' },
  { artboard: verifyArtboards.retracted, label: 'Retracted' },
  { artboard: verifyArtboards.lookup, label: 'Account, kit or claim' },
];

/** The canvas "Prototype results" box (Verify-1-Match): jumps to each sample result, keeping the gallery theme. */
export function VerifySampleLinks() {
  return (
    <Card variant="dashed" as="nav" labelledBy="verify-samples">
      <Stack direction="row" gap={4} wrap align="baseline">
        <Text as="span" variant="small" tone="secondary" id="verify-samples">Sample results:</Text>
        {samples.map((s) => (
          <ScreenLink key={s.artboard} artboard={s.artboard}>{s.label}</ScreenLink>
        ))}
      </Stack>
    </Card>
  );
}
