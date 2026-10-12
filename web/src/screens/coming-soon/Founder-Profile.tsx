/*
 * Data contract: Founder-Profile (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Founder-Profile; issue #51)
 * Backend map §4 row "Onboard-3-Sources": POST /api/brands/:id/sources, DELETE …/sources/:id, table sources; the person
 * kit and founder link are architecture §3 (Person, founder link) and §12.1 step 2a (proposed; no endpoint yet).
 * Shape: FounderProfileData in ./types.
 *
 * | Field           | Source                                                       | Empty when            |
 * |-----------------|--------------------------------------------------------------|-----------------------|
 * | name            | The person's profile name (profiles)                         | never                 |
 * | sources[]       | sources rows for the person kit (CV, LinkedIn export, audit) | no sources yet        |
 * | linkedTo        | founder link: brand name and role                            | not linked            |
 * | sharedStories   | founder link setting: approved stories shared by both kits   | never (a boolean)     |
 *
 * States: success, empty (no sources yet).
 */
import { useState } from 'react';
import { Button, Heading, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { CheckboxRow } from '../../ui/composites/CheckboxRow';
import { SoonHubFrame } from '../../ui/domain/SoonHubFrame';
import { SoonAddForm } from '../../ui/domain/SoonAddForm';
import { SoonStatusList } from '../../ui/domain/SoonStatusList';
import { SoonStatusRow } from '../../ui/domain/SoonStatusRow';
import { useSoonRoutes } from './routes';
import { soonStatus } from './status';
import { required } from './validate';
import type { FounderProfileData, StatusRowItem } from './types';

export function FounderProfile({ data }: { data: FounderProfileData }) {
  const routes = useSoonRoutes();
  const [sources, setSources] = useState<StatusRowItem[]>(data.sources);
  const [shared, setShared] = useState(data.sharedStories);
  // INTEGRATION: POST /api/brands/:id/sources (person kit); DELETE …/sources/:id to remove.
  const add = (v: Record<string, string>) => setSources((s) => [...s, { id: `src-${s.length + 1}`, name: v.name, detail: v.detail || undefined, status: 'uploaded' }]);
  const remove = (id: string) => setSources((s) => s.filter((x) => x.id !== id));
  return (
    <SoonHubFrame header={{ title: `Founder profile: ${data.name}`, intro: 'A person’s own kit, linked to the company. Shares the story bank; keeps its own voice.', definedIn: 'architecture §3 (Person, founder link) and §12.1 step 2a (proposed)' }}>
      <Card header={<Heading level={2} size="lg">Sources</Heading>}>
        {sources.length === 0 && <Text tone="secondary">No sources yet. Add a CV or a LinkedIn export to start this kit.</Text>}
        <SoonStatusList label="Sources">
          {sources.map((s) => (
            <SoonStatusRow key={s.id} name={s.name} detail={s.detail} status={soonStatus[s.status]} actions={<Button variant="secondary" aria-label={`Remove ${s.name}`} onClick={() => remove(s.id)}>Remove</Button>} />
          ))}
        </SoonStatusList>
        <SoonAddForm
          triggerLabel="Add a source"
          label="Add a source"
          fields={[
            { name: 'name', label: 'Source', hint: 'For example: CV, LinkedIn export, a talk or an interview.', validate: required('a source name') },
            { name: 'detail', label: 'Link or note (optional)' },
          ]}
          submitLabel="Add source"
          onSubmit={add}
        />
      </Card>
      <Card header={<Heading level={2} size="lg">Linked to</Heading>}>
        <SoonStatusList label="Linked brands">
          <SoonStatusRow name={data.linkedTo} actions={<Button href={routes.brandSwitcher} variant="secondary">Your brands</Button>} />
        </SoonStatusList>
        <CheckboxRow label="Stories you approve can be used by both kits." checked={shared} onChange={(e) => setShared(e.target.checked)} />
        <Text variant="small" tone="secondary" role="status">{shared ? 'Approved stories are shared with the linked brand kit.' : 'Stories stay in this profile only.'}</Text>
      </Card>
    </SoonHubFrame>
  );
}
