import { useState } from 'react';
import { downloadCsv, toCsv } from '../../../lib/csv';
import { uniqueId } from '../../../lib/id';
import { useHubSession } from './useHubSession';
import type { Lead, LeadsData } from '../types';

const statusLabel: Record<Lead['status'], string> = { new: 'New', queued: 'Draft in queue' };

/** The rows on screen, as CSV (formula-safe, lib/csv): what you see is what you export, statuses included. */
export function leadsCsv(rows: Lead[]): string {
  return toCsv(['Lead', 'Fit', 'Why', 'Status'], rows.map((l) => [l.name, l.fit, l.why, statusLabel[l.status]]));
}

/**
 * Leads state (n-le): the who-we're-looking-for form (validated; pre-filled from the brand pack), the result list,
 * Draft outreach per lead (it joins the approval queue), and the CSV export of the rows as they stand.
 */
export function useLeads(data: LeadsData) {
  const [query, setQuery] = useState(data.query);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<string | null>(null);
  const [session, update] = useHubSession();
  // A lead's outreach draft lives in the hub session's approval queue, so the status survives a remount.
  const draftFor = (leadId: string) => Object.entries(session.created).find(([, c]) => c.lead === leadId)?.[0];
  const rows: (Lead & { draftId?: string })[] = data.leads.map((l) => {
    const draftId = draftFor(l.id);
    return draftId ? { ...l, status: 'queued', draftId } : l;
  });

  // INTEGRATION: POST a draft for this lead (DraftWorkflow); it goes through the checks and waits for approval.
  function draftOutreach(leadId: string) {
    const lead = data.leads.find((l) => l.id === leadId);
    if (!lead || lead.status !== 'new' || draftFor(leadId)) return;
    const id = uniqueId('outreach');
    const title = `[Outreach to ${lead.name}]`;
    update((s) => ({
      ...s,
      created: {
        ...s.created,
        [id]: {
          lead: lead.id,
          summary: { id, channel: 'Email', format: 'Outreach email', title, meta: 'Replies voice · from Leads', onBrand: 'On-brand [score]', slop: 'Slop check ✓', slot: 'No slot yet', status: 'approval' },
          content: { title: `Outreach email · ${lead.name}`, context: `Drafted for a lead you chose: ${lead.why}`, channel: 'Email', versions: [{ id: 'v1', label: 'v1 · drafted', text: `[Outreach draft to ${lead.name}, from your brand pack and their public signal]` }], slopFixes: [] },
        },
      },
    }));
  }

  function find() {
    if (!query.who.trim()) return setError('Describe who you are looking for.');
    setError(null);
    // INTEGRATION: POST …/leads/search (Exa /search, public only; backend map row "Leads (experimental)").
    setSearched(query.who.trim());
  }

  return {
    query, setField: (k: keyof LeadsData['query'], v: string) => setQuery((q) => ({ ...q, [k]: v })), error, searched, find,
    rows, statusLabel, draftOutreach,
    // INTEGRATION: GET …/leads.csv returns every lead; locally the rows on screen are exported in the browser.
    exportCsv: () => downloadCsv('leads.csv', leadsCsv(rows)),
  };
}
