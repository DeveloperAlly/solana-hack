import { TabNav } from '../../ui/composites/Tabs';
import { soonRoutes } from './routes';

const items = [
  { id: 'ai', label: 'AI and keys', href: soonRoutes.settingsAI },
  { id: 'connections', label: 'Connections', href: soonRoutes.settingsConnections },
  { id: 'plan', label: 'Plan', href: soonRoutes.settingsPlan },
];

export type SettingsSection = 'ai' | 'connections' | 'plan';

/** The Settings tabs drawn on Settings-AI, Settings-Connections and Settings-Plan; each tab is its own screen. */
export function SettingsNav({ value }: { value: SettingsSection }) {
  return <TabNav label="Settings sections" items={items} value={value} />;
}
