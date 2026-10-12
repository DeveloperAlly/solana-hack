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
import { J4GapsVoice } from '../../screens/journey/J4-Gaps-Voice';
import { J5ApproveKit } from '../../screens/journey/J5-Approve-Kit';
import { J6FirstPost } from '../../screens/journey/J6-First-Post';
import { J7Proof } from '../../screens/journey/J7-Proof';
import type { Post } from '../../../worker/posts';
import type { ClaimMap } from '../../../worker/claims';
import type { VoiceSample } from '../../../worker/journey';
import { voiceAnswerFor, templateById } from '../../../worker/voice';
import { firstPostView, proofView } from './postView';
import { kitView } from './kitView';
import { J3Confirm } from '../../screens/journey/J3-Confirm';
import { StatePanel } from '../../ui/composites/StatePanel';
import { Button, Container } from '../../ui/primitives';
import { ensureJourneySession, finishJourneySignIn, pendingJourneyBrand, pendingJourneyEmail, sendJourneyEmail } from './auth';
import type { FactRecord, GapsVoiceData } from '../../screens/journey/types';
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

interface LiveContextValue { state: JourneyBrandState | null; loading: boolean; error?: string; /** A read run is still being followed. */ reading: boolean; reload: () => Promise<void>; prepare: (target: JourneyTarget) => Promise<void>; voice: GapsVoiceData['voice']; post: Post | null; claimMap: ClaimMap | null }
const LiveContext = createContext<LiveContextValue | null>(null);

export const liveJourneyHref = (target: JourneyTarget) => ({ ledger: '/ledger', basics: '/build/basics', brandBuild: '/brand', contentDashboard: '/create', settingsAi: '/preview/Settings-AI', partners: '/preview/Partners', hub: '/home', main: '/' } as Partial<Record<JourneyTarget, string>>)[target] ?? `/journey/${target}`;

/** One provider across live Journey routes; existing gallery screens never instantiate it. */
export function LiveJourneyProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const catalog = useLiveBrands();
  const [brandId, setBrandId] = useState<string | null>(storedBrand);
  const finishingHandoff = useRef<string | null>(null);
  const previousUser = useRef(session?.user.id);
  const [state, setState] = useState<JourneyBrandState | null>(null);
  const [selections, setSelections] = useState<JourneySelections>(() => ({ ...initialSelections, emailSentTo: pendingJourneyEmail(), signIn: pendingJourneyEmail() ? 'code' : 'email' }));
  const [voiceRounds, setVoiceRounds] = useState<[VoiceSample[], VoiceSample[]]>([[], []]);
  const samples = useRef(voiceRounds); samples.current = voiceRounds;
  const [post, setPost] = useState<Post | null>(null);
  const [claimMap, setClaimMap] = useState<ClaimMap | null>(null);
  const heldPost = useRef(post); heldPost.current = post;
  const heldState = useRef(state); heldState.current = state;
  const heldSelections = useRef(selections); heldSelections.current = selections;
  const preparing = useRef(new Set<string>());
  const prepared = useRef(new Set<string>());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<string>();
  // Read runs being followed now: the Read screen shows "reading" only while one is, so a finished read with no facts
  // shows its real result (issue #114, T1.09) instead of an endless spinner.
  const [activeReads, setActiveReads] = useState(0);
  const ctrl = useRef(new AbortController());
  const currentId = useRef(brandId); currentId.current = brandId;
  const reloadRevision = useRef(0);
  const postReadRevision = useRef(0);
  const initialSource = useRef<{ id: string; url: string } | null>(null);
  const patch = useCallback((p: Partial<JourneySelections>) => setSelections(s => ({ ...s, ...p })), []);
  const reload = useCallback(async (id = currentId.current, signal = ctrl.current.signal) => {
    if (!id) return;
    const revision = ++reloadRevision.current;
    const result = await api<JourneyBrandState>(`/brands/${id}`, { signal });
    if (signal.aborted || currentId.current !== id || revision !== reloadRevision.current) return;
    heldState.current = result; setState(result);
    setSelections(s => ({ ...s, site: result.brand.website || '', kitRegistered: result.kits.some(k => k.status === 'registered'),
      answers: { ...Object.fromEntries(result.answers.flatMap(a => Object.entries(a.data).map(([k, v]) => [`${a.step}.${k}`, v]))), ...s.answers },
      facts: Object.fromEntries(result.evidence.flatMap<[string, FactRecord]>(e => e.owner_decision === 'confirmed' ? [[e.id, { decision: 'accepted' }]] : e.owner_decision === 'rejected' ? [[e.id, { decision: 'rejected' }]] : e.owner_decision === 'edited' ? [[e.edited_from || e.id, { decision: 'edited', edit: e.claim }]] : [])),
    }));
  }, []);
  const followOnce = useCallback(async (runId: string, id: string, signal: AbortSignal) => {
    const result = await followRun(runId, {
      get: async rid => (await api<{ run: RunView }>(`/runs/${rid}`, { signal })).run,
      sleep: ms => sleep(ms, signal), cancelled: () => signal.aborted || currentId.current !== id,
      onUpdate: run => { if (!signal.aborted && currentId.current === id) { void reload(id, signal).catch(() => undefined); setProgress(run.progress?.message || (run.status === 'paused' ? 'Waiting for the AI allowance; your read will resume automatically.' : 'Working on your brand…')); } },
    });
    if (!result) return;
    await reload(id, signal);
    setProgress(undefined);
    if (result.status !== 'done') throw new Error(result.error || 'The read did not finish. Retry the source.');
  }, [reload]);
  const follow = useCallback(async (runId: string, id: string, signal = ctrl.current.signal) => {
    setActiveReads(n => n + 1);
    try { await followOnce(runId, id, signal); } finally { setActiveReads(n => Math.max(0, n - 1)); }
  }, [followOnce]);

  const addSource = useCallback(async (input: SourceInput, id = currentId.current) => {
    if (!id) throw new Error('Start your brand first.');
    const signal = ctrl.current.signal;
    let result: { runId?: string; run?: { id: string } };
    try {
      if (input.kind === 'url') result = await api(`/brands/${id}/sources`, { body: { url: input.value }, signal });
      else if (input.kind === 'text' || /\.(txt|md)$/i.test(input.file.name)) {
        const text = input.kind === 'text' ? input.value : await input.file.text();
        result = await api(`/brands/${id}/runs`, { body: { kind: 'extract_facts', reader: 'paste', text, name: input.kind === 'file' ? input.file.name : 'Pasted text' }, signal });
      } else {
        const data = new FormData();
        data.append('file', input.file);
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
    if (catalog.id && catalog.id !== currentId.current) { currentId.current = catalog.id; heldState.current = null; setState(null); setPost(null); setClaimMap(null); setVoiceRounds([[], []]); prepared.current.clear(); setSelections({ ...initialSelections }); setBrandId(catalog.id); persistBrand(catalog.id); }
  }, [catalog.id]);
  const loadPost = useCallback(async (id = currentId.current, withClaims = true) => {
    if (!id) throw new Error('No brand is selected.');
    const signal = ctrl.current.signal;
    const revision = ++postReadRevision.current;
    const result = await api<{ posts: Post[] }>(`/brands/${id}/posts?limit=1`, { signal });
    if (signal.aborted || currentId.current !== id || revision !== postReadRevision.current) return null;
    const latest = result.posts[0] || null; heldPost.current = latest; setPost(latest); setClaimMap(null);
    if (latest?.status === 'registered') patch({ post: { channelLabel: latest.channel || 'Post', text: latest.body } });
    if (latest && withClaims) {
      const response = await api<{ claimMap: ClaimMap }>(`/brands/${id}/posts/${latest.id}/claims`, { body: { rev: latest.rev }, signal });
      if (!signal.aborted && currentId.current === id && revision === postReadRevision.current && heldPost.current?.id === latest.id && heldPost.current.rev === response.claimMap.rev) setClaimMap(response.claimMap);
    }
    return latest;
  }, [patch]);
  const fetchVoice = useCallback(async (round: 1 | 2, near?: string) => {
    const id = currentId.current; if (!id) throw new Error('No brand is selected.');
    const signal = ctrl.current.signal;
    const result = await api<{ samples: VoiceSample[] }>(`/brands/${id}/voice/samples`, { body: { round, ...(near ? { near } : {}) }, signal });
    if (signal.aborted || currentId.current !== id) return;
    setVoiceRounds(prev => { const next: [VoiceSample[], VoiceSample[]] = [...prev]; next[round - 1] = result.samples; samples.current = next; return next; });
  }, []);
  const prepare = useCallback(async (target: JourneyTarget) => {
    const id = currentId.current; const s = heldState.current;
    if (!id || !s || !['gapsVoice', 'approveKit', 'firstPost', 'proof'].includes(target)) return;
    const key = `${id}:${target}`;
    if (preparing.current.has(key) || prepared.current.has(key)) return;
    preparing.current.add(key); setLoading(true); setError(undefined);
    try {
      if (target === 'gapsVoice') {
        if (!samples.current[0].length) await fetchVoice(1);
        const savedVoice = s.answers.find(a => a.step === 'voice')?.data;
        if (savedVoice?.template && savedVoice.sample && heldSelections.current.voice.mode === 'picks' && !heldSelections.current.voice.picks[2]) {
          const restored = { template: savedVoice.template, label: templateById(savedVoice.template)?.label || savedVoice.template, text: savedVoice.sample, answer: savedVoice };
          setVoiceRounds(prev => { const next: [VoiceSample[], VoiceSample[]] = [prev[0], [restored]]; samples.current = next; return next; });
          patch({ voice: { mode: 'picks', round: 2, picks: { 1: savedVoice.template, 2: savedVoice.template } }, answers: { ...heldSelections.current.answers, claims: savedVoice.claims || '5' } });
        }
      }
      if (target === 'approveKit') {
        for (const section of ['purpose', 'positioning', 'audience', 'voice', 'origin', 'messaging']) {
          if (!s.sections.some(x => x.section === section && x.body)) await api(`/brands/${id}/sections/${section}/draft`, { body: {}, signal: ctrl.current.signal });
        }
        await reload(id);
      }
      if (target === 'firstPost' || target === 'proof') {
        let latest = await loadPost(id, target === 'firstPost');
        if (!latest && target === 'firstPost') {
          const active = await api<{ runs?: { id: string }[] }>(`/brands/${id}/runs?kind=draft_post`, { signal: ctrl.current.signal });
          if (active.runs?.length) for (const r of active.runs) await follow(r.id, id);
          else {
            const response = await api<{ post?: Post; runId?: string }>(`/brands/${id}/posts`, { body: { channel: 'LinkedIn' }, signal: ctrl.current.signal });
            if (response.runId) await follow(response.runId, id);
          }
          latest = await loadPost(id, true);
          if (!latest) throw new Error('The post draft has not arrived. Try again.');
        }
      }
      if (currentId.current === id) prepared.current.add(key);
    } catch (e) { if (currentId.current === id && !ctrl.current.signal.aborted) { setError(e instanceof Error ? e.message : 'Could not prepare this step.'); throw e; } }
    finally { preparing.current.delete(key); if (currentId.current === id) setLoading(false); }
  }, [fetchVoice, follow, loadPost, patch, reload]);
  const postAction = async (path: string, body: Record<string, unknown> = {}, method?: string) => {
    const id = currentId.current; const p = heldPost.current;
    if (!id || !p) throw new Error('Load your post first.');
    await api(`/brands/${id}/posts/${p.id}${path}`, { method, body: { ...body, rev: p.rev }, signal: ctrl.current.signal });
    await loadPost(id);
  };
  const voice: GapsVoiceData['voice'] = { rounds: voiceRounds.map(round => round.map((sample, i) => ({ value: sample.template, title: String.fromCharCode(65 + i), tag: sample.label, body: sample.text }))) as GapsVoiceData['voice']['rounds'], intro: 'Choose the paragraph that sounds most like your brand, or write your own sentence.' };
  useEffect(() => {
    if (previousUser.current && !session) {
      ctrl.current.abort(); currentId.current = null; heldState.current = null; heldPost.current = null;
      setBrandId(null); setState(null); setPost(null); setClaimMap(null); setVoiceRounds([[], []]); setSelections({ ...initialSelections }); prepared.current.clear();
      try { sessionStorage.removeItem(brandKey); } catch { /* optional */ }
    }
    previousUser.current = session?.user.id;
  }, [session]);
  useEffect(() => {
    const email = pendingJourneyEmail();
    if (!session?.user || session.user.is_anonymous || !email) return;
    const key = `${session.user.id}:${email}`;
    if (finishingHandoff.current === key) return;
    finishingHandoff.current = key;
    const preferred = pendingJourneyBrand() || storedBrand() || undefined;
    void finishJourneySignIn().then(async () => {
      await catalog.refresh(preferred);
      if (preferred) { currentId.current = preferred; setBrandId(preferred); persistBrand(preferred); await reload(preferred); }
    }).catch(e => { setError(e instanceof Error ? e.message : 'Could not save your brand to your account.'); }).finally(() => { if (finishingHandoff.current === key) finishingHandoff.current = null; });
  }, [session?.user.id, session?.user.is_anonymous, catalog.refresh, reload]);
  const requireCurrent = (id: string) => { if (currentId.current !== id || ctrl.current.signal.aborted) throw new Error('The selected brand changed. Continue with the current brand.'); };
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
    sendEmail: async email => { await sendJourneyEmail(email, currentId.current || undefined); patch({ signIn: 'code', emailSentTo: email }); },
    verifyCode: async code => { await finishJourneySignIn(code); await catalog.refresh(currentId.current || undefined); await reload(); },
    changeEmail: () => patch({ signIn: 'email', emailSentTo: '' }),
    decideFact: async (eid, decision, edit) => {
      const id = currentId.current;
      if (!id) throw new Error('No brand is selected.');
      await api(`/brands/${id}/evidence/${eid}`, { method: 'PATCH', body: decision === 'edited' ? { claim: edit } : { review_status: decision === 'accepted' ? 'approved' : 'rejected' } });
      await reload(id);
    },
    undoFact: () => { throw new Error('Review this fact from your saved evidence to change its decision.'); },
    resolveConflict: async (conflictId, resolution) => { const id = currentId.current; if (!id) throw new Error('No brand is selected.'); await api(`/brands/${id}/conflicts/${conflictId}/resolve`, { body: resolution }); await reload(id); },
    setAlternatives: selected => patch({ alternatives: selected }),
    addAlternative: option => setSelections(s => ({ ...s, alternatives: [...s.alternatives, option], customAlternatives: [...s.customAlternatives, option] })),
    setAnswer: (id, value) => setSelections(s => ({ ...s, answers: { ...s.answers, [id]: value } })),
    pickVoice: (round, value) => setSelections(s => { const held = s.voice.mode === 'picks' ? s.voice.picks : {}; const kept = round === 1 && held[1] !== value ? {} : held; if (round === 1 && held[1] !== value) setVoiceRounds(prev => [prev[0], []]); return { ...s, voice: { mode: 'picks', round, picks: { ...kept, [round]: value } } }; }),
    setVoiceRound: async round => { const v = heldSelections.current.voice; if (round === 2 && v.mode === 'picks') { if (!v.picks[1]) throw new Error('Pick a paragraph in round one.'); if (!samples.current[1].length) await fetchVoice(2, v.picks[1]); } setSelections(s => ({ ...s, voice: { mode: 'picks', round, picks: s.voice.mode === 'picks' ? s.voice.picks : {} } })); },
    setVoiceSentence: sentence => patch({ voice: { mode: 'sentence', sentence } }),
    finishGaps: async () => {
      const id = currentId.current; const s = heldState.current; const chosen = heldSelections.current;
      if (!id || !s) throw new Error('No brand is selected.');
      const groups = new Map<string, Record<string, string>>();
      for (const q of s.journey?.gapsVoice.questions || []) {
        if (q.kind !== 'missing' || q.id === 'voice.template' || !q.step || !q.field) continue;
        const value = chosen.answers[q.id]?.trim();
        if (!q.optional && !value) throw new Error(`Answer: ${q.question}`);
        if (value) groups.set(q.step, { ...(groups.get(q.step) || {}), [q.field.startsWith(`${q.step}.`) ? q.field.slice(q.step.length + 1) : q.field]: value });
      }
      if (!s.journey) { groups.set('alternatives', { edge: chosen.answers.edge || '', instead: chosen.alternatives.join(', ') }); groups.set('origin', { why: chosen.answers.origin || '' }); }
      for (const [step, data] of groups) await api(`/brands/${id}/answers/${step}`, { method: 'PUT', body: { data: { ...(s.answers.find(a => a.step === step)?.data || {}), ...data }, skipped: false } });
      let answer: Record<string, string>;
      if (chosen.voice.mode === 'sentence') { const template = templateById('candid_founder'); if (!template) throw new Error('The default voice template is unavailable.'); answer = { ...voiceAnswerFor(template.value), sample: chosen.voice.sentence }; }
      else { const pickedId = chosen.voice.picks[2]; const picked = samples.current[1].find(x => x.template === pickedId); if (!picked) throw new Error('Pick a paragraph in round two.'); answer = picked.answer; }
      await api(`/brands/${id}/answers/voice`, { method: 'PUT', body: { data: { ...answer, claims: chosen.answers.claims || '5' }, skipped: false } });
      prepared.current.delete(`${id}:approveKit`); await reload(id);
    },
    editGate: async (section, body) => { const id = currentId.current; if (!id) throw new Error('No brand is selected.'); await api(`/brands/${id}/sections/${section}`, { method: 'PUT', body: { body } }); await reload(id); },
    approveSupportingSection: async section => { const id = currentId.current; if (!id) throw new Error('No brand is selected.'); await api(`/brands/${id}/sections/${section}/approve`, { body: {} }); await reload(id); },
    approveGate: async (section, decision) => { const id = currentId.current; if (!id) throw new Error('No brand is selected.'); await api(`/brands/${id}/sections/${section}/approve`, { body: { note: decision.why || '' } }); await reload(id); },
    reopenGate: async section => { const id = currentId.current; const body = heldState.current?.sections.find(x => x.section === section)?.body; if (!id || !body) throw new Error('Load your draft first.'); await api(`/brands/${id}/sections/${section}`, { method: 'PUT', body: { body } }); await reload(id); },
    setKitRegistered: async () => { const id = currentId.current; if (!id) throw new Error('No brand is selected.'); try { await api(`/brands/${id}/kit/register`, { body: {} }); await reload(id); if (!heldState.current?.kits.some(k => k.status === 'registered')) throw new Error('The kit has not registered yet.'); } catch (e) { await reload(id); throw e; } },
    setPostChannel: () => { /* First post uses the channel persisted on its server row. */ },
    approvePost: async visible => {
      const id = currentId.current; let p = heldPost.current;
      if (!id || !p || p.body !== visible.text) throw new Error('Your post changed. Reload it before approving.');
      if (p.status !== 'registered' && p.status !== 'registering') { const result = await api<{ post: Post }>(`/brands/${id}/posts/${p.id}/approve`, { body: { rev: p.rev } }); requireCurrent(id); p = result.post; heldPost.current = p; setPost(p); }
      if (p.status !== 'registered') { try { const result = await api<{ post: Post }>(`/brands/${id}/posts/${p.id}/register`, { body: { rev: p.rev } }); requireCurrent(id); p = result.post; heldPost.current = p; setPost(p); } catch (e) { await loadPost(id, false); throw e; } }
      if (p.status !== 'registered' || !p.signature) throw new Error('Registration is still settling. Try again shortly.');
      patch({ post: { text: p.body, channelLabel: p.channel || 'Post' } });
    },
    editPost: text => postAction('', { body: text }, 'PUT'),
    polishPost: action => postAction('/polish', { action: ({ Review: 'review', Shorten: 'shorten', Clarify: 'clarify', Beautify: 'beautify', 'Beautify (accessible)': 'beautify_accessible' } as Record<string, string>)[action] || action }),
    undoPost: () => postAction('/undo'),
    reviewPost: async () => { await loadPost(); },
    verifyPost: async text => { const result = await api<{ official: boolean; checked: boolean; note?: string }>('/verify', { body: { text } }); if (!result.checked) throw new Error(result.note || 'Solana could not be checked. Try again.'); return { official: result.official, note: result.note || (result.official ? 'This text matches a registered approval on Solana. Brand names are self-declared.' : 'No matching registered text was found.') }; },
  };
  const visibleState = session && (!catalog.id || catalog.id === state?.brand.id) && (!state?.brand.owner_id || state.brand.owner_id === session.user.id) ? state : null;
  const sources = visibleState ? readView(visibleState).sources : [];
  return <LiveContext.Provider value={{ state: visibleState, loading, error, reading: activeReads > 0, reload, prepare, voice, post: visibleState ? post : null, claimMap: visibleState ? claimMap : null }}>
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
  useEffect(() => { if (live?.state) void live.prepare(target).catch(() => undefined); }, [target, live?.state?.brand.id, live?.prepare]);
  if (!live) throw new Error('LiveJourneyScreen requires LiveJourneyProvider.');
  if (target === 'main') return <Main data={{ ...mainFixture, example: null }} />;
  const s = live.state;
  if (!s) return <Container><StatePanel kind={live.error ? 'error' : 'loading'} title={live.error ? 'Could not load your brand' : 'Loading your brand'} body={live.error || 'Your saved journey will appear here.'} actions={<Button href="/">Start with your website</Button>} /></Container>;
  if (target === 'read') {
    const read = readView(s);
    // Empty only when nothing is still being read: no run followed, and no source reading or queued.
    const stillReading = live.reading || !read.sources.length || read.sources.some(x => x.status === 'reading' || x.status === 'queued');
    return <J1Read data={read} state={read.facts.length ? 'success' : live.error ? 'error' : stillReading ? 'loading' : 'empty'} />;
  }
  if (target === 'save') return <J2Save data={{ ...saveView(s), signedInEmail: !session?.user.is_anonymous ? session?.user.email : undefined }} />;
  if (target === 'confirm') return <J3Confirm data={confirmView(s)} />;
  if (live.loading || live.error) return <Container><StatePanel kind={live.error ? 'error' : 'loading'} title={live.error ? 'This step needs attention' : 'Preparing your brand'} body={live.error || 'Your saved decisions are being used to prepare the next step.'} actions={live.error && <Button onClick={() => void live.prepare(target).catch(() => undefined)}>Try again</Button>} /></Container>;
  if (target === 'gapsVoice') return <J4GapsVoice data={{ ...(s.journey?.gapsVoice || { brandName: s.brand.name, alternatives: { question: 'What do people use instead?', hint: 'Add your alternatives.', options: [], source: 'Your answer' }, edgeQuestion: 'What can only you do?', originQuestion: 'Why does it exist?', originNote: 'Your answer is saved as evidence.' }), voice: live.voice }} />;
  if (target === 'approveKit') return <J5ApproveKit data={kitView(s, live.voice, session?.user.email || 'Brand owner')} />;
  if (target === 'firstPost' && live.post) return <J6FirstPost key={live.post.id} data={firstPostView(live.post, live.claimMap)} />;
  if (target === 'proof' && live.post?.status === 'registered' && live.post.signature) return <J7Proof data={proofView(live.post, s.brand.name)} />;
  return <Container><StatePanel kind="error" title="Complete the previous step first" body="A registered kit and post are needed for this step." actions={<Button href={liveJourneyHref('approveKit')}>Review your kit</Button>} /></Container>;
}
