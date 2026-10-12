import type { ReactNode } from 'react';
import { Card } from '../composites/Card';
import { AmbCampaignRowBody } from './AmbCampaignRowBody';
import { AmbCampaignStackBody } from './AmbCampaignStackBody';

/** What a campaign card shows; shared by both layouts. */
export interface AmbCampaignFields {
  /** "aDNA · open standard for agentic project context" (desktop) or "aDNA" (mobile). */
  brandLine: string;
  title: string;
  channelsLabel: string;
  payout: string;
  payoutSub?: string;
  timeLeft?: string;
  timeSub?: string;
  slots?: string;
  budgetUsedPct?: number;
  /** Closed: muted card with the "Budget reached" chip (canvas note n-a1). */
  budgetReached: boolean;
}

export interface AmbCampaignCardProps extends AmbCampaignFields {
  /** `row`: the desktop grid row. `stack`: the mobile stacked card. */
  layout?: 'row' | 'stack';
  /** Makes the whole card a link (mobile: "Tap card opens detail", canvas note n-m1). Use with no `action`. */
  href?: string;
  /** The card's control (View, Notify me). */
  action?: ReactNode;
}

const bodies = { row: AmbCampaignRowBody, stack: AmbCampaignStackBody } as const;

/** D24 CampaignCard: brand, title, payout range, time left, slots and budget used, plus an action. States: open, budget reached. */
export function AmbCampaignCard({ layout = 'row', href, action, ...fields }: AmbCampaignCardProps) {
  const Body = bodies[layout];
  return (
    <Card variant={fields.budgetReached ? 'subtle' : 'default'} as="article" href={href}>
      <Body {...fields} action={action} />
    </Card>
  );
}
