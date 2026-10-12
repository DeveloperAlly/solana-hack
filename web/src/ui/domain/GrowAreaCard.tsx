import { useId } from 'react';
import { Card } from '../composites/Card';
import { Button, Heading, Text } from '../primitives';
import type { HeadingLevel } from '../primitives/Heading';
import styles from './GrowAreaCard.module.css';

export interface GrowAreaLink {
  label: string;
  href: string;
}

export interface GrowAreaCardProps {
  title: string;
  /** What the area does. */
  body: string;
  /** First run: the one first action this area teaches, shown in place of the body's links (canvas Grow-Home note). */
  firstAction?: { text: string; link: GrowAreaLink };
  /** Links to the area's boards. */
  links: GrowAreaLink[];
  level?: HeadingLevel;
}

/**
 * D90 GrowAreaCard: one area of Grow (ambassadors, events, campaigns, engage, partners and leads, referrals and team)
 * with what it does and links to its boards (canvas v21 Grow-Home). States: default, first run (teaches its first
 * action with a primary link).
 */
export function GrowAreaCard({ title, body, firstAction, links, level = 2 }: GrowAreaCardProps) {
  const id = useId();
  return (
    <Card labelledBy={id}>
      <Heading level={level} size="lg" id={id}>{title}</Heading>
      <Text variant="small">{body}</Text>
      {firstAction && <Text variant="small" tone="secondary">{firstAction.text}</Text>}
      <div className={styles.links}>
        {firstAction ? (
          <Button href={firstAction.link.href}>{firstAction.link.label}</Button>
        ) : (
          links.map((l) => <Button key={l.label} href={l.href} variant="secondary">{l.label}</Button>)
        )}
      </div>
    </Card>
  );
}
