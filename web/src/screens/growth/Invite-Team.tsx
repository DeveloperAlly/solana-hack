/*
 * Data contract: Invite-Team (canvas board "Invite-Team", v22; issue #82, sub-task "Invite a teammate
 * or partner": "an invite flow with seats and roles"; turns J8's "Invite a teammate" into a real flow). Backend map
 * §3 (memberships: seats and roles) and §4 Roadmap, "Partners" (invites become memberships; email needs SMTP).
 * Shape: TeamData in ./types.ts.
 *
 * | Field        | Source                                                                         | Empty when          |
 * |--------------|--------------------------------------------------------------------------------|---------------------|
 * | brand, owner | brands.name; the owner's profile (bracketed)                                   | never               |
 * | seatLimit    | GET …/plan -> seats (G-BILLING open); canvas Partners: 3                       | never               |
 * | roles[]      | memberships.role: teammate, partner (canvas Partners; ADR-003)                 | never               |
 * | members[]    | GET /api/brands/:id/members (not built yet) plus invites accepted (session)    | only the owner      |
 * | invites[]    | GET /api/brands/:id/invites (not built yet) plus invites sent here (session)   | none pending        |
 *
 * States (C28): success = seats, form and team; empty = only the owner, nobody invited; loading; error.
 */
import { Heading } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { Columns } from '../../ui/layouts/Columns';
import { StateView } from '../../ui/composites/StateView';
import { ScreenLink } from '../../gallery/ScreenLink';
import { GrowthFrame } from './components/GrowthFrame';
import { GrowthInviteForm } from './components/GrowthInviteForm';
import { GrowthSeatSummary } from './components/GrowthSeatSummary';
import { GrowthTeamList } from './components/GrowthTeamList';
import { growthArtboards } from './paths';
import { useTeam } from './useTeam';
import type { ScreenProps, TeamData } from './types';

export function InviteTeam({ data, state = 'success' }: ScreenProps<TeamData>) {
  const flow = useTeam(data);
  return (
    <GrowthFrame
      section="team"
      title="Invite a teammate or partner"
      tag="COMING SOON"
      intro={`Bring people onto ${data.brand}. They write from your kit, and you approve every piece.`}
      meta="Drawn, not built: invites need memberships and email. Defined in: issue #82 (Invite a teammate or partner); canvas Partners."
      actions={<ScreenLink artboard={growthArtboards.accept}>Preview the invite</ScreenLink>}
    >
      <StateView
        state={state === 'empty' ? 'success' : state}
        loading={{ title: 'Loading your team', body: 'Reading members and invites.' }}
        error={{ title: 'Could not load your team', body: 'Reload the page in a minute.' }}
      >
        <Columns end={<GrowthTeamList owner={data.owner} members={flow.members} invites={flow.invites} roles={data.roles} onRevoke={flow.revoke} />}>
          <Card header={<Heading level={2} size="lg">Invite</Heading>}>
            <GrowthSeatSummary used={flow.used} limit={data.seatLimit} seats={flow.seats} />
            <GrowthInviteForm flow={flow} roles={data.roles} />
          </Card>
        </Columns>
      </StateView>
    </GrowthFrame>
  );
}
