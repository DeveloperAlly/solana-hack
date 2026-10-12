import { useMemo, useState } from 'react';
import type { HubSideNavSection } from '../../../ui/domain/HubSideNav';
import { useHubLinks } from '../paths';
import type { InboxData, InboxMessage } from '../types';
import { useOutcomes } from './useOutcomes';

export type InboxOutcome = 'sent' | 'snoozed' | 'done';

/** Folders that list messages by what happened to them, not by source. */
const outcomeFolders: Record<string, InboxOutcome> = { snoozed: 'snoozed', done: 'done' };

function matches(m: InboxMessage, filter: string, query: string, unreadOnly: boolean, outcome?: InboxOutcome): boolean {
  const folder = outcomeFolders[filter];
  if (folder) return outcome === folder;
  if (outcome === 'snoozed' || outcome === 'done') return false;
  const inFilter = filter === 'all' || m.source === filter || m.labels.includes(filter);
  const q = query.trim().toLowerCase();
  const inQuery = !q || `${m.from} ${m.preview}`.toLowerCase().includes(q);
  return inFilter && inQuery && (!unreadOnly || m.unread);
}

/**
 * Inbox-All state (n-inb1): rail filter (folder, source or label), search, unread-only filter, the open thread,
 * checked rows, labels and assignee per thread, the reply draft per thread with validation, and what happened to each.
 */
export function useInbox(data: InboxData) {
  const links = useHubLinks();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [openId, setOpenId] = useState(data.messages[0]?.id);
  const [checked, setChecked] = useState<string[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [labels, setLabels] = useState<Record<string, string[]>>(() => Object.fromEntries(data.messages.map((m) => [m.id, m.labels])));
  const [assignee, setAssignee] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const { outcomeOf, set, clear } = useOutcomes<InboxOutcome>();
  const [last, setLast] = useState<{ id: string; outcome: InboxOutcome } | null>(null);
  const act = (id: string, outcome: InboxOutcome) => { set(id, outcome); setLast({ id, outcome }); };

  const visible = useMemo(
    () => data.messages.filter((m) => matches({ ...m, labels: labels[m.id] ?? [] }, filter, query, unreadOnly, outcomeOf(m.id))),
    [data.messages, filter, query, unreadOnly, labels, outcomeOf],
  );
  const open = visible.find((m) => m.id === openId) ?? visible[0];
  const countOf = (outcome: InboxOutcome) => data.messages.filter((m) => outcomeOf(m.id) === outcome).length;

  const rail: HubSideNavSection[] = [
    { items: [{ ...data.folders[0], href: undefined }, { ...data.folders[1], href: links[data.folders[1].href] }, { id: 'snoozed', label: 'Snoozed', count: countOf('snoozed') }, { id: 'done', label: 'Done', count: countOf('done') }] },
    { title: 'Sources', items: [...data.sources, { id: 'connect', label: '+ Connect a source', href: links.inboxConnect }] },
    { title: 'Labels', items: data.labels },
  ];

  function replyOf(m: InboxMessage) {
    return replies[m.id] ?? m.reply;
  }

  function send(m: InboxMessage) {
    const text = replyOf(m).trim();
    if (!text) return setError('Write a reply before sending.');
    if (/\[[^\]]*\]/.test(text)) return setError('Replace the bracketed placeholder text before sending.');
    setError(null);
    // INTEGRATION: send through the source adapter (inbox_threads; backend map row "Inbox-All…"). A person always sends.
    act(m.id, 'sent');
  }

  return {
    filter, select: (id: string) => { setFilter(id); setChecked([]); },
    query, setQuery, unreadOnly, setUnreadOnly, rail, visible, open,
    openThread: (id: string) => { setOpenId(id); setError(null); },
    checked, toggleChecked: (id: string) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id])),
    doneChecked: () => { checked.forEach((id) => act(id, 'done')); setChecked([]); },
    replyOf, setReply: (id: string, text: string) => setReplies((r) => ({ ...r, [id]: text })), error, send,
    labelsOf: (id: string) => labels[id] ?? [],
    toggleLabel: (id: string, label: string) => setLabels((l) => ({ ...l, [id]: (l[id] ?? []).includes(label) ? l[id].filter((x) => x !== label) : [...(l[id] ?? []), label] })),
    assigneeOf: (id: string) => assignee[id], assign: (id: string, who: string) => setAssignee((a) => ({ ...a, [id]: who })),
    outcomeOf, act, last, undoLast: () => { if (last) clear(last.id); setLast(null); },
  };
}

export type InboxState = ReturnType<typeof useInbox>;
