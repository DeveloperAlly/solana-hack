import { useId, useState, type FormEvent } from 'react';
import { Card } from '../composites/Card';
import { GatedButton } from '../composites/GatedButton';
import { Button, Field, Heading, Select, Text } from '../primitives';
import { budgetCap, parseReward, parseSlots, questFormats, questGate, type QuestDraft } from '../../domain/quest';
import styles from './QuestForm.module.css';

export interface QuestFormProps {
  /** Starting values (a suggestion from the kit, or empty). The format is never pre-chosen unless the suggestion names one. */
  initial: QuestDraft;
  onOpen: (draft: QuestDraft) => void;
  onCancel?: () => void;
}

const formats = [{ value: '', label: 'Choose a format' }, ...questFormats.map((f) => ({ value: f.id, label: f.label }))];

/**
 * D105 QuestForm: a new paid quest (canvas v24 Quests). The format has no default; Open stays disabled until the task,
 * format, reward and slots are valid (domain/quest.ts `questGate`); the budget cap is reward × slots, held before the
 * quest opens. States: empty, filling, ready.
 */
export function QuestForm({ initial, onOpen, onCancel }: QuestFormProps) {
  const headingId = useId();
  const [d, setD] = useState<QuestDraft>(initial);
  const set = (k: keyof QuestDraft) => (v: string) => setD((prev) => ({ ...prev, [k]: v }));
  const gate = questGate(d);
  const reward = parseReward(d.reward);
  const slots = parseSlots(d.slots);
  const cap = reward !== null && slots !== null ? `${budgetCap(reward, slots).toFixed(2)} USDC, held before the quest opens` : 'Reward × slots, held before the quest opens';
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!gate.blocking) onOpen(d);
  };
  return (
    <Card as="div">
      <form className={styles.form} aria-labelledby={headingId} onSubmit={submit} noValidate>
        <Heading level={2} size="lg" id={headingId}>New quest</Heading>
        <div className={styles.grid}>
          <Field label="Task" placeholder="What should someone do?" value={d.task} onChange={(e) => set('task')(e.target.value)} />
          <Select label="Format" options={formats} value={d.format} onValueChange={set('format')} />
          <Field label="Reward per completion (USDC)" inputMode="decimal" placeholder="0.00" value={d.reward} onChange={(e) => set('reward')(e.target.value)} />
          <Field label="Slots" inputMode="numeric" placeholder="How many people" value={d.slots} onChange={(e) => set('slots')(e.target.value)} />
          <Field label="Due" type="date" hint="Leave empty for an ongoing quest" value={d.due} onChange={(e) => set('due')(e.target.value)} />
          <Field label="Budget cap" readOnly value={cap} />
        </div>
        <Text variant="small" tone="secondary">Submissions are checked by the same no-AI-slop pass and claims gate as your own posts, must carry the disclosure, and need your approval before anyone is paid.</Text>
        <div className={styles.actions}>
          <GatedButton gate={gate} onClick={() => onOpen(d)}>Open quest</GatedButton>
          {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
        </div>
      </form>
    </Card>
  );
}
