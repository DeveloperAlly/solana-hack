import type { ReactNode } from 'react';
import type { ThemeName } from '../tokens/tokens';
import { ThemeSwitch } from './ThemeSwitch';
import styles from './Gallery.module.css';

/** The dashed gallery bar: a title (or breadcrumb), optional controls, and the theme switch. */
export function GalleryToolbar({ title, theme, children }: { title: ReactNode; theme: ThemeName; children?: ReactNode }) {
  return (
    <aside aria-label="Gallery controls" className={styles.toolbar}>
      <span className={styles.toolbarTitle}>{title}</span>
      {children}
      <ThemeSwitch value={theme} />
    </aside>
  );
}
