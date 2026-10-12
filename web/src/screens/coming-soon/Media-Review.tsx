/*
 * Data contract: Media-Review (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Media-Review; issue #51)
 * Backend map: no media row yet (proposed in issue #51). Checks come from §4 row "Amb-3, M-3"
 * GET /api/drafts/:id/checks (D3 ChecksPanel kinds); approval from row "Draft-Review" POST …/approve, then a SAS
 * content attestation (row "Publish and Registered"). Shape: MediaReviewData in ./types.
 *
 * | Field            | Source                                                  | Empty when            |
 * |------------------|---------------------------------------------------------|-----------------------|
 * | formats[]        | The media draft (useMediaFlow): one check per slide of the chosen type | no slides  |
 * | checks[n].claims | Claims check for slide n: backed, no claims, or unsupported (blocks) | no claims  |
 * | checks[n].slop   | No-AI-slop check for slide n: passed or failed (blocks)  | passed               |
 * | checks[n].claimId| The claims row behind slide n's claim (Claims shows it approved) | no claim     |
 * | checks[n].alt    | Alt text for slide n's image                            | "[alt]" until written |
 *
 * Badges and the approve gate both read checkStatus (./slideChecks), so they cannot disagree.
 * States: success (slide 3 blocked until it has a source), loading (checks running), error (checks failed to run).
 */
import { useState } from 'react';
import { Alert, Button, Stack, Text } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import { StatePanel } from '../../ui/composites/StatePanel';
import { SoonPage } from './SoonPage';
import { InlineForm } from '../../ui/composites/InlineForm';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { useSoonRoutes } from './routes';
import { tableState } from './tableState';
import { ChipBadge } from './ChipBadge';
import { checkStatus, deriveChecks, resultStatus } from './slideChecks';
import { mediaKindNames, useMediaFlow } from './useMediaFlow';
import { useSoonSession } from './useSoonSession';
import { httpsUrl } from './validate';
import type { MediaReviewData, SlideCheck } from './types';

export function MediaReview({ data, state = 'success' }: { data: MediaReviewData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const [session, set] = useSoonSession();
  const media = useMediaFlow(data.formats);
  // One check per slide of the draft (Composer's edits and media type); a claim approved on Claims counts as backed.
  const fixtureText = (id: string) => data.formats.flatMap((f) => f.slides).find((s) => s.id === id)?.text;
  const checks = deriveChecks({ slides: media.slides, defaults: data.checks[media.kind], fixtureText, rerunText: media.rerunText, approvedClaim: (id) => session.claims?.[id]?.status === 'approved' });
  const stale = checks.some((c) => c.claims === 'stale');
  const kindLabel = mediaKindNames[media.kind];
  const [fixing, setFixing] = useState<string | null>(null);
  const blocked = checks.filter((c) => checkStatus(c).blocking);
  // INTEGRATION: POST …/claims with the evidence URL, then re-run GET /api/drafts/:id/checks.
  const addSource = (checkId: string, url: string) => {
    const claimId = checks.find((c) => c.id === checkId)?.claimId;
    if (claimId) set({ claims: { ...session.claims, [claimId]: { ...session.claims?.[claimId], evidence: url, status: 'approved', expires: '[date]' } } });
    setFixing(null);
  };
  return (
    <SoonPage header={{ title: `Review your ${kindLabel}`, intro: 'Every slide passes the same checks as a post before you can approve it.', definedIn: 'ChecksPanel D3 in the component inventory; no backend row yet (proposed in issue #51)' }}>
      {media.approved ? (
        // INTEGRATION: POST /api/drafts/:id/approve, then the Registrar's SAS content attestation.
        <StatePanel kind="success" title="Approved and registered" body={`Every slide passed its checks. Anyone can now check this ${kindLabel} on Verify.`} actions={<Button href={routes.publishCalendar}>Schedule it</Button>} />
      ) : (
        <Stack gap={4}>
          {media.exportAs && <Text tone="secondary">Format: {media.exportAs.label}. {media.exportAs.detail}</Text>}
          <DataTable<SlideCheck>
            caption="Checks on every slide"
            columns={[
              { key: 'slide', header: 'Slide', rowHeader: true },
              { key: 'text', header: 'Text' },
              { key: 'claims', header: 'Claims', cell: (r) => <ChipBadge chip={resultStatus(r.claims)} /> },
              { key: 'slop', header: 'Slop', cell: (r) => <ChipBadge chip={resultStatus(r.slop)} /> },
              { key: 'alt', header: 'Alt text' },
            ]}
            rows={checks}
            rowKey={(r) => r.id}
            state={tableState[state]}
            error={<Alert tone="danger" title="The checks could not run. Nothing was approved." />}
            actions={(r) => r.claims === 'unsupported' && r.claimId !== undefined && <Button variant="secondary" aria-label={`Add a source for slide ${r.slide}`} onClick={() => setFixing(r.id)}>Add a source</Button>}
          />
          {fixing && (
            <InlineForm surface="card"
              label="Add a source"
              fields={[{ name: 'url', label: 'Evidence URL', type: 'url', hint: 'A page that supports the claim on this slide.', validate: httpsUrl }]}
              submitLabel="Attach source"
              onSubmit={(v) => addSource(fixing, v.url)}
              onCancel={() => setFixing(null)}
            />
          )}
          {blocked.map((c) => <Alert key={c.id} tone="warning" title={checkStatus(c).label} />)}
          <Stack direction="row" gap={3} wrap>
            {/* INTEGRATION: GET /api/drafts/:id/checks on the edited slides. */}
            {stale && <Button variant="secondary" onClick={() => media.rerunChecks(media.slides)}>Re-run checks</Button>}
            <Button onClick={media.approve} disabled={blocked.length > 0 || state !== 'success'}>Approve and register</Button>
            <Button href={routes.mediaComposer} variant="secondary">Edit slides</Button>
          </Stack>
        </Stack>
      )}
    </SoonPage>
  );
}
