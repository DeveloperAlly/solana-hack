import { useId } from 'react';
import { Button, Link, Stack, Text } from '../../../ui/primitives';

export interface PostForMeProps {
  /** The connected LinkedIn account; null when none is connected. */
  connectedAs: string | null;
  settingsHref: string;
  submitLabel: string;
  onSubmit: () => void;
}

/**
 * "Post to LinkedIn for me" (canvas Amb-4, M-4): shows the connected account with Change, or says it is not connected
 * with Connect LinkedIn. Post now works only with a connection. INTEGRATION: GET /api/connect/linkedin/start (Settings ›
 * Connections, backend map).
 */
export function PostForMe({ connectedAs, settingsHref, submitLabel, onSubmit }: PostForMeProps) {
  const reasonId = useId();
  if (!connectedAs) {
    return (
      <Stack gap={2}>
        <Text variant="small" id={reasonId}>LinkedIn: <strong>not connected</strong>. Connect your account first.</Text>
        <Text variant="small"><Link href={settingsHref}>Connect LinkedIn</Link></Text>
        <Button disabled aria-describedby={reasonId}>{submitLabel}</Button>
      </Stack>
    );
  }
  return (
    <Stack gap={2}>
      <Text variant="small">LinkedIn: <strong>Connected as {connectedAs}</strong> <Link href={settingsHref}>Change</Link></Text>
      <Button onClick={onSubmit}>{submitLabel}</Button>
    </Stack>
  );
}
