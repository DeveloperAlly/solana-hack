import type { ReactNode } from 'react';
import { Heading, type HeadingLevel } from '../primitives/Heading';
import { Text } from '../primitives/Text';
import { Icon } from '../primitives/Icon';
import { Card } from './Card';
import styles from './StatePanel.module.css';

export type StatePanelKind = 'loading' | 'error' | 'success';

export interface StatePanelProps {
  kind: StatePanelKind;
  title: string;
  body?: ReactNode;
  /** Retry (error) or next action (success). */
  actions?: ReactNode;
  level?: HeadingLevel;
}

/**
 * C29 StatePanel: the loading, error or success panel for a screen or section. Pairs with C3 EmptyState so every
 * screen has its four states. Loading is announced politely (role="status"); error is announced (role="alert").
 */
export function StatePanel({ kind, title, body, actions, level = 2 }: StatePanelProps) {
  const role = kind === 'error' ? 'alert' : 'status';
  return (
    <Card variant={kind === 'error' ? 'emphasis' : kind === 'success' ? 'selected' : 'subtle'} as="div">
      <div className={styles.row} role={role} aria-busy={kind === 'loading' || undefined}>
        {kind === 'loading' ? <span className={styles.spinner} aria-hidden="true" /> : <Icon name={kind === 'error' ? 'alert' : 'check'} size="lg" />}
        <div className={styles.text}>
          <Heading level={level} size="lg">{title}</Heading>
          {typeof body === 'string' ? <Text tone="secondary">{body}</Text> : body && <div className={styles.text}>{body}</div>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </Card>
  );
}
