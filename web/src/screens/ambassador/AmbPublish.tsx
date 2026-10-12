/*
 * Data contract: Amb-4-Publish, M-4-Publish (issue #53; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards
 * Amb-4-Publish and M-4-Publish). Backend map row "Amb-4, M-4" (.agentic/what/context/backend_map.md §4):
 * POST /api/submissions (LinkedIn or pasted URL; no X); tables submissions, connections; LinkedIn, verify_submission. Shape: PublishData.
 *
 * | Field                     | Source                                                                  | Empty when                     |
 * |---------------------------|-------------------------------------------------------------------------|--------------------------------|
 * | piece                     | the format chosen on Generate (session.ts; drafts.format)               | default: canvas LinkedIn post  |
 * | draft → preview, length   | the draft as edited on Generate (session.ts; drafts.body)               | default: canvas Amb-4 preview  |
 * | review → chips            | that draft's checks: score, open flags, disclosure (drafts checks)      | default: 91%, no flags         |
 * | connectedAs               | connections (LinkedIn account name)                                     | null: Connect LinkedIn; Post now off |
 * | routes[]                  | product rule: post on your behalf, paste your URL, submit a page URL     | never; no X route (ADR-002)    |
 * | notes[]                   | copy: why X is not paid; the fingerprint recorded with the payment      | never                          |
 *
 * Routes shown are the ones for the piece's channel (LinkedIn: post for me or paste URL; blog: page URL); the route used and the
 * link submitted go on to Status. States: success. Interactions: Post now; paste a LinkedIn URL or a page URL, validated on the client (X links refused); back to
 * editing; the post preview opens and closes. One route per piece (canvas note n-a4); share-sheet links accepted (note n-m4).
 */
import { Grid, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { AmbShell } from '../../ui/domain/AmbShell';
import { PageTitle } from './parts/PageTitle';
import { PublishRoute } from './parts/PublishRoute';
import { postPreview, reviewChips } from './copy';
import { useAmbassadorFlow } from './useAmbassadorFlow';
import type { Device, PublishData } from './types';

export interface AmbPublishProps {
  data: PublishData;
  device: Device;
  state?: ScreenState;
}

export function AmbPublish({ data, device }: AmbPublishProps) {
  const flow = useAmbassadorFlow(device);
  const desktop = device === 'desktop';
  const { piece = data.piece, draft = data.draft, review = data.review } = flow.session;
  const chips = reviewChips(review);
  const routes = data.routes
    .filter((r) => r.channel === piece.channel)
    .map((r, i) => (
      <PublishRoute
        key={r.id}
        route={r}
        selected={i === 0}
        mobile={!desktop}
        connectedAs={data.connectedAs}
        settingsHref={flow.pages.settings}
        onSubmit={(url) => {
          flow.remember({ route: r.id, submittedUrl: url });
          flow.go('verifying');
        }}
      />
    ));

  return (
    <AmbShell {...flow.shell} account={data.account} back={{ href: flow.back('publish'), label: 'Back to editing' }} title="Publish">
      <Stack gap={6}>
        <PageTitle
          title={`Publish your ${piece.name}`}
          back={desktop ? { href: flow.back('publish'), label: 'Back to editing' } : undefined}
          chips={desktop ? chips : chips.slice(0, 2)}
        />
        {desktop && (
          <Card variant="subtle" as="div">
            <details>
              <summary>Your post ({draft.length} characters)</summary>
              <Text>{postPreview(draft)}</Text>
            </details>
          </Card>
        )}
        {desktop ? <Grid min="sm" gap={4}>{routes}</Grid> : <Stack gap={4}>{routes}</Stack>}
        {desktop && <Stack gap={1}>{data.notes.map((n) => <Text key={n} variant="small" tone="secondary">{n}</Text>)}</Stack>}
      </Stack>
    </AmbShell>
  );
}
