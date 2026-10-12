import type { ReactNode } from 'react';
import { Badge } from '../primitives/Badge';
import { Card } from '../composites/Card';
import styles from './AmbPublishRouteCard.module.css';

export interface AmbPublishRouteCardProps {
  title: string;
  /** Chip above the title ("Fastest · for this post"). */
  badge?: string;
  description?: string;
  /** The recommended route for this post, drawn with a strong border. */
  selected?: boolean;
  /** Connection line, inputs and the route's action. */
  children?: ReactNode;
}

/** D30 PublishRouteCard: one way to publish (post on your behalf, paste your post URL, submit a page URL). States: default, selected. */
export function AmbPublishRouteCard({ title, badge, description, selected = false, children }: AmbPublishRouteCardProps) {
  return (
    <Card variant={selected ? 'selected' : 'default'} as="section">
      {badge && <span className={styles.badge}><Badge>{badge}</Badge></span>}
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.desc}>{description}</p>}
      <div className={styles.body}>{children}</div>
    </Card>
  );
}
