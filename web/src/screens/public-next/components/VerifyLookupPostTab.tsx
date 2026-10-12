import { Stack, Text } from '../../../ui/primitives';
import { ScreenLink } from '../../../gallery/ScreenLink';
import { verifyArtboards } from '../paths';

/** Verify-4 "Post" tab: posts are checked on the Verify screen (the canvas tab links there). */
export function VerifyLookupPostTab() {
  return (
    <Stack gap={3} align="start">
      <Text>Paste a post's text or URL on the Verify screen to see whether a brand approved it.</Text>
      <ScreenLink artboard={verifyArtboards.match} as="button">Check a post</ScreenLink>
    </Stack>
  );
}
