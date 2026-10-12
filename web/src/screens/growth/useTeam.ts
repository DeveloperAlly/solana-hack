import { useState } from 'react';
import { uniqueId } from '../../lib/id';
import { emailCheck, seatCheck } from './checks';
import { growthSession, nowIso, type GrowthSession } from './session';
import type { Check, Invite, Member, TeamData, TeamRole } from './types';

/** Pending invites: sent here (newest first), then the fixture's, minus any revoked, accepted or declined. */
export function openInvites(session: GrowthSession, base: Invite[]): Invite[] {
  return [...session.invitesAdded, ...base].filter((i) => !session.invitesClosed.includes(i.id));
}

/** The email field's error: not an address, or already invited. */
function emailError(value: string, invites: Invite[]): string | undefined {
  const check = emailCheck(value);
  if (check.blocking) return check.label;
  const email = value.trim().toLowerCase();
  if (invites.some((i) => i.email.toLowerCase() === email)) return `${value.trim()} already has an invite.`;
  return undefined;
}

export interface InviteFormState {
  email: string;
  role: TeamRole | '';
}

export interface TeamFlow {
  members: Member[];
  invites: Invite[];
  /** The one seat gate: the badge shows its label and Send invite is disabled while it blocks. */
  seats: Check;
  used: number;
  form: InviteFormState;
  setForm: (patch: Partial<InviteFormState>) => void;
  /** Field errors, shown after a submit attempt. */
  errors: { email?: string; role?: string };
  /** The address of the last invite sent, for the confirmation line. */
  lastSent: string | null;
  send: () => void;
  revoke: (id: string) => void;
}

/** Invite-Team flow state: members, pending invites, the seat gate and the invite form (role is never pre-chosen). */
export function useTeam(data: TeamData): TeamFlow {
  const [session, set] = growthSession.use();
  const [form, setFormState] = useState<InviteFormState>({ email: '', role: '' });
  const [errors, setErrors] = useState<TeamFlow['errors']>({});
  const [lastSent, setLastSent] = useState<string | null>(null);
  const members = [...data.members, ...session.membersAdded];
  const invites = openInvites(session, data.invites);
  const used = members.length + invites.length;
  const seats = seatCheck(used, data.seatLimit);

  function send() {
    const next = { email: emailError(form.email, invites), role: form.role ? undefined : 'Choose a role.' };
    setErrors(next);
    if (seats.blocking || next.email || next.role || !form.role) return;
    // INTEGRATION: POST /api/brands/:id/invites { email, role } -> memberships (backend map §4 Roadmap, "Partners").
    const invite: Invite = { id: uniqueId('invite'), email: form.email.trim(), role: form.role, invitedBy: data.owner, sentAt: nowIso() };
    set({ invitesAdded: [invite, ...session.invitesAdded] });
    setLastSent(invite.email);
    setFormState({ email: '', role: '' });
  }

  return {
    members,
    invites,
    seats,
    used,
    form,
    setForm: (patch) => setFormState((f) => ({ ...f, ...patch })),
    errors,
    lastSent,
    send,
    // INTEGRATION: DELETE /api/invites/:id.
    revoke: (id) => set({ invitesClosed: [...session.invitesClosed, id] }),
  };
}
