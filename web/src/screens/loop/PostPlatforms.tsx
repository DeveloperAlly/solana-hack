import type { Post } from '../../domain/post';
import { Badge, Heading, Link, Stack, Text } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import { List, ListRow } from '../../ui/composites/ListRow';
import { useLoopLinks } from './paths';

/** Post-Detail's "Where it went" and "Amplified by" (canvas Post-Detail), from the post's lifecycle. */
export function PostPlatforms({ post }: { post: Post }) {
  const { links } = useLoopLinks();
  const runs = post.lifecycle.published;
  const amps = post.lifecycle.amplified;
  return (
    <Stack gap={4}>
      <DataTable
        caption="Where it went"
        rows={runs}
        rowKey={(r) => r.platform}
        empty={<Text variant="small" tone="secondary">Not planned on any platform yet.</Text>}
        columns={[
          { key: 'platform', header: 'Platform', rowHeader: true },
          { key: 'version', header: 'Version' },
          { key: 'detail', header: 'Status', cell: (r) => (r.status === 'failed' ? <><Badge tone="warning">Failed</Badge> {r.detail} <Link href={links.connections}>Connections</Link></> : r.detail) },
          { key: 'proof', header: 'Proof', cell: (r) => (r.registered ? <Link href={links.verifyMatch}>Registered</Link> : <Text as="span" variant="small" tone="secondary">Not yet</Text>) },
        ]}
      />
      <Heading level={3} size="lg">Amplified by</Heading>
      {amps.length === 0 ? (
        <Text variant="small" tone="secondary">No ambassadors have shared it yet.</Text>
      ) : (
        <List label="Amplified by">
          {amps.map((a) => <ListRow key={a.id} title={`${a.who} · ${a.platform}${a.note ? ` · ${a.note}` : ''}`} status={{ label: a.label }} />)}
        </List>
      )}
    </Stack>
  );
}
