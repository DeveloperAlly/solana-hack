import { useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '../../ui/shells/AppShell';
import { Alert, Box, Button, Container, Field, Heading, Link, Stack, Text } from '../../ui/primitives';
import { api, ApiError } from '../../lib/api';

interface Post {
  id: string; brief: string; channel: string | null; body: string; status: string; kit_version: number | null; hash: string | null;
  checks: { slop?: { passed: boolean; hits: string[] }; voiceFit?: number | null; platform?: number | null; notes?: string[]; history?: unknown[]; lastAction?: string; source?: 'ai' | 'edit'; policy?: { claims: string; unsupported: string[]; blocked?: string[]; passed: boolean } };
  signature: string | null; published_url: string | null; rev: number;
}
const POLISH = [
  { action: 'review', label: 'Review' },
  { action: 'shorten', label: 'Shorten' },
  { action: 'clarify', label: 'Clarify' },
  { action: 'beautify', label: 'Beautify' },
  { action: 'beautify_accessible', label: 'Beautify (accessible)' },
];
// Same rule as the server (isCurrentPolicy): only a passing result in the current shape lets a post register.
const policyCurrent = (p?: { passed: boolean; blocked?: string[]; unsupported?: string[] }) => !!p && p.passed && Array.isArray(p.blocked) && !p.blocked.length && Array.isArray(p.unsupported) && !p.unsupported.length;
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
  const [capped, setCapped] = useState(false);

  async function load(id = brandId, limit = shown) {
    if (!id) return;
    const r = await api<{ posts: Post[]; more?: boolean; capped?: boolean }>(`/brands/${id}/posts?limit=${limit}`);
    setPosts(r.posts);
    setMore(!!r.more);
    setCapped(!!r.capped);
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
            <Button variant="secondary" onClick={() => { const n = Math.min(shown + 20, 500); setShown(n); load(brandId, n).catch((e) => setError(msg(e))); }}>Show older posts</Button>
          )}
          {capped && <Text variant="small" tone="secondary">Showing the newest 500 posts. Older posts are kept, and registered ones can still be checked on Verify.</Text>}
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
      // Reload either way: a blocked approval or a failed registration can change the post (and its revision), and
      // the next action must carry the revision the server now has.
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
          // Locked while an action runs, so a reload after polish cannot overwrite text typed in the meantime.
          <Field label="Post" multiline rows={8} value={text} disabled={!!busy} hint={busy ? 'Locked until the change finishes.' : undefined} onChange={(e: { target: { value: string } }) => setText(e.target.value)} />
        ) : (
          // Approved and registered text is read-only, so what is registered is exactly what was approved.
          <Box padding={4} background="subtle" radius="box"><Text>{post.body}</Text></Box>
        )}
        <Stack direction="row" gap={4} wrap>
          <Text variant="small">Slop check: {slop?.passed ? 'passed' : `failed (${slop?.hits.join(', ')})`}</Text>
          <Text variant="small">Voice fit: {post.checks.voiceFit ?? 'n/a'}</Text>
          <Text variant="small">Platform: {post.checks.platform ?? 'n/a'}</Text>
        </Stack>
        {post.status === 'drafted' && post.checks.policy && !post.checks.policy.passed && (
          <Alert tone="warning" title={post.checks.policy.blocked?.length ? 'Blocked by the content policy' : 'Blocked by your claims gate'}>
            {post.checks.policy.blocked?.length ? `Found: ${post.checks.policy.blocked.join(', ')}. This cannot be published. Rewrite it, then approve again.` : `No evidence for: ${post.checks.policy.unsupported.map((u) => (u.length > 200 ? `${u.slice(0, 200)}…` : u)).join(' · ')}. Add a source on your brand, or rewrite, then approve again.`}
          </Alert>
        )}
        {post.checks.notes && post.checks.notes.length > 0 && <Text variant="small" tone="secondary">To improve: {post.checks.notes.join(' · ')}</Text>}
        {post.status === 'drafted' && (
          <Stack gap={2}>
            <Text variant="label" id={`polish-${post.id}`}>Polish</Text>
            <Stack direction="row" gap={2} wrap role="group" aria-labelledby={`polish-${post.id}`}>
              {POLISH.map((p) => (
                <Button key={p.action} variant="secondary" disabled={!!busy || dirty || hiddenAi} onClick={() => run(p.action, () => api(`${base}/polish`, { body: { action: p.action, rev: post.rev } }))}>
                  {busy === p.action ? `${p.label}…` : p.label}
                </Button>
              ))}
              <Button variant="secondary" disabled={!!busy || dirty || !post.checks.history?.length} onClick={() => run('undo', () => api(`${base}/undo`, { body: { rev: post.rev } }))}>Undo</Button>
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
          {post.status !== 'registered' && dirty && <Button variant="secondary" disabled={!!busy} onClick={() => run('save', () => api(base, { method: 'PUT', body: { body: text, rev: post.rev } }))}>Save edits</Button>}
          {hiddenAi && <Button disabled={!!busy} onClick={() => run('redraft', () => api(`/brands/${brandId}/posts`, { body: { brief: post.brief, channel: post.channel ?? '' } }))}>{busy === 'redraft' ? 'Drafting…' : 'Draft again'}</Button>}
          {post.status === 'drafted' && !hiddenAi && !dirty && <Button disabled={!!busy || !slop?.passed} onClick={() => run('approve', () => api(`${base}/approve`, { body: { rev: post.rev } }))}>{busy === 'approve' ? 'Approving…' : 'Approve'}</Button>}
          {post.status === 'registering' && (
            // A send whose outcome was unknown: the server checks Solana and finishes or reopens it.
            <Button disabled={!!busy} onClick={() => run('register', () => api(`${base}/register`, { body: { publishedUrl: url, rev: post.rev } }))}>{busy === 'register' ? 'Checking Solana…' : 'Check registration'}</Button>
          )}
          {post.status === 'approved' && !policyCurrent(post.checks.policy) && (
            // Approved before the claims and content checks existed: run them before it can be registered.
            <Button disabled={!!busy} onClick={() => run('approve', () => api(`${base}/approve`, { body: { rev: post.rev } }))}>{busy === 'approve' ? 'Checking…' : 'Run approval checks'}</Button>
          )}
          {post.status === 'approved' && policyCurrent(post.checks.policy) && (
            <Button disabled={!!busy} onClick={() => run('register', () => api(`${base}/register`, { body: { publishedUrl: url, rev: post.rev } }))}>{busy === 'register' ? 'Registering on Solana…' : 'Register post'}</Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
