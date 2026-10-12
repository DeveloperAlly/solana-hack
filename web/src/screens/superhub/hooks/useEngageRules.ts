import { useState } from 'react';
import type { EngageRule, EngageRulesData } from '../types';

const blankRule = { when: '', where: '', then: 'Draft a reply for approval' };

/**
 * Engage-Rules state (n-er): rule toggles, the "+ Add rule" form with validation, the opt-in auto-reply wording
 * (an edit needs your approval again before it sends), and which suggested lists you opened for review.
 */
export function useEngageRules(data: EngageRulesData) {
  const [rules, setRules] = useState<EngageRule[]>(data.rules);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankRule);
  const [formError, setFormError] = useState<string | null>(null);
  const [wording, setWording] = useState(data.autoReply.wording);
  const [approved, setApproved] = useState(true);
  const [editingWording, setEditingWording] = useState(false);
  const [wordingDraft, setWordingDraft] = useState(wording);
  const [wordingError, setWordingError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string[]>([]);

  function addRule() {
    if (!form.when.trim() || !form.where.trim()) return setFormError('Say when the rule fires and where it looks.');
    // INTEGRATION: POST the rule (rules table; backend map Roadmap line "Engage-Rules"); replies still queue for a person.
    setRules((r) => [...r, { id: `r${r.length + 1}`, ...form, on: true }]);
    setForm(blankRule);
    setFormError(null);
    setAdding(false);
  }

  function saveWording() {
    if (!wordingDraft.trim()) return setWordingError('The auto-reply needs wording.');
    if (!/\bSTOP\b/.test(wordingDraft)) return setWordingError('Keep a way to stop: include "Reply STOP to opt out".');
    setWording(wordingDraft.trim());
    setApproved(false);
    setEditingWording(false);
    setWordingError(null);
  }

  return {
    rules, toggleRule: (id: string) => setRules((r) => r.map((x) => (x.id === id ? { ...x, on: !x.on } : x))),
    adding, startAdding: () => setAdding(true), cancelAdding: () => { setAdding(false); setFormError(null); },
    form, setField: (k: keyof typeof blankRule, v: string) => setForm((f) => ({ ...f, [k]: v })), formError, addRule,
    wording, approved, approve: () => setApproved(true),
    editingWording, wordingDraft, setWordingDraft, wordingError, saveWording,
    editWording: () => { setWordingDraft(wording); setEditingWording(true); }, cancelWording: () => setEditingWording(false),
    isReviewing: (id: string) => reviewing.includes(id), review: (id: string) => setReviewing((r) => [...r, id]),
  };
}

export type EngageRulesState = ReturnType<typeof useEngageRules>;
