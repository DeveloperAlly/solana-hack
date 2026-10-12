import { Button } from '../../../ui/primitives';
import { useOpenDraft } from '../../../flows/drafts/openDraft';
import type { Lead } from '../types';

export interface LeadActionProps {
  lead: Lead & { draftId?: string };
  onDraft: (leadId: string) => void;
  /** Content dashboard href, for a lead queued before this visit (no draft id here). */
  contentHref: string;
}

/** A lead row's action: draft outreach, review the draft it created, or open the queue (n-le). */
export function LeadAction({ lead, onDraft, contentHref }: LeadActionProps) {
  const openDraft = useOpenDraft();
  if (lead.status === 'new') return <Button variant="secondary" onClick={() => onDraft(lead.id)}>Draft outreach</Button>;
  const { draftId } = lead;
  if (draftId) return <Button variant="secondary" onClick={() => openDraft(draftId)}>Review draft</Button>;
  return <Button variant="secondary" href={contentHref}>Review</Button>;
}
