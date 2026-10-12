/*
 * Data contract: Brand-Switcher (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Brand-Switcher; issue #51)
 * Backend map §3 data model: brands, memberships (the account's brands); §4 row "BB-1-Basics" POST /api/brands (Add a
 * brand); row "Onboard-2-Domain" (domain verified status). Inventory D48 BrandSwitcher, D36 OfficialStatus.
 * Shape: BrandSwitcherData in ./types.
 *
 * | Field             | Source                                                     | Empty when                |
 * |-------------------|------------------------------------------------------------|---------------------------|
 * | brands[].name     | brands.name for each membership                            | never (one brand at least)|
 * | brands[].detail   | brands.domain, or the founder link for a person kit        | no domain                 |
 * | brands[].status   | self-declared / domain verified (D36) / person             | never                     |
 * | currentId         | The active brand (session)                                 | never                     |
 * | founderId         | The linked founder profile (architecture §3, founder link) | no founder profile        |
 *
 * States: success, loading.
 */
import { useState } from 'react';
import { Badge, Button } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SoonHubFrame } from '../../ui/domain/SoonHubFrame';
import { SoonAddForm } from '../../ui/domain/SoonAddForm';
import { SoonStatusList } from '../../ui/domain/SoonStatusList';
import { SoonStatusRow } from '../../ui/domain/SoonStatusRow';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { StateView } from './StateView';
import { useSoonRoutes } from './routes';
import { soonStatus } from './status';
import { domain, required } from './validate';
import type { BrandSwitcherData, StatusRowItem } from './types';

export function BrandSwitcherScreen({ data, state = 'success' }: { data: BrandSwitcherData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const [brands, setBrands] = useState<StatusRowItem[]>(data.brands);
  const [current, setCurrent] = useState(data.currentId);
  const actionFor = (b: StatusRowItem) => {
    if (b.id === current) return <Badge tone="solid">Current</Badge>;
    if (b.id === data.founderId) return <Button href={routes.founderProfile} variant="secondary" aria-label={`Open ${b.name}`}>Open</Button>;
    // INTEGRATION: switching sets the active brand for the session (no endpoint yet).
    return <Button variant="secondary" aria-label={`Switch to ${b.name}`} onClick={() => setCurrent(b.id)}>Switch</Button>;
  };
  // INTEGRATION: POST /api/brands { name, domain }; a new brand is self-declared until its domain is verified.
  const add = (v: Record<string, string>) => {
    setBrands((bs) => [...bs, { id: `brand-${bs.length + 1}`, name: v.name, detail: v.domain, status: 'self-declared' }]);
  };
  return (
    <SoonHubFrame header={{ title: 'Your brands', intro: 'Switch brand, or add another. Each brand has its own kit, posts and record.', definedIn: 'component inventory D48 BrandSwitcher, D36; architecture §3 (Brand, founder link)' }}>
      <StateView state={state} loading={{ title: 'Loading your brands', body: 'Reading the brands on your account.' }}>
        <Card>
          <SoonStatusList label="Brands">
            {brands.map((b) => (
              <SoonStatusRow key={b.id} name={b.name} detail={b.detail} status={soonStatus[b.status]} selected={b.id === current} actions={actionFor(b)} />
            ))}
          </SoonStatusList>
        </Card>
        <SoonAddForm
          triggerLabel="Add a brand"
          label="Add a brand"
          fields={[
            { name: 'name', label: 'Brand name', validate: required('the brand name') },
            { name: 'domain', label: 'Website domain', hint: 'For example example.com. You can verify it later.', validate: domain },
          ]}
          submitLabel="Add brand"
          onSubmit={add}
        />
      </StateView>
    </SoonHubFrame>
  );
}
