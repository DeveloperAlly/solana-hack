// Sample data for Invite-Team and Invite-Accept (issue #82).
// Sources (AGENTS rule 6): canvas Partners ("Invite a partner · Email · Voices they can use: Founder, Technical ·
// You approve every piece · Send invite (uses 1 of 3 seats)"; current partners [Agency name] Active and
// [Integration partner] Invited); ADR-003 (partners and ambassadors join as free seats); canvas J8-Hub-FirstRun
// ("Invite a teammate or partner"). Names and emails stay bracketed.
import type { InviteAcceptData, RoleOption, TeamData } from './types';

export const teamRoles: RoleOption[] = [
  { id: 'teammate', label: 'Teammate', detail: 'Drafts posts in your voices. You approve every piece.' },
  { id: 'partner', label: 'Partner', detail: 'An agency or integration partner. Writes in the voices you choose; drafts come to your approval queue.' },
];

export const team: TeamData = {
  brand: 'JamJam',
  owner: '[Founder name]',
  seatLimit: 3,
  roles: teamRoles,
  members: [{ id: 'member-agency', name: '[Agency name]', role: 'partner' }],
  invites: [{ id: 'invite-integration', email: '[integration partner email]', role: 'partner', invitedBy: '[Founder name]', sentAt: null }],
};

export const teamEmpty: TeamData = { ...team, members: [], invites: [] };

export const inviteAccept: InviteAcceptData = {
  brand: team.brand,
  roles: teamRoles,
  invites: team.invites,
  voices: ['Founder', 'Technical'],
};

/** No open invite (the empty state). */
export const inviteAcceptEmpty: InviteAcceptData = { ...inviteAccept, invites: [] };
