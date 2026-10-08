import { useState, type FormEvent } from 'react';
import { PublicShell } from '../../ui/shells/PublicShell';
import { Alert, Button, Container, Field, Heading, Link, Stack, Text } from '../../ui/primitives';
import { api, ApiError } from '../../lib/api';

interface Match { brand?: string | null; kitVersion?: number | null; approvedAt?: string | null; publishedUrl?: string | null; explorer?: string | null }
interface Result extends Match { official: boolean; hash: string; matches?: Match[] }

/** Verify-1 (S6): paste a post, see whether it is an official, registered post of a Waterlily brand. */
export function Verify() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return setError('Paste the text of a post to check.');
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api<Result>('/verify', { body: { text } }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <PublicShell>
      <Container width="reading">
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading level={1}>Check a post</Heading>
            <Text tone="secondary">Paste a post. We fingerprint it and look for a matching registration on Solana. Any edit, even one word, changes the fingerprint.</Text>
          </Stack>
          <form onSubmit={check} noValidate>
            <Stack gap={4}>
              <Field label="Post text" multiline rows={8} value={text} onChange={(e: { target: { value: string } }) => setText(e.target.value)} error={error} />
              <Button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Check'}</Button>
            </Stack>
          </form>
          {result?.official && (
            <Alert tone="success" title={`Official: ${result.brand ?? 'registered brand'}`}>
              Approved {result.approvedAt ? new Date(result.approvedAt).toLocaleString() : ''}, written to kit v{result.kitVersion}.
            </Alert>
          )}
          {result && !result.official && (
            <Alert tone="warning" title="Not an official post">No registration matches this text. It may be edited, or it was never approved by the brand.</Alert>
          )}
          {result && (
            <Stack gap={1}>
              <Text variant="small" tone="secondary">Fingerprint</Text>
              <Text variant="mono">{result.hash}</Text>
              {result.explorer && <Link href={result.explorer} external>See the registration on Solana Explorer</Link>}
              {result.publishedUrl && <Link href={result.publishedUrl} external>See the published post</Link>}
            </Stack>
          )}
          {result?.matches && result.matches.length > 1 && (
            // The same text can be registered by more than one brand; show every registration, earliest first.
            <Stack gap={2}>
              <Text variant="label">This exact text is registered {result.matches.length} times. The earliest is shown above.</Text>
              <Stack as="ol" gap={1}>
                {result.matches.map((m, i) => (
                  <li key={i}>
                    <Text variant="small">
                      {m.brand ?? 'Registered brand'}, kit v{m.kitVersion}, approved {m.approvedAt ? new Date(m.approvedAt).toLocaleString() : 'unknown'}
                      {m.explorer && <> · <Link href={m.explorer} external>Explorer</Link></>}
                    </Text>
                  </li>
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Container>
    </PublicShell>
  );
}
