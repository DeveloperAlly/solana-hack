/*
 * Data contract: Verify-2-NoMatch (canvas page "Verify + ledger", artboard Verify-2-NoMatch; built in #46 as the sample screen)
 *
 * Backend map row: "Verify-1, Verify-2, Verify-3" (.agentic/what/context/backend_map.md §4, "Public, settings, inbox").
 *
 * | Field             | Type                 | Source                                                                 |
 * |-------------------|----------------------|------------------------------------------------------------------------|
 * | query             | string               | Client: the text or URL the visitor pasted (the request body `text`)   |
 * | result.official   | false                | POST /api/verify -> `official` (web/worker/posts.ts verifyText)        |
 * | result.checked    | boolean              | POST /api/verify -> `checked`; false means Solana could not be checked |
 * | result.hash       | string (sha256 hex)  | POST /api/verify -> `hash`, the fingerprint that was looked up         |
 * | result.note       | string, optional     | POST /api/verify -> `note`, the plain reason when no valid record      |
 * | reportHref        | string, optional     | POST /api/verify/report (backend map row above; not built yet, so the  |
 * |                   |                      | action is shown without a target)                                      |
 *
 * States (canvas notes n-v2, and the C28 switcher):
 * - success: the check ran and nothing matched (`official: false, checked: true`). Neutral wording: not found is not proof of a fake.
 * - empty:   nothing checked yet (no query).
 * - loading: the check is running.
 * - error:   the check could not run (`checked: false`, or the request failed); the note says why.
 *
 * Presentational only: it takes `data` and `state` and makes no network call. The live Verify screen (screens/verify) is unchanged.
 */
import { PublicShell } from '../../ui/shells/PublicShell';
import { Button, Container, Heading, Stack, Text } from '../../ui/primitives';
import { EmptyState } from '../../ui/composites/EmptyState';
import { StatePanel } from '../../ui/composites/StatePanel';
import { VerifyInput } from '../../ui/domain/VerifyInput';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';

export interface VerifyNoMatchData {
  query: string;
  result: { official: false; checked: boolean; hash: string; note?: string };
  reportHref?: string;
}

export interface Verify2NoMatchProps {
  data: VerifyNoMatchData;
  state?: ScreenState;
}

export function Verify2NoMatch({ data, state = 'success' }: Verify2NoMatchProps) {
  return (
    <PublicShell>
      <Container width="wizard">
        <Stack gap={6}>
          <Heading level={1} size="2xl">Is this official?</Heading>
          <VerifyInput key={state} defaultValue={state === 'empty' ? '' : data.query} checking={state === 'loading'} />
          {state === 'empty' && (
            <EmptyState
              title="Paste a post to check it"
              body="Paste the exact text, or the original post's URL, rather than a screenshot or repost."
              actions={<Button href="/ledger" variant="secondary">Browse verified brands</Button>}
            />
          )}
          {state === 'loading' && <StatePanel kind="loading" title="Checking" body="Looking for a matching registration on Solana." />}
          {state === 'error' && (
            <StatePanel
              kind="error"
              title="Could not check right now"
              body={data.result.note ?? 'Solana could not be checked just now, so this cannot be confirmed. Try again in a minute.'}
              actions={<Button variant="secondary">Try again</Button>}
            />
          )}
          {state === 'success' && (
            <EmptyState
              icon="alert"
              title="Not found"
              body={
                <Stack gap={3}>
                  <Text tone="secondary">We couldn't match this to anything created or paid for through JamJam.</Text>
                  <Text>That doesn't prove it's fake. It means no brand on JamJam approved this text. If it claims to be from a brand, check the brand's own channels.</Text>
                  <Stack gap={1}>
                    <Text variant="label">Tips</Text>
                    <Text variant="small">Paste the exact text, or the original post's URL rather than a screenshot or repost.</Text>
                  </Stack>
                </Stack>
              }
              actions={
                <>
                  <Button variant="secondary">Report possible impersonation</Button>
                  <Button href="/ledger" variant="secondary">Browse verified brands</Button>
                </>
              }
            />
          )}
        </Stack>
      </Container>
    </PublicShell>
  );
}
