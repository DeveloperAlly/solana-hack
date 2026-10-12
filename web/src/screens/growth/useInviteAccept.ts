import { useState } from 'react';
import { uniqueId } from '../../lib/id';
import { growthSession } from './session';
import { openInvites } from './useTeam';
import type { Invite, InviteAcceptData } from './types';

export type InviteDecision = 'pending' | 'accepted' | 'declined';

export interface InviteAcceptFlow {
  /** The invite this screen opened with: the newest pending one (sent on Invite-Team, else the fixture's). */
  invite: Invite | null;
  decision: InviteDecision;
  accept: () => void;
  decline: () => void;
}

/** Invite-Accept flow state. Accepting makes the person a member on Invite-Team; either answer closes the invite. */
export function useInviteAccept(data: InviteAcceptData): InviteAcceptFlow {
  const [session, set] = growthSession.use();
  // Fixed when the screen opens, so the answer stays on screen after the invite closes.
  const [invite] = useState<Invite | null>(() => openInvites(growthSession.read(), data.invites)[0] ?? null);
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
