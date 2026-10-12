import { useId, type ReactNode } from 'react';
import { Card } from '../composites/Card';
import { Badge, Heading, Text } from '../primitives';
import type { BadgeTone } from '../primitives/Badge';
import type { QuestState } from '../../domain/quest';
import styles from './QuestCard.module.css';

export interface QuestCardProps {
  task: string;
  state: QuestState;
  /** Submissions waiting (the submitted state's chip: "2 to review"). */
  waiting: number;
  /** "50 USDC each · 3 of 5 slots left · due Fri 24 Oct". */
  terms: string;
  /** e.g. the Submissions button. */
  actions?: ReactNode;
  selected?: boolean;
}

const chip: Record<QuestState, (waiting: number) => { label: string; tone: BadgeTone }> = {
  'coming-soon': () => ({ label: 'Coming soon', tone: 'neutral' }),
  open: () => ({ label: 'Open', tone: 'neutral' }),
  submitted: (n) => ({ label: `${n} to review`, tone: 'warning' }),
  paid: () => ({ label: 'Paid · budget reached', tone: 'solid' }),
};

/**
 * D53 QuestCard: one paid task, its USDC reward, slots and deadline (canvas v24 Quests). States: coming soon, open,
 * submitted (submissions to review), paid (every slot paid; the budget is reached and the quest closes).
 */
export function QuestCard({ task, state, waiting, terms, actions, selected = false }: QuestCardProps) {
  const id = useId();
  const c = chip[state](waiting);
  return (
    <Card labelledBy={id} variant={selected ? 'selected' : state === 'paid' ? 'subtle' : 'default'}>
      <div className={styles.head}>
        <Heading level={3} size="lg" id={id}>{task}</Heading>
        <Badge tone={c.tone}>{c.label}</Badge>
      </div>
      <Text variant="small">{terms}</Text>
      {actions && <div className={styles.actions}>{actions}</div>}
    </Card>
  );
}
