import { Button, Heading, Stack } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { DataTable } from '../../../ui/composites/DataTable';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';
import type { VoiceEditorData } from '../types';

type Row = VoiceEditorData['overrides'][number];

/** Per-channel overrides (n-ve 3): drawn on the canvas, ROADMAP and not built, so its actions are disabled. */
export function OverridesTable({ rows }: { rows: Row[] }) {
  return (
    <Card labelledBy="voice-overrides" header={<Stack direction="row" gap={2} align="center"><Heading level={2} size="lg" id="voice-overrides">Per-channel overrides</Heading><ComingSoonFlag tag="ROADMAP">Roadmap: not built</ComingSoonFlag></Stack>}>
      <DataTable
        caption="Overrides by channel"
        hideCaption
        rows={rows}
        rowKey={(r) => r.channel}
        columns={[{ key: 'channel', header: 'Channel', rowHeader: true }, { key: 'overrides', header: 'Overrides' }]}
        actions={(r) => <Button variant="secondary" disabled aria-label={`${r.action} ${r.channel} override (roadmap)`}>{r.action}</Button>}
      />
    </Card>
  );
}
