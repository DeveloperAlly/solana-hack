import { useState } from 'react';
import { uniqueId } from '../../lib/id';
import { usePublicSession } from './linkedBrand';
import { useGrowthParam } from './paths';
import { openInvites } from './useTeam';
import type { Invite, InviteAcceptData } from './types';

export type InviteDecision = 'pending' | 'accepted' | 'declined';

export interface InviteAcceptFlow {
  /**
   * The invite this screen opened with: the one `?invite=` names while it is still open, else (no `?invite=`) the
   * newest pending one, sent on Invite-Team or the brand's own. Null when none is open.
   */
  invite: Invite | null;
  decision: InviteDecision;
  accept: () => void;
  decline: () => void;
}

/** The invite `id` names among the open ones, or the newest open one when no id was given. */
function pickInvite(open: Invite[], id: string | null): Invite | null {
  if (id) return open.find((i) => i.id === id) ?? null;
  return open[0] ?? null;
}

/**
 * Invite-Accept flow state, on the session of the brand that sent the invite (`?brand=`, linkedBrand.ts). Accepting
 * makes the person a member on that brand's Invite-Team; either answer closes the invite.
 */
export function useInviteAccept(data: InviteAcceptData): InviteAcceptFlow {
  const store = usePublicSession();
  const [session, set] = store.use();
  const wanted = useGrowthParam('invite');
  // Fixed when the screen opens, so the answer stays on screen after the invite closes.
  const [invite] = useState<Invite | null>(() => pickInvite(openInvites(store.read(), data.invites), wanted));
  const [decision, setDecision] = useState<InviteDecision>('pending');
  function answer(next: Exclude<InviteDecision, 'pending'>) {
    if (!invite || decision !== 'pending') return;
    // INTEGRATION: POST /api/invites/:id/accept or /decline (not built yet), after email-code sign-in (ADR-006).
    const membersAdded = next === 'accepted' ? [...session.membersAdded, { id: uniqueId('member'), name: invite.email, role: invite.role }] : session.membersAdded;
    set({ invitesClosed: [...session.invitesClosed, invite.id], membersAdded });
    setDecision(next);
  }
  return { invite, decision, accept: () => answer('accepted'), decline: () => answer('declined') };
}
