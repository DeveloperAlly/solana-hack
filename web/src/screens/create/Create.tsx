import { useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '../../ui/shells/AppShell';
import { Alert, Box, Button, Container, Field, Heading, Link, Stack, Text } from '../../ui/primitives';
import { api, ApiError } from '../../lib/api';

interface Post {
  id: string; brief: string; channel: string | null; body: string; status: string; kit_version: number | null; hash: string | null;
  checks: { slop?: { passed: boolean; hits: string[] }; voiceFit?: number | null; platform?: number | null; notes?: string[]; source?: 'ai' | 'edit' };
  signature: string | null; published_url: string | null; rev: number;
}
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Try again.');

/** S5 Create (thin): draft a post in the approved voice, check it, approve it, register it. */
export function Create() {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [channel, setChannel] = useState('LinkedIn');
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(20);
  const [more, setMore] = useState(false);

  async function load(id = brandId, limit = shown) {
    if (!id) return;
    const r = await api<{ posts: Post[]; more?: boolean }>(`/brands/${id}/posts?limit=${limit}`);
    setPosts(r.posts);
    setMore(!!r.more);
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
          {more && (
            <Button variant="secondary" onClick={() => { const n = shown + 20; setShown(n); load(brandId, n).catch((e) => setError(msg(e))); }}>Show older posts</Button>
          )}
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
  // Derived from the post on every render, so a reload after reconciliation shows the link without a remount.
  const explorer = post.status === 'registered' && post.signature ? `https://explorer.solana.com/tx/${post.signature}?cluster=devnet` : null;
  useEffect(() => setText(post.body), [post.body]);
  const base = `/brands/${brandId}/posts/${post.id}`;
  const dirty = post.status === 'drafted' && text.trim() !== post.body;
  const slop = post.checks.slop;
  const hiddenAi = post.status === 'drafted' && !slop?.passed && post.checks.source !== 'edit';

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(msg(e));
    }
    try {
      // Reload either way: a failed registration can still change the post (locked, reopened, new revision), and the
      // next action must carry the revision the server now has.
      await onChange();
    } catch {
      // Keep the action's error on screen; the list refreshes on the next action.
    } finally {
      setBusy(null);
    }
  }
  return (
    <Box padding={5} border="default" radius="box">
      <Stack gap={4}>
        <Text variant="label">{post.channel ?? 'Post'} · {post.status}</Text>
        {hiddenAi ? (
          // R9: AI text that failed the slop check is never shown.
          <Alert tone="warning" title="This draft failed the slop check, so it stays hidden">
            Found: {slop?.hits.join(', ')}. Draft it again.
          </Alert>
        ) : post.status === 'drafted' ? (
          <Field label="Post" multiline rows={8} value={text} onChange={(e: { target: { value: string } }) => setText(e.target.value)} />
        ) : (
          // Approved and registered text is read-only, so what is registered is exactly what was approved.
          <Box padding={4} background="subtle" radius="box"><Text>{post.body}</Text></Box>
        )}
        <Stack direction="row" gap={4} wrap>
          <Text variant="small">Slop check: {slop?.passed ? 'passed' : `failed (${slop?.hits.join(', ')})`}</Text>
          <Text variant="small">Voice fit: {post.checks.voiceFit ?? 'n/a'}</Text>
          <Text variant="small">Platform: {post.checks.platform ?? 'n/a'}</Text>
        </Stack>
        {post.checks.notes && post.checks.notes.length > 0 && <Text variant="small" tone="secondary">To improve: {post.checks.notes.join(' · ')}</Text>}
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
          {post.status !== 'registered' && dirty && <Button variant="secondary" disabled={!!busy} onClick={() => run('save', () => api(base, { method: 'PUT', body: { body: text, rev: post.rev } }))}>Save edits</Button>}
          {hiddenAi && <Button disabled={!!busy} onClick={() => run('redraft', () => api(`/brands/${brandId}/posts`, { body: { brief: post.brief, channel: post.channel ?? '' } }))}>{busy === 'redraft' ? 'Drafting…' : 'Draft again'}</Button>}
          {post.status === 'drafted' && !hiddenAi && !dirty && <Button disabled={!!busy || !slop?.passed} onClick={() => run('approve', () => api(`${base}/approve`, { body: { rev: post.rev } }))}>{busy === 'approve' ? 'Approving…' : 'Approve'}</Button>}
          {post.status === 'registering' && (
            // A send whose outcome was unknown: the server checks Solana and finishes or reopens it.
            <Button disabled={!!busy} onClick={() => run('register', () => api(`${base}/register`, { body: { publishedUrl: url, rev: post.rev } }))}>{busy === 'register' ? 'Checking Solana…' : 'Check registration'}</Button>
          )}
          {post.status === 'approved' && (
            <Button disabled={!!busy} onClick={() => run('register', () => api(`${base}/register`, { body: { publishedUrl: url, rev: post.rev } }))}>{busy === 'register' ? 'Registering on Solana…' : 'Register post'}</Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
