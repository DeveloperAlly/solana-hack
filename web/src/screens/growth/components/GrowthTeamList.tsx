import { useId } from 'react';
import { Button, Heading, Stack, Text } from '../../../ui/primitives';
import { List, ListRow } from '../../../ui/composites/ListRow';
import { formatDateTime } from '../format';
import type { Invite, Member, RoleOption } from '../types';

export interface GrowthTeamListProps {
  owner: string;
  members: Member[];
  invites: Invite[];
  roles: RoleOption[];
  onRevoke: (id: string) => void;
}

/** The team: the owner and members, then pending invites with Revoke. */
export function GrowthTeamList({ owner, members, invites, roles, onRevoke }: GrowthTeamListProps) {
  const membersId = useId();
  const invitesId = useId();
  const roleLabel = (id: string) => roles.find((r) => r.id === id)?.label ?? id;
  return (
    <Stack gap={5}>
      <Stack as="section" gap={2} aria-labelledby={membersId}>
        <Heading level={2} size="lg" id={membersId}>Members</Heading>
        <List label="Members">
          <ListRow title={owner} status={{ label: 'Owner', tone: 'solid' }} />
          {members.map((m) => <ListRow key={m.id} title={m.name} status={{ label: roleLabel(m.role) }} />)}
        </List>
      </Stack>
      <Stack as="section" gap={2} aria-labelledby={invitesId}>
        <Heading level={2} size="lg" id={invitesId}>Pending invites</Heading>
        {invites.length === 0 ? (
          <Text tone="secondary">No pending invites.</Text>
        ) : (
          <List label="Pending invites">
            {invites.map((i) => (
              <ListRow
                key={i.id}
                title={i.email}
                detail={`${roleLabel(i.role)} · sent ${formatDateTime(i.sentAt)} by ${i.invitedBy}`}
                status={{ label: 'Invited' }}
                actions={<Button variant="secondary" onClick={() => onRevoke(i.id)} aria-label={`Revoke the invite to ${i.email}`}>Revoke</Button>}
              />
            ))}
          </List>
        )}
      </Stack>
    </Stack>
  );
}
