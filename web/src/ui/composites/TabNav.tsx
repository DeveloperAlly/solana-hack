import { Link as RouterLink } from 'react-router';
import { TabLabel, tabClass, type TabItem } from './TabLabel';
import styles from './Tabs.module.css';

export interface TabNavProps {
  label: string;
  items: (TabItem & { href: string })[];
  /** id of the current item; it gets aria-current="page". */
  value: string;
}

/** C4 Tabs (link driven): a tab-styled nav where each tab is a page; the current one has aria-current="page". */
export function TabNav({ label, items, value }: TabNavProps) {
  return (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <RouterLink to={item.href} aria-current={item.id === value ? 'page' : undefined} className={tabClass(item.id === value)}>
              <TabLabel item={item} />
            </RouterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
