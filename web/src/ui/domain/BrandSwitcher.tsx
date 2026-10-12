import { Menu, type MenuItem } from '../composites/Menu';

export interface BrandOption {
  id: string;
  name: string;
  /** D36 official status: the brand has proven it controls its domain. */
  verified?: boolean;
}

export interface BrandSwitcherProps {
  brands: BrandOption[];
  currentId: string;
  onSelect: (id: string) => void;
  /** Adds an "Add a brand" item (canvas Brand-Switcher). */
  onAdd?: () => void;
  defaultOpen?: boolean;
}

const ADD = '__add__';

/** D48 BrandSwitcher: C16 Menu of the account's brands with each brand's official status; fills the AppShell brand slot. */
export function BrandSwitcher({ brands, currentId, onSelect, onAdd, defaultOpen }: BrandSwitcherProps) {
  const current = brands.find((b) => b.id === currentId) ?? brands[0];
  const items: MenuItem[] = brands.map((b) => ({ id: b.id, checked: b.id === current?.id, label: `${b.name} · ${b.verified ? 'verified' : 'unverified'}` }));
  if (onAdd) items.push({ id: ADD, label: 'Add a brand' });
  return (
    <Menu
      trigger={current?.name ?? 'Choose a brand'}
      triggerLabel={current ? `${current.name}, switch brand` : 'Choose a brand'}
      items={items}
      onSelect={(id) => (id === ADD ? onAdd?.() : onSelect(id))}
      defaultOpen={defaultOpen}
      align="end"
    />
  );
}
