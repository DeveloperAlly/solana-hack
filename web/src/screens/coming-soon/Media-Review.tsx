/*
 * Data contract: Media-Review (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Media-Review; issue #51)
 * Backend map: no media row yet (canvas cites the draft backlog). Checks come from §4 row "Amb-3, M-3"
 * GET /api/drafts/:id/checks (D3 ChecksPanel kinds); approval from row "Draft-Review" POST …/approve, then a SAS
 * content attestation (row "Publish and Registered"). Shape: MediaReviewData in ./types.
 *
 * | Field            | Source                                                  | Empty when            |
 * |------------------|---------------------------------------------------------|-----------------------|
 * | checks[].slide   | Slide number in the media draft                         | no slides             |
 * | checks[].text    | Slide text                                              | never                 |
 * | checks[].claims  | Claims check: backed by an approved claim, or blocked   | never                 |
 * | checks[].slop    | No-AI-slop check result                                 | never                 |
 * | checks[].alt     | Alt text for the slide image                            | "[alt]" until written |
 *
 * States: success (slide 3 blocked until it has a source), loading (checks running), error (checks failed to run).
 */
import { useState } from 'react';
import { Alert, Button, Stack } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import { StatePanel } from '../../ui/composites/StatePanel';
import { SoonHubFrame } from '../../ui/domain/SoonHubFrame';
import { SoonInlineForm } from '../../ui/domain/SoonInlineForm';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { useSoonRoutes } from './routes';
import { tableState } from './tableState';
import { ChipBadge } from './ChipBadge';
import { checkChips } from './status';
import { httpsUrl } from './validate';
import type { MediaReviewData, SlideCheck } from './types';

export function MediaReview({ data, state = 'success' }: { data: MediaReviewData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const [checks, setChecks] = useState<SlideCheck[]>(data.checks);
  const [fixing, setFixing] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const blocked = checks.filter((c) => c.claims === 'unsupported');
  // INTEGRATION: POST …/claims with the evidence URL, then re-run GET /api/drafts/:id/checks.
  const addSource = (id: string) => {
    setChecks((cs) => cs.map((c) => (c.id === id ? { ...c, claims: 'backed' } : c)));
    setFixing(null);
  };
  return (
    <SoonHubFrame header={{ title: 'Review your carousel', intro: 'Every slide passes the same checks as a post before you can approve it.', definedIn: 'draft backlog (media review); ChecksPanel D3 in the component inventory' }}>
      {approved ? (
        // INTEGRATION: POST /api/drafts/:id/approve, then the Registrar's SAS content attestation.
        <StatePanel kind="success" title="Approved and registered" body="Every slide passed its checks. Anyone can now check this carousel on Verify." actions={<Button href={routes.publishCalendar}>Schedule it</Button>} />
      ) : (
        <Stack gap={4}>
          <DataTable<SlideCheck>
            caption="Checks on every slide"
            columns={[
              { key: 'slide', header: 'Slide', rowHeader: true },
              { key: 'text', header: 'Text' },
              { key: 'claims', header: 'Claims', cell: (r) => <ChipBadge chip={checkChips[r.claims]} /> },
              { key: 'slop', header: 'Slop', cell: (r) => <ChipBadge chip={checkChips[r.slop]} /> },
              { key: 'alt', header: 'Alt text' },
            ]}
            rows={checks}
            rowKey={(r) => r.id}
            state={tableState[state]}
            error={<Alert tone="danger" title="The checks could not run. Nothing was approved." />}
            actions={(r) => r.claims === 'unsupported' && <Button variant="secondary" aria-label={`Add a source for slide ${r.slide}`} onClick={() => setFixing(r.id)}>Add a source</Button>}
          />
          {fixing && (
            <SoonInlineForm
              label="Add a source"
              fields={[{ name: 'url', label: 'Evidence URL', type: 'url', hint: 'A page that supports the claim on this slide.', validate: httpsUrl }]}
              submitLabel="Attach source"
              onSubmit={() => addSource(fixing)}
              onCancel={() => setFixing(null)}
            />
          )}
          {blocked.map((c) => <Alert key={c.id} tone="warning" title={`Slide ${c.slide} has a claim with no evidence. Add a source or change the slide to approve.`} />)}
          <Stack direction="row" gap={3} wrap>
            <Button onClick={() => setApproved(true)} disabled={blocked.length > 0 || state !== 'success'}>Approve and register</Button>
            <Button href={routes.mediaComposer} variant="secondary">Edit slides</Button>
          </Stack>
        </Stack>
      )}
    </SoonHubFrame>
  );
}
