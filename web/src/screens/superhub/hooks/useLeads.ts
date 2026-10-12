import { useState } from 'react';
import type { Lead, LeadsData } from '../types';

/** Leads as CSV text (the export runs in the browser; nothing is uploaded). */
export function leadsCsv(rows: Lead[]): string {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return ['Lead,Fit,Why,Status', ...rows.map((l) => [l.name, l.fit, l.why, l.status].map(cell).join(','))].join('\n');
}

/**
 * Leads state (n-le): the who-we're-looking-for form (validated; pre-filled from the brand pack), the result list,
 * Draft outreach per lead (it joins the approval queue), and the CSV export.
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

  function exportCsv() {
    // INTEGRATION: GET …/leads.csv returns every lead; locally the visible rows are exported in the browser.
    const url = URL.createObjectURL(new Blob([leadsCsv(rows)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    query, setField: (k: keyof LeadsData['query'], v: string) => setQuery((q) => ({ ...q, [k]: v })), error, searched, find,
    rows, draftOutreach: (id: string) => setRows((r) => r.map((l) => (l.id === id ? { ...l, status: 'queued' } : l))), exportCsv,
  };
}
