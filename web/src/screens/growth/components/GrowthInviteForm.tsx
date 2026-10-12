import type { FormEvent } from 'react';
import { Alert, Button, Field, Select, Stack, Text } from '../../../ui/primitives';
import type { RoleOption, TeamRole } from '../types';
import type { TeamFlow } from '../useTeam';

export interface GrowthInviteFormProps {
  flow: TeamFlow;
  roles: RoleOption[];
}

/** Invite by email with a role (never pre-chosen); disabled with the seat gate's reason when every seat is in use. */
export function GrowthInviteForm({ flow, roles }: GrowthInviteFormProps) {
  const role = roles.find((r) => r.id === flow.form.role);
  function submit(e: FormEvent) {
    e.preventDefault();
    flow.send();
  }
  return (
    <form onSubmit={submit} aria-label="Invite a teammate or partner" noValidate>
      <Stack gap={4}>
        {flow.seats.blocking && <Alert tone="warning" title="No free seats">{flow.seats.label}</Alert>}
        <Field label="Email" type="email" autoComplete="off" value={flow.form.email} onChange={(e) => flow.setForm({ email: e.target.value })} error={flow.errors.email} />
        <Select
          label="Role"
          value={flow.form.role}
          onValueChange={(v) => flow.setForm({ role: v as TeamRole | '' })}
          options={[{ value: '', label: 'Choose a role' }, ...roles.map((r) => ({ value: r.id, label: r.label }))]}
          hint={role?.detail}
          error={flow.errors.role}
        />
        <div>
          <Button type="submit" disabled={flow.seats.blocking}>Send invite</Button>
        </div>
        <p role="status" className="wl-visually-hidden">{flow.lastSent ? `Invite sent to ${flow.lastSent}.` : ''}</p>
        {flow.lastSent && <Text variant="small" tone="secondary">Invite sent to {flow.lastSent}. It shows under Pending invites.</Text>}
      </Stack>
    </form>
  );
}
