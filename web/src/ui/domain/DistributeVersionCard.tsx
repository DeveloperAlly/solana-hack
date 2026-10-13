import { useId, useState, type ReactNode } from 'react';
import { Card } from '../composites/Card';
import { GatedButton, type Gate } from '../composites/GatedButton';
import { Badge, Button, Field, Heading, Text } from '../primitives';
import type { BadgeTone } from '../primitives/Badge';
import styles from './DistributeVersionCard.module.css';

export interface DistributeVersionCardProps {
  /** Platform name, e.g. "LinkedIn". */
  platform: string;
  text: string;
  /** Length as the platform counts it, where the platform has a limit; null shows "Adapted". */
  length: { used: number; max: number } | null;
  /** The version's one content check: the badge and the Approve button both read it. */
  check: Gate;
  /** Approval state of this version: approved, needs approval, or stale after an edit. */
  approval: { label: string; tone: BadgeTone; approved: boolean };
  /** One line on how it posts, e.g. "Planned platform: copy and paste only". */
  note?: string;
  onSave: (text: string) => void;
  onApprove: () => void;
  /** Scheduling controls (When, How) and their warnings. */
  children?: ReactNode;
}

/**
 * D92 DistributeVersionCard: one platform's version of a post (canvas v21 Distribute-Adapt). Each version is its own
 * approval; the check badge and a disabled Approve come from one `{ blocking, label }` check, so a blocked badge never
 * sits beside an enabled Approve. States: needs approval, approved, stale, blocked, editing.
 */
export function DistributeVersionCard({ platform, text, length, check, approval, note, onSave, onApprove, children }: DistributeVersionCardProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;
  const save = () => {
    onSave(draft ?? text);
    setDraft(null);
  };
  return (
    <Card labelledBy={id} variant={check.blocking ? 'emphasis' : 'default'}>
      <div className={styles.head}>
        <Heading level={2} size="lg" id={id}>{platform}</Heading>
        <Badge>{length ? `${length.used} / ${length.max}` : 'Adapted'}</Badge>
      </div>
      {editing ? (
        <Field multiline label={`${platform} version`} value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} />
      ) : (
        <Text variant="small" className={styles.text}>{text}</Text>
      )}
      <div className={styles.status} role="status">
        <Badge tone={check.blocking ? 'warning' : 'success'}>{check.blocking ? `Blocked: ${check.label}` : check.label}</Badge>
        <Badge tone={approval.tone}>{approval.label}</Badge>
      </div>
      {note && <Text variant="caption" tone="secondary">{note}</Text>}
      {children && <div className={styles.controls}>{children}</div>}
      <div className={styles.actions}>
        {editing ? (
          <>
            <Button onClick={save}>Save {platform} version</Button>
            <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setDraft(text)} aria-label={`Edit ${platform} version`}>Edit</Button>
            {!approval.approved && <GatedButton gate={check} onClick={onApprove}>Approve {platform}</GatedButton>}
          </>
        )}
      </div>
    </Card>
  );
}
