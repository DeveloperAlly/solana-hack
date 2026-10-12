import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useLiveBrands } from '../../lib/liveBrands';
import { followRun, type RunView } from '../../screens/create/followRun';
import { JourneyFlowContext, initialSelections, type JourneyActions, type JourneySelections } from '../../screens/journey/useJourneyFlow';
import { JourneyHrefContext, type JourneyTarget } from '../../screens/journey/paths';
import { JourneySourcesContext, type SourceInput } from '../../screens/journey/useJourneySources';
import { Main } from '../../screens/journey/Main';
import { mainFixture } from '../../screens/journey/Main.fixtures';
import { J1Read } from '../../screens/journey/J1-Read';
import { J2Save } from '../../screens/journey/J2-Save';
import { J3Confirm } from '../../screens/journey/J3-Confirm';
import { StatePanel } from '../../ui/composites/StatePanel';
import { Button, Container } from '../../ui/primitives';
import { ensureJourneySession, finishJourneySignIn, pendingJourneyEmail, sendJourneyEmail } from './auth';
import type { FactRecord } from '../../screens/journey/types';
import type { JourneyBrandState } from './contract';
import { confirmView, readView, saveView } from './views';

const brandKey = 'jamjam.journey.brandId';
const storedBrand = () => { try { return sessionStorage.getItem(brandKey); } catch { return null; } };
const persistBrand = (id: string) => { try { sessionStorage.setItem(brandKey, id); } catch { /* optional storage */ } };
const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve) => {
  if (signal.aborted) return resolve();
  const timer = setTimeout(done, ms);
  function done() { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); }
  signal.addEventListener('abort', done, { once: true });
});
const noAction = () => { throw new Error('This action is not available on this step yet.'); };
interface LiveContextValue { state: JourneyBrandState | null; loading: boolean; error?: string; reload: () => Promise<void> }
const LiveContext = createContext<LiveContextValue | null>(null);

export const liveJourneyHref = (target: JourneyTarget) => ({ ledger: '/ledger', basics: '/build/basics', brandBuild: '/brand/build', contentDashboard: '/create', settingsAi: '/settings/ai', partners: '/partners', hub: '/home', main: '/' } as Partial<Record<JourneyTarget, string>>)[target] ?? `/journey/${target}`;

/** One provider across live Journey routes; existing gallery screens never instantiate it. */
export function LiveJourneyProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const catalog = useLiveBrands();
  const [brandId, setBrandId] = useState<string | null>(storedBrand);
  const [state, setState] = useState<JourneyBrandState | null>(null);
  const [selections, setSelections] = useState<JourneySelections>(() => ({ ...initialSelections, emailSentTo: pendingJourneyEmail(), signIn: pendingJourneyEmail() ? 'code' : 'email' }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<string>();
  const ctrl = useRef(new AbortController());
  const currentId = useRef(brandId); currentId.current = brandId;
  const initialSource = useRef<{ id: string; url: string } | null>(null);
  const patch = useCallback((p: Partial<JourneySelections>) => setSelections(s => ({ ...s, ...p })), []);
  const reload = useCallback(async (id = currentId.current, signal = ctrl.current.signal) => {
    if (!id) return;
    const result = await api<JourneyBrandState>(`/brands/${id}`, { signal });
    if (signal.aborted || currentId.current !== id) return;
    setState(result);
    setSelections(s => ({ ...s, site: result.brand.website || '', kitRegistered: result.kits.some(k => k.status === 'registered'),
      facts: Object.fromEntries(result.evidence.flatMap<[string, FactRecord]>(e => e.owner_decision === 'accepted' ? [[e.id, { decision: 'accepted' }]] : e.owner_decision === 'rejected' ? [[e.id, { decision: 'rejected' }]] : e.owner_decision === 'edited' ? [[e.edited_from || e.id, { decision: 'edited', edit: e.claim }]] : [])),
    }));
  }, []);
  const follow = useCallback(async (runId: string, id: string, signal = ctrl.current.signal) => {
    const result = await followRun(runId, {
      get: async rid => (await api<{ run: RunView }>(`/runs/${rid}`, { signal })).run,
      sleep: ms => sleep(ms, signal), cancelled: () => signal.aborted || currentId.current !== id,
      onUpdate: run => { if (!signal.aborted && currentId.current === id) setProgress(run.progress?.message || (run.status === 'paused' ? 'Waiting for the AI allowance; your read will resume automatically.' : 'Reading your sources…')); },
    });
    if (!result) return;
    await reload(id, signal);
    setProgress(undefined);
    if (result.status !== 'done') throw new Error(result.error || 'The read did not finish. Retry the source.');
  }, [reload]);
  const addSource = useCallback(async (input: SourceInput, id = currentId.current) => {
    if (!id) throw new Error('Start your brand first.');
    const signal = ctrl.current.signal;
    let result: { runId?: string; run?: { id: string } };
    try {
      if (input.kind === 'url') result = await api(`/brands/${id}/sources`, { body: { url: input.value }, signal });
      else {
        const data = new FormData();
        data.append('file', input.kind === 'file' ? input.file : new File([input.value], 'Pasted text.txt', { type: 'text/plain' }));
        result = await api(`/brands/${id}/sources/document`, { body: data, signal });
      }
    } catch (e) {
      if (!(e instanceof ApiError && typeof e.data.runId === 'string')) throw e;
      result = { runId: e.data.runId };
    }
    await reload(id, signal);
    const rid = result.runId || result.run?.id;
    if (rid) void follow(rid, id, signal).catch(e => { if (!signal.aborted && currentId.current === id) setError(e instanceof Error ? e.message : 'The read failed.'); });
  }, [reload, follow]);
  useEffect(() => {
    const c = new AbortController(); ctrl.current = c;
    if (brandId) {
      setLoading(true); setError(undefined);
      void reload(brandId, c.signal).then(async () => {
        if (c.signal.aborted || initialSource.current?.id !== brandId) return;
        const url = initialSource.current.url; initialSource.current = null;
        await addSource({ kind: 'url', value: url }, brandId);
      }).catch(e => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'Could not resume your brand.'); }).finally(() => { if (!c.signal.aborted) setLoading(false); });
      // Resume active reads after reload, rather than leaving an accepted background run stranded.
      void api<{ runs?: { id: string }[] }>(`/brands/${brandId}/runs?kind=extract_facts`, { signal: c.signal }).then(r => { for (const run of r.runs || []) void follow(run.id, brandId, c.signal).catch(e => { if (!c.signal.aborted) setError(e.message); }); }).catch(e => { if (!(e instanceof ApiError && e.status === 404) && !c.signal.aborted) setError(e instanceof Error ? e.message : 'Could not resume reading.'); });
    }
    return () => c.abort();
  }, [brandId, reload, follow, addSource]);
  useEffect(() => {
    if (catalog.id && catalog.id !== currentId.current) { currentId.current = catalog.id; setState(null); setSelections({ ...initialSelections }); setBrandId(catalog.id); persistBrand(catalog.id); }
  }, [catalog.id]);
  const actions: JourneyActions = {
    startJourney: async site => {
      setError(undefined);
      await ensureJourneySession();
      const url = new URL(site.includes('://') ? site : `https://${site}`);
      const name = url.hostname.replace(/^www\./, '');
      const result = await api<{ brand: { id: string } }>('/brands', { body: { name, website: url.href } });
      const id = result.brand.id; currentId.current = id; persistBrand(id); initialSource.current = { id, url: url.href }; setState(null); setSelections({ ...initialSelections, site: url.href }); setBrandId(id);
      await catalog.refresh(id);
    },
    sendEmail: async email => { await sendJourneyEmail(email); patch({ signIn: 'code', emailSentTo: email }); },
    verifyCode: async code => { await finishJourneySignIn(code); await catalog.refresh(currentId.current || undefined); await reload(); },
    changeEmail: () => patch({ signIn: 'email', emailSentTo: '' }),
    decideFact: async (eid, decision, edit) => {
      const id = currentId.current;
      if (!id) throw new Error('No brand is selected.');
      await api(`/brands/${id}/evidence/${eid}`, { method: 'PATCH', body: decision === 'edited' ? { claim: edit } : { review_status: decision === 'accepted' ? 'approved' : 'rejected' } });
      await reload(id);
    },
    undoFact: async eid => { const id = currentId.current; if (!id) throw new Error('No brand is selected.'); await api(`/brands/${id}/evidence/${eid}`, { method: 'PATCH', body: { review_status: 'proposed' } }); await reload(id); },
    setAlternatives: selected => patch({ alternatives: selected }),
    addAlternative: option => setSelections(s => ({ ...s, alternatives: [...s.alternatives, option], customAlternatives: [...s.customAlternatives, option] })),
    setAnswer: (id, value) => setSelections(s => ({ ...s, answers: { ...s.answers, [id]: value } })),
    pickVoice: noAction, setVoiceRound: noAction, setVoiceSentence: noAction,
    editGate: noAction, approveGate: noAction, reopenGate: noAction, setKitRegistered: noAction, setPostChannel: noAction, approvePost: noAction,
  };
  const sources = state ? readView(state).sources : [];
  return <LiveContext.Provider value={{ state, loading, error, reload }}>
    <JourneyHrefContext.Provider value={liveJourneyHref}>
      <JourneyFlowContext.Provider value={{ selections, actions, busy: loading, error, status: progress || (session?.user.is_anonymous ? 'Read before signing in' : session?.user.email || 'Not signed in') }}>
        <JourneySourcesContext.Provider value={{ sources,
          add: (label, input) => addSource(input || { kind: 'url', value: label }),
          supply: async (_id, _how, input) => { if (!input) throw new Error('Supply the actual text or file.'); await addSource(input); },
          skip: async id => { if (!currentId.current) throw new Error('No brand is selected.'); await api(`/brands/${currentId.current}/sources/${id}`, { method: 'DELETE' }); await reload(); },
        }}>{children}</JourneySourcesContext.Provider>
      </JourneyFlowContext.Provider>
    </JourneyHrefContext.Provider>
  </LiveContext.Provider>;
}

/** Render existing screen contracts with persisted data, never gallery fixtures for private brand state. */
export function LiveJourneyScreen({ target }: { target: JourneyTarget }) {
  const live = useContext(LiveContext);
  const { session } = useAuth();
  if (!live) throw new Error('LiveJourneyScreen requires LiveJourneyProvider.');
  if (target === 'main') return <Main data={{ ...mainFixture, example: null }} />;
  const s = live.state;
  if (!s) return <Container><StatePanel kind={live.error ? 'error' : 'loading'} title={live.error ? 'Could not load your brand' : 'Loading your brand'} body={live.error || 'Your saved journey will appear here.'} actions={<Button href="/">Start with your website</Button>} /></Container>;
  if (target === 'read') return <J1Read data={readView(s)} state={readView(s).facts.length ? 'success' : live.error ? 'error' : 'loading'} />;
  if (target === 'save') return <J2Save data={{ ...saveView(s), signedInEmail: !session?.user.is_anonymous ? session?.user.email : undefined }} />;
  if (target === 'confirm') return <J3Confirm data={confirmView(s)} />;
  return <Container><StatePanel kind="loading" title="Continue building your brand" body="This live step is being connected." actions={<Button href="/build/basics">Open the brand builder</Button>} /></Container>;
}
