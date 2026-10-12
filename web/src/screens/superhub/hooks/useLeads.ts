import { useState } from 'react';
import { downloadCsv, toCsv } from '../../../lib/csv';
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
  const [rows, setRows] = useState(data.leads);

  function find() {
    if (!query.who.trim()) return setError('Describe who you are looking for.');
    setError(null);
    // INTEGRATION: POST …/leads/search (Exa /search, public only; backend map row "Leads (experimental)").
    setSearched(query.who.trim());
  }

  return {
    query, setField: (k: keyof LeadsData['query'], v: string) => setQuery((q) => ({ ...q, [k]: v })), error, searched, find,
    rows, statusLabel, draftOutreach: (id: string) => setRows((r) => r.map((l) => (l.id === id ? { ...l, status: 'queued' } : l))),
    // INTEGRATION: GET …/leads.csv returns every lead; locally the rows on screen are exported in the browser.
    exportCsv: () => downloadCsv('leads.csv', leadsCsv(rows)),
  };
}
