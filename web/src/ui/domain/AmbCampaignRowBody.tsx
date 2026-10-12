import type { ReactNode } from 'react';
import { Badge } from '../primitives/Badge';
import { ProgressBar } from '../composites/ProgressBar';
import type { AmbCampaignFields } from './AmbCampaignCard';
import styles from './AmbCampaignCard.module.css';

/** Desktop campaign row (canvas Amb-1-Campaigns ".card"): brand, payout, time, slots with budget used, action. Part of D24. */
export function AmbCampaignRowBody({ brandLine, title, channelsLabel, payout, payoutSub, timeLeft, timeSub, slots, budgetUsedPct, budgetReached, action }: AmbCampaignFields & { action?: ReactNode }) {
  return (
    <div className={`${styles.grid} ${styles.row}`}>
      <div className={styles.cell}>
        <p className={styles.sub}>{brandLine}</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.sub}>{channelsLabel}</p>
      </div>
      <div className={styles.cell}>
        <p className={budgetReached ? styles.muted : styles.strong}>{payout} per piece</p>
        {payoutSub && <p className={styles.sub}>{payoutSub}</p>}
      </div>
      <div className={styles.cell}>
        {budgetReached ? <Badge tone="solid">Budget reached</Badge> : <p className={styles.strong}>{timeLeft}</p>}
        {timeSub && <p className={styles.sub}>{timeSub}</p>}
      </div>
      <div className={styles.cell}>
        <p className={budgetReached ? styles.sub : styles.strong}>{budgetReached ? 'Closed to new posts' : slots}</p>
        {budgetUsedPct !== undefined && (
          <>
            <ProgressBar decorative size="sm" label="Budget used" segments={[{ value: budgetUsedPct, label: 'Used' }]} />
            <p className={styles.sub}>budget {budgetUsedPct}% used</p>
          </>
        )}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
