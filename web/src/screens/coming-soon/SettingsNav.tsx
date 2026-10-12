import { TabNav } from '../../ui/composites/Tabs';
import { useSoonRoutes, type SoonRoute } from './routes';

export type SettingsSection = 'ai' | 'connections' | 'plan';

const items: { id: SettingsSection; label: string; route: SoonRoute }[] = [
  { id: 'ai', label: 'AI and keys', route: 'settingsAI' },
  { id: 'connections', label: 'Connections', route: 'settingsConnections' },
  { id: 'plan', label: 'Plan', route: 'settingsPlan' },
];

/** The Settings tabs drawn on Settings-AI, Settings-Connections and Settings-Plan; each tab is its own screen. */
export function SettingsNav({ value }: { value: SettingsSection }) {
  const routes = useSoonRoutes();
  return <TabNav label="Settings sections" items={items.map((i) => ({ id: i.id, label: i.label, href: routes[i.route] }))} value={value} />;
}
