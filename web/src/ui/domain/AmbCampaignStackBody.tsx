import type { ReactNode } from 'react';
import { Badge } from '../primitives/Badge';
import type { AmbCampaignFields } from './AmbCampaignCard';
import styles from './AmbCampaignCard.module.css';

/** Mobile stacked campaign card (canvas M-1-Campaigns): brand, title, payout and one meta line, or the closed chip. Part of D24. */
export function AmbCampaignStackBody({ brandLine, title, channelsLabel, payout, timeLeft, slots, budgetReached, action }: AmbCampaignFields & { action?: ReactNode }) {
  const meta = [timeLeft, slots, channelsLabel].filter(Boolean).join(' · ');
  return (
    <div className={`${styles.grid} ${styles.stack}`}>
      <p className={styles.sub}>{brandLine}</p>
      <h2 className={styles.title}>{title}</h2>
      {!budgetReached && <p className={styles.small}><strong>{payout}</strong> per piece</p>}
      {budgetReached ? <span className={styles.chip}><Badge tone="solid">Budget reached</Badge></span> : <p className={styles.sub}>{meta}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
