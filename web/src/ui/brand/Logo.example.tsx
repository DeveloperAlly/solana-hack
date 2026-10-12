import { Logo } from './Logo';
import styles from './Logo.example.module.css';

/** Workbench example: both variants at each size, plus the logo on an inverse surface (currentColor follows it). */
export function LogoExample() {
  return (
    <div className={styles.row}>
      <Logo size="md" />
      <Logo size="lg" />
      <Logo size="xl" />
      <Logo variant="mark" size="lg" />
      <span className={styles.inverse}>
        <Logo size="lg" className={styles.inherit} />
      </span>
    </div>
  );
}
