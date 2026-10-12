import type { ReactNode } from 'react';
import { Card, type CardVariant } from '../composites/Card';
import { Heading, type HeadingLevel } from '../primitives/Heading';
import { Icon, type IconName } from '../primitives/Icon';
import { Text } from '../primitives/Text';
import styles from './VerifyResultCard.module.css';

export type VerifyResultTone = 'match' | 'nomatch' | 'edited' | 'retracted';

// Canvas boxes: match and edited are the strong selected box, not found is the soft dashed one, retracted the error box.
const toneView: Record<VerifyResultTone, { variant: CardVariant; icon: IconName }> = {
  match: { variant: 'selected', icon: 'check' },
  nomatch: { variant: 'dashed', icon: 'alert' },
  edited: { variant: 'selected', icon: 'info' },
  retracted: { variant: 'emphasis', icon: 'cross' },
};

export interface VerifyResultCardProps {
  tone: VerifyResultTone;
  title: string;
  /** One line under the title. */
  summary?: ReactNode;
  /** Details: a KeyValueList, a DiffView, notes. */
  children?: ReactNode;
  /** Up to three actions. */
  actions?: ReactNode;
  level?: HeadingLevel;
}

/**
 * D34 VerifyResult: the result box of a check (canvas Verify-1 to Verify-5). The icon and title carry the outcome, so
 * it never depends on colour. Details and actions are slots, so each outcome composes its own content.
 */
export function VerifyResultCard({ tone, title, summary, children, actions, level = 2 }: VerifyResultCardProps) {
  const view = toneView[tone];
  return (
    <Card variant={view.variant} as="section">
      <div className={styles.body}>
        <div className={styles.head}>
          <Icon name={view.icon} size="lg" />
          <div className={styles.titles}>
            <Heading level={level} size="xl">{title}</Heading>
            {summary && <Text tone="secondary">{summary}</Text>}
          </div>
        </div>
        {children}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </Card>
  );
}
