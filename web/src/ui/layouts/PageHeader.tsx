import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { Heading, type HeadingLevel, type HeadingSize } from '../primitives/Heading';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: string;
  /** Heading level: 1 on a screen (default), lower when previewed inside another page. */
  level?: HeadingLevel;
  size?: HeadingSize;
  /** Back link above the title. */
  back?: { href: string; label: string };
  /** Chips after the title: a D56 ComingSoonFlag, status badges. */
  badges?: ReactNode;
  /** Actions beside the title; they wrap under it on narrow screens. */
  actions?: ReactNode;
  /** Intro paragraph under the title. */
  intro?: ReactNode;
  /** Small secondary line, e.g. "Drawn, not built. Defined in: …" or "Updated 2 hours ago". */
  meta?: ReactNode;
}

/**
 * L5 PageHeader: back link, title with badges, actions, intro and a meta line.
 * Replaces SoonPageHeader (issue #46, shared consolidation); pass the flag through `badges`, since a layout may not
 * import the D56 domain component itself.
 */
export function PageHeader({ title, level = 1, size = '2xl', back, badges, actions, intro, meta }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      {back && (
        <RouterLink to={back.href} className={styles.back}>
          <span aria-hidden="true">← </span>
          {back.label}
        </RouterLink>
      )}
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <Heading level={level} size={size}>{title}</Heading>
          {badges}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {intro && <p className={styles.intro}>{intro}</p>}
      {meta && <p className={styles.meta}>{meta}</p>}
    </div>
  );
}
