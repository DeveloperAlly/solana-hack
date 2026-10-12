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
 * | (active brand)    | flows/brand/activeBrand: the app-wide active brand        | never                     |
 * | founderId         | The linked founder profile (architecture §3, founder link) | no founder profile        |
 *
 * States: success, loading.
 */
import { Badge, Button } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SoonPage } from './SoonPage';
import { InlineForm } from '../../ui/composites/InlineForm';
import { List, ListRow } from '../../ui/composites/ListRow';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { uniqueId } from '../../lib/id';
import { StateView } from '../../ui/composites/StateView';
import { useSoonSession } from './useSoonSession';
import { useActiveBrandId } from '../../flows/brand/activeBrand';
import { useSoonRoutes } from './routes';
import { soonStatus } from './status';
import { domain, required } from './validate';
import type { BrandSwitcherData, StatusRowItem } from './types';

export function BrandSwitcherScreen({ data, state = 'success' }: { data: BrandSwitcherData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const [session, set] = useSoonSession();
  // The current brand is the app-wide active brand (flows/brand), shared with every frame's switcher; added brands are session state.
  const brands = [...data.brands, ...(session.addedBrands ?? [])];
  const [current, setCurrent] = useActiveBrandId();
  const actionFor = (b: StatusRowItem) => {
    if (b.id === current) return <Badge tone="solid">Current</Badge>;
    if (b.id === data.founderId) return <Button href={routes.founderProfile} variant="secondary" aria-label={`Open ${b.name}`}>Open</Button>;
    // INTEGRATION: switching sets the active brand for the session (no endpoint yet).
    return <Button variant="secondary" aria-label={`Switch to ${b.name}`} onClick={() => setCurrent(b.id)}>Switch</Button>;
  };
  // INTEGRATION: POST /api/brands { name, domain }; a new brand is self-declared until its domain is verified.
  const add = (v: Record<string, string>) => {
    set({ addedBrands: [...(session.addedBrands ?? []), { id: uniqueId('brand'), name: v.name, detail: v.domain, status: 'self-declared' }] });
  };
  return (
    <SoonPage header={{ title: 'Your brands', intro: 'Switch brand, or add another. Each brand has its own kit, posts and record.', definedIn: 'component inventory D48 BrandSwitcher, D36; architecture §3 (Brand, founder link)' }}>
      <StateView state={state} loading={{ title: 'Loading your brands', body: 'Reading the brands on your account.' }}>
        <Card>
          <List label="Brands">
            {brands.map((b) => (
              <ListRow key={b.id} title={b.name} detail={b.detail} status={soonStatus[b.status]} selected={b.id === current} actions={actionFor(b)} />
            ))}
          </List>
        </Card>
        <InlineForm surface="card"
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
    </SoonPage>
  );
}
