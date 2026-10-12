import { Button, Stack, Text } from '../../../ui/primitives';
import { verifyPaths } from '../paths';

/** Verify-4 "Post" tab: posts are checked on the Verify screen (the canvas tab links there). */
export function VerifyLookupPostTab() {
  return (
    <Stack gap={3} align="start">
      <Text>Paste a post's text or URL on the Verify screen to see whether a brand approved it.</Text>
      <Button href={verifyPaths.match}>Check a post</Button>
    </Stack>
  );
}
