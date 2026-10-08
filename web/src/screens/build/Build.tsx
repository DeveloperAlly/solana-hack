import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { PublicShell } from '../../ui/shells/PublicShell';
import { Alert, Box, Button, Choice, Container, Field, Heading, Link, Stack, Text } from '../../ui/primitives';
import { api, ApiError } from '../../lib/api';
import { CLAIMS_GATE, DIALS, STEPS, templateDials, normaliseVoice, VOICE_TEMPLATES, type Step } from './steps';

// Shapes returned by GET /api/brands/:id (web/worker/api.ts).
export interface Brand { id: string; name: string; type: string; description: string | null; website: string | null; goal: string | null; channel: string | null }
interface Answer { step: string; data: Record<string, string>; skipped: boolean }
interface Source { id: string; url: string; title: string | null; status: string; error: string | null }
interface Evidence { id: string; section: string; claim: string; quote: string | null; origin: string; source_id: string | null }
interface Section { section: string; body: string; citations: string[]; status: string }
interface Gate { gate: string; approved_by: string; approved_at: string; note: string | null }
export interface KitPayload { brand?: { id: string; name: string }; sections: { section: string; body: string; citations: string[]; status: string }[]; gates: { gate: string; approved_by: string | null; approved_at: string }[] }
interface Kit { id: string; version: number; hash: string; status: string; signature: string | null; attestation: string | null; created_at: string; error: string | null; payload?: KitPayload | null }
export interface BrandState { brand: Brand; answers: Answer[]; sources: Source[]; evidence: Evidence[]; sections: Section[]; gates: Gate[]; kits: Kit[] }

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Try again.');

function Progress({ current }: { current: number }) {
  return (
    <Text variant="small" tone="secondary">
      Step {current + 1} of {STEPS.length}: {STEPS[current].title}
      {STEPS[current].minutes ? ` · about ${STEPS[current].minutes} min` : ''}
    </Text>
  );
}

/** Build your brand (S1-S4): loads the owner's brand and walks the intake, gates and kit steps. */
export function Build() {
  const params = useParams();
  const slug = (params['*'] ?? '').split('/')[0] || '';
  const navigate = useNavigate();
  const [state, setState] = useState<BrandState | null>(null);
  const [noBrand, setNoBrand] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id?: string) => {
    try {
      let brandId = id ?? state?.brand.id;
      if (!brandId) {
        const me = await api<{ brands: Brand[] }>('/me');
        if (!me.brands.length) return setNoBrand(true);
        brandId = me.brands[0].id;
      }
      setState(await api<BrandState>(`/brands/${brandId}`));
      setNoBrand(false);
    } catch (e) {
      setError(msg(e));
    }
  }, [state?.brand.id]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const index = STEPS.findIndex((s) => s.slug === slug);
  const go = (i: number) => navigate(`/build/${STEPS[Math.max(0, Math.min(STEPS.length - 1, i))].slug}`);

  let content;
  if (error && !state && !noBrand) content = <Alert tone="danger" title="Could not load your brand">{error}</Alert>;
  else if (noBrand) {
    if (slug !== 'basics') return <Navigate to="/build/basics" replace />;
    content = <BasicsStep state={null} onSaved={async (id) => { await load(id); go(1); }} />;
  } else if (!state) content = <Text tone="secondary">Loading your brand…</Text>;
  else if (index < 0) return <Navigate to={`/build/${firstOpenStep(state)}`} replace />;
  else {
    const step = STEPS[index];
    const next = () => go(index + 1);
    const back = () => go(index - 1);
    const refresh = () => load();
    content = (
      <Stack gap={6}>
        <Progress current={index} />
        {step.kind === 'basics' && <BasicsStep state={state} onSaved={async () => { await refresh(); next(); }} />}
        {step.kind === 'sources' && <SourcesStep state={state} onChange={refresh} onNext={next} onBack={back} />}
        {step.kind === 'questions' && <QuestionsStep key={step.slug} step={step} state={state} onSaved={async () => { await refresh(); next(); }} onBack={back} />}
        {step.kind === 'section' && <SectionStep key={step.slug} step={step} state={state} onChange={refresh} onNext={next} onBack={back} />}
        {step.kind === 'kit' && <KitStep state={state} onChange={refresh} onBack={back} />}
      </Stack>
    );
  }
  return (
    <PublicShell>
      <Container width="wizard">{content}</Container>
    </PublicShell>
  );
}

/** Resume at the first step without an answer, draft or approval. */
function firstOpenStep(s: BrandState): string {
  for (const step of STEPS) {
    if (step.kind === 'questions' && !s.answers.some((a) => a.step === step.answerStep)) return step.slug;
    if (step.kind === 'section' && !s.sections.some((x) => x.section === step.section && x.status === 'approved')) return step.slug;
  }
  return 'kit';
}

function Nav({ onBack, children }: { onBack?: () => void; children?: React.ReactNode }) {
  return (
    <Stack direction="row" gap={3} wrap justify="between" align="center">
      {onBack ? <Button variant="secondary" onClick={onBack}>Back</Button> : <span />}
      <Stack direction="row" gap={3} wrap>{children}</Stack>
    </Stack>
  );
}

function BasicsStep({ state, onSaved }: { state: BrandState | null; onSaved: (id: string) => void | Promise<void> }) {
  const b = state?.brand;
  const [form, setForm] = useState({ name: b?.name ?? '', type: b?.type ?? 'company', description: b?.description ?? '', website: b?.website ?? '', goal: b?.goal ?? '', channel: b?.channel ?? '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError('A brand name is required.');
    setBusy(true);
    setError(null);
    try {
      const res = b
        ? await api<{ brand: Brand }>(`/brands/${b.id}`, { method: 'PATCH', body: form })
        : await api<{ brand: Brand }>('/brands', { body: form });
      await api(`/brands/${res.brand.id}/answers/basics`, { method: 'PUT', body: { data: { description: form.description, goal: form.goal, channel: form.channel, type: form.type } } });
      await onSaved(res.brand.id);
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate>
      <Stack gap={5}>
        <Heading level={1}>Basics</Heading>
        <Text tone="secondary">No website yet? A name is enough.</Text>
        <Field label="Brand name" value={form.name} onChange={set('name')} error={!form.name.trim() ? error : null} autoComplete="organization" />
        <Choice legend="What kind of brand is it?" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={[{ value: 'company', label: 'A company or product' }, { value: 'person', label: 'A person' }, { value: 'founder_linked', label: 'A founder and their company' }]} />
        <Field label="One-line description" value={form.description} onChange={set('description')} />
        <Field label="Website" hint="Optional" value={form.website} onChange={set('website')} inputMode="url" />
        <Field label="Where do you want it in 12 months?" value={form.goal} onChange={set('goal')} />
        <Field label="Main channel" hint="For example LinkedIn, X, a newsletter" value={form.channel} onChange={set('channel')} />
        {error && form.name.trim() && <Alert tone="danger">{error}</Alert>}
        <Nav><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</Button></Nav>
      </Stack>
    </form>
  );
}

function SourcesStep({ state, onChange, onNext, onBack }: { state: BrandState; onChange: () => Promise<void>; onNext: () => void; onBack: () => void }) {
  const [url, setUrl] = useState(state.sources.length ? '' : state.brand.website ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return setError('Paste a link first.');
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await api<{ facts: number; dropped: number }>(`/brands/${state.brand.id}/sources`, { body: { url } });
      setResult(`Read it. ${r.facts} fact${r.facts === 1 ? '' : 's'} saved with quotes from the page.`);
      setUrl('');
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(false);
      await onChange();
    }
  }
  return (
    <Stack gap={5}>
      <Heading level={1}>Your links</Heading>
      <Text tone="secondary">We read each page and keep only facts we can quote from it. Every fact shows where it came from.</Text>
      <form onSubmit={add} noValidate>
        <Stack gap={3}>
          <Field label="Link to a page about you" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" error={error} />
          <Button type="submit" disabled={busy}>{busy ? 'Reading the page…' : 'Read this page'}</Button>
        </Stack>
      </form>
      {result && <Alert tone="success">{result}</Alert>}
      {state.sources.length > 0 && (
        <Stack gap={2} as="ul">
          {state.sources.map((s) => (
            <li key={s.id}>
              <Text>
                {s.title || s.url} · {s.status === 'read' ? `${state.evidence.filter((e) => e.source_id === s.id).length} facts` : s.status}
                {s.error ? ` (${s.error})` : ''}
              </Text>
            </li>
          ))}
        </Stack>
      )}
      <Nav onBack={onBack}><Button variant={state.sources.length ? 'primary' : 'secondary'} onClick={onNext}>{state.sources.length ? 'Continue' : 'Skip for now'}</Button></Nav>
    </Stack>
  );
}

function QuestionsStep({ step, state, onSaved, onBack }: { step: Step; state: BrandState; onSaved: () => Promise<void>; onBack: () => void }) {
  const prev = state.answers.find((a) => a.step === step.answerStep);
  const isVoice = step.answerStep === 'voice';
  // Voice answers saved by the older form are normalised onto today's templates and dials, so every displayed value is saved.
  const [data, setData] = useState<Record<string, string>>(isVoice ? normaliseVoice(prev?.data) : prev?.data ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const known = state.evidence.filter((e) => e.origin === 'source' && e.section === (step.answerStep === 'golden_circle' ? 'purpose' : step.answerStep));

  async function save(skipped: boolean) {
    setBusy(true);
    setError(null);
    try {
      await api(`/brands/${state.brand.id}/answers/${step.answerStep}`, { method: 'PUT', body: { data, skipped } });
      await onSaved();
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(false); }} noValidate>
      <Stack gap={5}>
        <Heading level={1}>{step.title}</Heading>
        <Text tone="secondary">Short answers are fine. Skip anything and come back later.</Text>
        {known.length > 0 && (
          <Alert tone="info" title="Already found on your pages">
            {known.slice(0, 3).map((e) => e.claim).join(' · ')}
          </Alert>
        )}
        {isVoice ? (
          <Stack gap={5}>
            {state.gates.some((g) => g.gate === 'voice') && <Alert tone="warning">Your voice is approved (Gate 3). Saving a change here reopens Gate 3, and the voice section needs drafting and approving again before the next kit version.</Alert>}
            <Choice legend="Start from a template (it sets the dials below)" value={data.template ?? ''} onChange={(v) => setData({ ...templateDials(v), sample: data.sample ?? '' })} options={VOICE_TEMPLATES} />
            {data.template === 'flirty' && <Alert tone="info">Flirty stays light and playful. Before any post can be approved it is checked for sexual content, anything involving minors and explicit language, and blocked if it has any of them.</Alert>}
            {DIALS.map((d) => (
              <Choice
                key={d.key}
                legend={`${d.label}: 1 is ${d.low.toLowerCase()}, 5 is ${d.high.toLowerCase()}`}
                value={data[d.key] ?? '3'}
                onChange={(v) => setData({ ...data, [d.key]: v })}
                options={['1', '2', '3', '4', '5'].map((n) => ({ value: n, label: n }))}
              />
            ))}
            <Choice legend="Claims gate: what needs evidence before it can be published?" value={data.claims ?? '4'} onChange={(v) => setData({ ...data, claims: v })} options={CLAIMS_GATE} />
            <Field label="A sentence you would actually write" hint="Optional. It helps us match your voice." multiline value={data.sample ?? ''} onChange={(e) => setData({ ...data, sample: e.target.value })} />
          </Stack>
        ) : (
          step.questions!.map((q) => (
            <Field key={q.key} label={q.label} hint={q.hint} multiline={q.multiline} value={data[q.key] ?? ''} onChange={(e: { target: { value: string } }) => setData({ ...data, [q.key]: e.target.value })} />
          ))
        )}
        {error && <Alert tone="danger">{error}</Alert>}
        <Nav onBack={onBack}>
          <Button variant="secondary" disabled={busy} onClick={() => save(true)}>Skip for now</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</Button>
        </Nav>
      </Stack>
    </form>
  );
}

function SectionStep({ step, state, onChange, onNext, onBack }: { step: Step; state: BrandState; onChange: () => Promise<void>; onNext: () => void; onBack: () => void }) {
  const section = state.sections.find((s) => s.section === step.section);
  const gate = step.gate ? state.gates.find((g) => g.gate === step.gate) : undefined;
  const [text, setText] = useState(section?.body ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setText(section?.body ?? ''), [section?.body]);
  const dirty = !!section && text.trim() !== section.body;
  const cited = state.evidence.filter((e) => section?.citations.includes(e.id));
  const sourceOf = (id: string | null) => state.sources.find((s) => s.id === id);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      await onChange();
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(null);
    }
  }
  const base = `/brands/${state.brand.id}/sections/${step.section}`;
  const draft = () => run('draft', () => api(`${base}/draft`, { body: {} }));
  const saveEdit = () => run('save', () => api(base, { method: 'PUT', body: { body: text } }));
  const approve = () => run('approve', async () => {
    if (dirty) await api(base, { method: 'PUT', body: { body: text } });
    await api(`${base}/approve`, { body: { note: 'approved in intake' } });
    onNext();
  });

  return (
    <Stack gap={5}>
      <Heading level={1}>{step.title}</Heading>
      <Text tone="secondary">
        {step.gate ? 'This is a decision gate. You approve it, and the approval is recorded with who and when.' : 'A first draft from your answers and sources. Edit anything.'}
      </Text>
      {!section ? (
        <Stack gap={3} align="start">
          <Text>Nothing drafted yet.</Text>
          <Button onClick={draft} disabled={!!busy}>{busy === 'draft' ? 'Drafting… this takes up to a minute' : 'Draft it for me'}</Button>
        </Stack>
      ) : (
        <Stack gap={4}>
          <Field label={`${step.title} draft`} multiline rows={10} value={text} onChange={(e) => setText(e.target.value)} />
          <Box padding={4} background="subtle" radius="box">
            <Stack gap={2}>
              <Text variant="label">Where this came from</Text>
              {cited.length === 0 ? (
                <Text variant="small" tone="secondary">No evidence cited. Treat the whole draft as an assumption until you edit or approve it.</Text>
              ) : (
                <Stack gap={1} as="ul">
                  {cited.map((e) => (
                    <li key={e.id}>
                      <Text variant="small">
                        {e.origin === 'owner_answer' ? 'Your answer' : 'Source'}: {e.claim}
                        {sourceOf(e.source_id) && <> (<Link href={sourceOf(e.source_id)!.url} external>{sourceOf(e.source_id)!.title || 'page'}</Link>)</>}
                      </Text>
                    </li>
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>
          {gate && section.status === 'approved' && !dirty && (
            <Alert tone="success" title="Approved">Recorded {new Date(gate.approved_at).toLocaleString()}.</Alert>
          )}
        </Stack>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      <Nav onBack={onBack}>
        {section && <Button variant="secondary" onClick={draft} disabled={!!busy}>{busy === 'draft' ? 'Redrafting…' : 'Redraft'}</Button>}
        {section && dirty && <Button variant="secondary" onClick={saveEdit} disabled={!!busy}>Save edits</Button>}
        {section && <Button onClick={approve} disabled={!!busy}>{busy === 'approve' ? 'Approving…' : step.gate ? `Approve ${step.gate}` : 'Approve and continue'}</Button>}
        {!section && <Button variant="secondary" onClick={onNext}>Skip for now</Button>}
      </Nav>
    </Stack>
  );
}

function KitStep({ state, onChange, onBack }: { state: BrandState; onChange: () => Promise<void>; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<{ explorer: string; attestationExplorer: string } | null>(null);
  const gatesDone = ['purpose', 'positioning', 'voice'].filter((g) => state.gates.some((x) => x.gate === g));
  const latest = state.kits[0];

  async function register() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ explorer: string; attestationExplorer: string }>(`/brands/${state.brand.id}/kit/register`, { body: {} });
      setLinks(r);
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(false);
      await onChange();
    }
  }
  return (
    <Stack gap={5}>
      <Heading level={1}>{state.brand.name} kit</Heading>
      <Text tone="secondary">Registering puts the kit's fingerprint (a hash), its version and your account id on Solana devnet. The kit text stays private.</Text>
      <Stack gap={2} as="ul">
        {STEPS.filter((s) => s.kind === 'section').map((s) => {
          const sec = state.sections.find((x) => x.section === s.section);
          return (
            <li key={s.slug}>
              <Text>{s.title}: {sec ? (sec.status === 'approved' ? 'approved' : 'drafted, not approved') : 'not drafted'}</Text>
            </li>
          );
        })}
      </Stack>
      <Text>Gates approved: {gatesDone.length} of 3</Text>
      {latest && (
        <Alert tone={latest.status === 'registered' ? 'success' : latest.status === 'failed' ? 'danger' : 'info'} title={`Kit v${latest.version}: ${latest.status}`}>
          <Text as="span" variant="mono">{latest.hash}</Text>
        </Alert>
      )}
      {(links || latest?.signature) && (
        <Stack gap={1}>
          <Link href={links?.explorer ?? `https://explorer.solana.com/tx/${latest!.signature}?cluster=devnet`} external>View the transaction on Solana Explorer</Link>
          {(links?.attestationExplorer || latest?.attestation) && (
            <Link href={links?.attestationExplorer ?? `https://explorer.solana.com/address/${latest!.attestation}?cluster=devnet`} external>View the attestation</Link>
          )}
        </Stack>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      <Nav onBack={onBack}>
        <Button onClick={register} disabled={busy || gatesDone.length < 3}>
          {busy ? 'Registering on Solana…' : `Register kit v${(latest?.version ?? 0) + 1}`}
        </Button>
      </Nav>
      {gatesDone.length < 3 && <Text variant="small" tone="secondary">Approve purpose, positioning and voice to register.</Text>}
      {/* Any registered version is enough to create from, even if a later attempt failed. */}
      {state.kits.some((k) => k.status === 'registered') && <Button href="/create" variant="secondary">Start creating</Button>}
    </Stack>
  );
}
