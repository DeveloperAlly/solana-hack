/*
 * Data contract: Invite-Accept (canvas board "Invite-Accept", v22; issue #82, sub-task "Invite a
 * teammate or partner": "plus the accept-invite screen"). Backend map §3 (memberships) and §4 Roadmap, "Partners".
 * Sign-in is Supabase email code, no wallet (ADR-006). Shape: InviteAcceptData in ./types.ts.
 *
 * | Field       | Source                                                                          | Empty when                 |
 * |-------------|---------------------------------------------------------------------------------|----------------------------|
 * | brand       | invites.brand_id -> brands.name                                                 | never                      |
 * | invite      | GET /api/invites/:token (not built yet); newest pending invite (session, Invite-Team) | revoked or already answered |
 * | roles[]     | memberships.role labels and what each allows (canvas Partners)                  | never                      |
 * | voices[]    | the voices the owner chose for a partner (canvas Partners: Founder, Technical)  | teammate (not shown)       |
 *
 * States (C28): success = the invite with Accept and Decline (then accepted or declined); empty = no open invite;
 * loading = opening the invite; error = it could not be opened.
 */
import { resolveState } from '../resolveState';
import { StateView } from '../../ui/composites/StateView';
import { StatePanel } from '../../ui/composites/StatePanel';
import { ScreenLink } from '../../gallery/ScreenLink';
import { PublicFrame } from './components/PublicFrame';
import { GrowthInviteCard } from './components/GrowthInviteCard';
import { growthArtboards } from './paths';
import { useInviteAccept } from './useInviteAccept';
import type { InviteAcceptData, ScreenProps } from './types';

export function InviteAccept({ data, state = 'success' }: ScreenProps<InviteAcceptData>) {
  const flow = useInviteAccept(data);
  const { invite } = flow;
  const teamLink = <ScreenLink artboard={growthArtboards.team}>See the team</ScreenLink>;
  const decided = {
    accepted: <StatePanel kind="success" title={`You’re on ${data.brand}’s team`} body="Sign in with your email code to start. Your drafts go to the owner for approval." actions={teamLink} />,
    declined: <StatePanel kind="success" title="Invite declined" body={`We told ${data.brand}. Nothing else happens.`} actions={teamLink} />,
  };
  return (
    <PublicFrame
      title={`You’re invited to ${data.brand}`}
      tag="COMING SOON"
      intro="Write from the brand’s kit, in its voice. The brand approves every piece."
      meta="Drawn, not built. Defined in: issue #82 (Invite a teammate or partner)."
    >
      <StateView
        state={resolveState(state, !invite)}
        loading={{ title: 'Opening your invite', body: 'Checking the invite link.' }}
        error={{ title: 'Could not open this invite', body: 'Reload the page in a minute, or ask for a new invite.' }}
        empty={{ title: 'This invite is no longer open', body: 'It was revoked or already answered. Ask the brand owner for a new one.' }}
      >
        {invite && flow.decision === 'pending' && (
          <GrowthInviteCard brand={data.brand} invite={invite} role={data.roles.find((r) => r.id === invite.role)} voices={data.voices} onAccept={flow.accept} onDecline={flow.decline} />
        )}
        {flow.decision !== 'pending' && decided[flow.decision]}
      </StateView>
    </PublicFrame>
  );
}
