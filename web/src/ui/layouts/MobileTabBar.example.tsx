import type { WorkbenchExample } from '../../system/example';
import { mobileTabs } from '../../config/nav';
import { MobileTabBar } from './MobileTabBar';

// The tab bar of canvas v21 board M-Today (config/nav.ts; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'L4',
  name: 'MobileTabBar',
  description: 'The loop mobile tabs (Today, Create, Verify, Grow, More) with Today current.',
  render: () => <MobileTabBar label="Mobile tabs example" current="today" items={mobileTabs.map((t) => ({ id: t.id, label: t.label, href: `/system#${t.id}` }))} />,
};
