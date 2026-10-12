import { Card } from '../../../ui/composites/Card';
import { StatTile } from '../../../ui/composites/StatTile';
import { Grid, Select, Text } from '../../../ui/primitives';
import { eventRoles, roleLabel } from '../../../domain/event';
import { useGrowthLinks } from '../paths';
import type { EventDetailFlow } from '../useEventDetail';

const roles = eventRoles.map((r) => ({ value: r.id, label: r.label }));

/** Event-Detail's four tiles: role (with the select that swaps the plan), campaign, plan readiness, Luma guests. */
export function EventKpis({ flow }: { flow: EventDetailFlow }) {
  const links = useGrowthLinks();
  const e = flow.event;
  return (
    <Grid min="sm">
      <Card as="div">
        <Text variant="small" tone="secondary">Role: {e.role ? roleLabel(e.role) : 'not set'}</Text>
        <Select label="Change role" hint="The role picks the content plan." options={roles} value={e.role ?? ''} onValueChange={flow.changeRole} />
      </Card>
      <StatTile label="Campaign" value={e.campaign ?? 'None'} sub={e.campaign ? 'counts toward its verified posts' : 'Not part of a campaign'} href={e.campaign ? links.to('Campaign-v2-2-Measure') : undefined} />
      <StatTile label="Content plan" value={`${flow.readiness.ready} / ${flow.readiness.planned}`} sub="posts ready" />
      <StatTile label="Guests on Luma" value={e.guests === null ? 'Not on Luma' : String(e.guests)} sub={e.guests === null ? 'Added by hand' : 'registered'} />
    </Grid>
  );
}
