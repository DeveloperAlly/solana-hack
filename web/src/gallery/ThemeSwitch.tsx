import { Link as RouterLink, useSearchParams } from 'react-router';
import { themeNames, type ThemeName } from '../tokens/tokens';
import { withParam } from './useGalleryTheme';
import styles from './Gallery.module.css';

/** Gallery theme switch: one link per theme file (?theme=), the current one marked. */
export function ThemeSwitch({ value }: { value: ThemeName }) {
  const [params] = useSearchParams();
  return (
    <nav aria-label="Theme" className={styles.switch}>
      <span className={styles.switchLabel} aria-hidden="true">Theme</span>
      <ul className={styles.switchList}>
        {themeNames.map((t) => (
          <li key={t}>
            <RouterLink to={withParam(params, 'theme', t)} aria-current={t === value ? 'true' : undefined} className={[styles.switchItem, t === value && styles.switchActive].filter(Boolean).join(' ')}>
              {t}
            </RouterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
