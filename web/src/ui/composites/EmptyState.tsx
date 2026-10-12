import type { ReactNode } from 'react';
import { Heading, type HeadingLevel } from '../primitives/Heading';
import { Text } from '../primitives/Text';
import { Icon, type IconName } from '../primitives/Icon';
import { Card } from './Card';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  /** A string renders as secondary text; other content (several paragraphs) renders as given. */
  body?: ReactNode;
  /** Up to three actions (Buttons or Links). */
  actions?: ReactNode;
  icon?: IconName;
  /** Heading level for the title; pick the one that fits the page outline. */
  level?: HeadingLevel;
}

/** C3 EmptyState: title, body, up to three actions and an optional icon, in a dashed card. */
export function EmptyState({ title, body, actions, icon, level = 2 }: EmptyStateProps) {
  return (
    <Card variant="dashed" as="div">
      <div className={styles.row}>
        {icon && <Icon name={icon} size="lg" />}
        <div className={styles.text}>
          <Heading level={level} size="lg">{title}</Heading>
          {typeof body === 'string' ? <Text tone="secondary">{body}</Text> : body && <div className={styles.text}>{body}</div>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </Card>
  );
}
