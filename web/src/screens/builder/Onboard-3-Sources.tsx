/*
 * Data contract: Onboard-3-Sources (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Onboard-3-Sources,
 * note n-ob3; issue #50). Backend map §4, row "Onboard-3-Sources". Shape: SourcesData in ./types.
 *
 * | Field    | Source                                                                                       | Empty                       |
 * |----------|----------------------------------------------------------------------------------------------|-----------------------------|
 * | brand    | brands, profiles                                                                             | never                       |
 * | links    | sources (kind link), prefilled from BB-1 links; POST /api/brands/:id/sources, DELETE …/:id   | no rows: "nothing to read"  |
 * | uploads  | Client file picker; INTEGRATION Supabase Storage createSignedUploadUrl, then sources (upload)| none                        |
 * | accounts | connections; "Connect for publishing" -> GET /api/connect/x/start (LinkedIn the same)         | always X and LinkedIn       |
 *
 * States: success (links from step 1), empty (no links: "Skip, nothing to read" goes straight to the questions).
 * Reading post history from X / LinkedIn is coming soon; connecting now is for publishing only (note n-ob3.2).
 */
import { useState } from 'react';
import { Button, Heading, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { BuilderFilePicker } from '../../ui/domain/BuilderFilePicker';
import { BuilderLinkAdder } from '../../ui/domain/BuilderLinkAdder';
import { BuilderSourceList, type SourceRow } from '../../ui/domain/BuilderSourceList';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { useBuilderFlow } from './useBuilderFlow';
import type { SourcesData } from './types';

const row = (name: string, status: string): SourceRow => ({ id: `${status}:${name}`, name, status, tone: 'done' });

export function Onboard3Sources({ data, state = 'success' }: { data: SourcesData; state?: ScreenState }) {
  const { back, next, skip } = useBuilderFlow('sources');
  const [links, setLinks] = useState(state === 'empty' ? [] : data.links);
  const [connected, setConnected] = useState<string[]>([]);
  const remove = (id: string) => setLinks((l) => l.filter((r) => r.id !== id));
  const accounts = data.accounts.map((a) => (connected.includes(a.id) ? { ...a, status: 'Connected for publishing' } : a));
  return (
    <BuilderStep
      flow="sources"
      brand={data.brand}
      tag="FALLBACK"
      title="What should we read?"
      intro="Every fact we find keeps its source. Nothing is used until you confirm it."
      footer={
        // INTEGRATION: POST /api/brands/:id/ingest (backend map §4, row "Onboard-3b-Profiling, Ingest-Error").
        <BuilderStepFooter back={back} skip={skip} skipLabel="Skip, nothing to read" next={{ label: 'Read my sources', href: next, blockedReason: links.length ? null : 'Add a link or a file first, or skip.' }} />
      }
    >
      <Card as="section" header={<Heading level={2} size="lg">Links</Heading>}>
        {links.length ? (
          <BuilderSourceList label="Links to read" rows={links} actions={(r) => <Button variant="secondary" onClick={() => remove(r.id)} aria-label={`Remove ${r.name}`}>Remove</Button>} />
        ) : (
          <Text tone="secondary">Nothing to read yet. Add a link or a file, or skip and we&apos;ll ask you instead.</Text>
        )}
        <BuilderLinkAdder onAdd={(url) => setLinks((l) => [...l, row(url, 'Added here')])} />
      </Card>
      <Card as="section" variant="subtle" header={<Heading level={2} size="lg">Upload files</Heading>}>
        <BuilderFilePicker label="Browse files" accept=".pdf,.md,.docx" multiple hint="Brand guides, decks, product briefs, case studies. PDF, Markdown, DOCX. Marked as supplied by you." onFiles={(names) => setLinks((l) => [...l, ...names.map((n) => row(n, 'Supplied by you'))])} />
      </Card>
      <Card as="section" header={<Heading level={2} size="lg">Connected accounts</Heading>}>
        <BuilderSourceList
          label="Connected accounts"
          rows={accounts}
          actions={(a) => <Button variant="secondary" disabled={connected.includes(a.id)} onClick={() => setConnected((c) => [...c, a.id])} aria-label={`Connect for publishing: ${a.name}`}>Connect for publishing</Button>}
        />
      </Card>
    </BuilderStep>
  );
}
