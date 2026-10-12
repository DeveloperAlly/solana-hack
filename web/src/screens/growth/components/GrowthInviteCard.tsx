import { Button, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { KeyValueList } from '../../../ui/composites/KeyValueList';
import type { Invite, RoleOption } from '../types';

export interface GrowthInviteCardProps {
  brand: string;
  invite: Invite;
  role: RoleOption | undefined;
  voices: string[];
  onAccept: () => void;
  onDecline: () => void;
}

/** What the invited person is joining: brand, role and what it allows, voices for a partner, and Accept or Decline. */
export function GrowthInviteCard({ brand, invite, role, voices, onAccept, onDecline }: GrowthInviteCardProps) {
  const items = [
    { label: 'Invited by', value: invite.invitedBy },
    { label: 'Sent to', value: invite.email },
    { label: 'Role', value: role ? `${role.label}: ${role.detail}` : invite.role },
    ...(invite.role === 'partner' ? [{ label: 'Voices you can use', value: voices.join(', ') }] : []),
    { label: 'Approval', value: `${brand} approves every piece before it is registered.` },
  ];
  return (
    <Card>
      <Stack gap={4}>
        <Heading level={2} size="lg">Join {brand}</Heading>
        <KeyValueList label="Invite" items={items} />
        <Text variant="small" tone="secondary">Your seat is free. You sign in with your email; no wallet needed.</Text>
        <Stack direction="row" gap={3} wrap>
          <Button onClick={onAccept}>Accept invite</Button>
          <Button variant="secondary" onClick={onDecline}>Decline</Button>
        </Stack>
      </Stack>
    </Card>
  );
}
