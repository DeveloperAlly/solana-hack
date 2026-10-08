import { useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '../../ui/shells/AppShell';
import { Alert, Box, Button, Container, Field, Heading, Link, Stack, Text } from '../../ui/primitives';
import { api, ApiError } from '../../lib/api';

interface Post {
  id: string; brief: string; channel: string | null; body: string; status: string; kit_version: number | null; hash: string | null;
  checks: { slop?: { passed: boolean; hits: string[] }; voiceFit?: number | null; platform?: number | null; notes?: string[]; history?: string[]; lastAction?: string };
  signature: string | null; published_url: string | null;
}
const POLISH = [
  { action: 'review', label: 'Review' },
  { action: 'shorten', label: 'Shorten' },
  { action: 'clarify', label: 'Clarify' },
  { action: 'beautify', label: 'Beautify' },
  { action: 'beautify_accessible', label: 'Beautify (accessible)' },
];
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Try again.');

/** S5 Create (thin): draft a post in the approved voice, check it, approve it, register it. */
export function Create() {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [channel, setChannel] = useState('LinkedIn');
  const [busy, setBusy] = useState(false);

  async function load(id = brandId) {
    if (!id) return;
    setPosts((await api<{ posts: Post[] }>(`/brands/${id}/posts`)).posts);
  }
  useEffect(() => {
    api<{ brands: { id: string }[] }>('/me')
      .then(async (me) => {
        if (!me.brands.length) return setError('Build your brand first, then come back to create.');
        setBrandId(me.brands[0].id);
        await load(me.brands[0].id);
      })
      .catch((e) => setError(msg(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function draft(e: FormEvent) {
    e.preventDefault();
    if (!brief.trim()) return setError('Say what the post is about.');
    setBusy(true);
    setError(null);
    try {
      await api(`/brands/${brandId}/posts`, { body: { brief, channel } });
      setBrief('');
      await load();
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <Container width="wizard">
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading level={1}>Create</Heading>
            <Text tone="secondary">Drafts use your approved voice. Each one is checked for AI slop before you see it, and nothing is registered until you approve it.</Text>
          </Stack>
          {error && <Alert tone="danger">{error}</Alert>}
          {brandId && (
            <form onSubmit={draft} noValidate>
              <Stack gap={4}>
                <Field label="What is the post about?" multiline value={brief} onChange={(e: { target: { value: string } }) => setBrief(e.target.value)} />
                <Field label="Channel" value={channel} onChange={(e: { target: { value: string } }) => setChannel(e.target.value)} />
                <Button type="submit" disabled={busy}>{busy ? 'Drafting… up to a minute' : 'Draft a post'}</Button>
              </Stack>
            </form>
          )}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} brandId={brandId!} onChange={() => load()} />
          ))}
        </Stack>
      </Container>
    </AppShell>
  );
}

function PostCard({ post, brandId, onChange }: { post: Post; brandId: string; onChange: () => Promise<void> }) {
  const [text, setText] = useState(post.body);
  const [url, setUrl] = useState(post.published_url ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [explorer, setExplorer] = useState<string | null>(post.signature ? `https://explorer.solana.com/tx/${post.signature}?cluster=devnet` : null);
  useEffect(() => setText(post.body), [post.body]);
  const base = `/brands/${brandId}/posts/${post.id}`;
  const dirty = text.trim() !== post.body;
  const slop = post.checks.slop;

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      await onChange();
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(null);
    }
  }
  return (
    <Box padding={5} border="default" radius="box">
      <Stack gap={4}>
        <Text variant="label">{post.channel ?? 'Post'} · {post.status}</Text>
        {post.status === 'registered' ? (
          <Box padding={4} background="subtle" radius="box"><Text>{post.body}</Text></Box>
        ) : (
          <Field label="Post" multiline rows={8} value={text} onChange={(e: { target: { value: string } }) => setText(e.target.value)} />
        )}
        <Stack direction="row" gap={4} wrap>
          <Text variant="small">Slop check: {slop?.passed ? 'passed' : `failed (${slop?.hits.join(', ')})`}</Text>
          <Text variant="small">Voice fit: {post.checks.voiceFit ?? 'n/a'}</Text>
          <Text variant="small">Platform: {post.checks.platform ?? 'n/a'}</Text>
        </Stack>
        {post.checks.notes && post.checks.notes.length > 0 && <Text variant="small" tone="secondary">To improve: {post.checks.notes.join(' · ')}</Text>}
        {post.status !== 'registered' && (
          <Stack gap={2}>
            <Text variant="label" id={`polish-${post.id}`}>Polish</Text>
            <Stack direction="row" gap={2} wrap role="group" aria-labelledby={`polish-${post.id}`}>
              {POLISH.map((p) => (
                <Button key={p.action} variant="secondary" disabled={!!busy || dirty} onClick={() => run(p.action, () => api(`${base}/polish`, { body: { action: p.action } }))}>
                  {busy === p.action ? `${p.label}…` : p.label}
                </Button>
              ))}
              <Button variant="secondary" disabled={!!busy || dirty || !post.checks.history?.length} onClick={() => run('undo', () => api(`${base}/undo`, { body: {} }))}>Undo</Button>
            </Stack>
            {post.checks.lastAction && <Text variant="small" tone="secondary">Last change: {post.checks.lastAction.replace('_', ' ')}. Undo restores the previous text.</Text>}
          </Stack>
        )}
        {post.status === 'approved' && (
          <Stack gap={3}>
            <Text>Post it on {post.channel ?? 'your channel'} (copy the text exactly), then paste the link here and register it.</Text>
            <Stack direction="row" gap={3} wrap>
              <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(post.body)}>Copy text</Button>
            </Stack>
            <Field label="Link to the published post" hint="Optional for the demo" value={url} onChange={(e: { target: { value: string } }) => setUrl(e.target.value)} />
          </Stack>
        )}
        {post.status === 'registered' && post.hash && (
          <Alert tone="success" title="Registered">
            <Text as="span" variant="mono">{post.hash}</Text>
          </Alert>
        )}
        {explorer && <Link href={explorer} external>View the registration on Solana Explorer</Link>}
        {error && <Alert tone="danger">{error}</Alert>}
        <Stack direction="row" gap={3} wrap>
          {post.status !== 'registered' && dirty && <Button variant="secondary" disabled={!!busy} onClick={() => run('save', () => api(base, { method: 'PUT', body: { body: text } }))}>Save edits</Button>}
          {post.status === 'drafted' && !dirty && <Button disabled={!!busy || !slop?.passed} onClick={() => run('approve', () => api(`${base}/approve`, { body: {} }))}>{busy === 'approve' ? 'Approving…' : 'Approve'}</Button>}
          {post.status === 'approved' && (
            <Button disabled={!!busy} onClick={() => run('register', async () => {
              const r = await api<{ explorer: string }>(`${base}/register`, { body: { publishedUrl: url } });
              setExplorer(r.explorer);
            })}>{busy === 'register' ? 'Registering on Solana…' : 'Register post'}</Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
