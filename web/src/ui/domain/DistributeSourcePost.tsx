import { useState, type ReactNode } from 'react';
import { Card } from '../composites/Card';
import { Badge, Button, Field, Text } from '../primitives';
import type { BadgeTone } from '../primitives/Badge';
import { GatedButton } from '../composites/GatedButton';
import type { Gate } from '../../lib/approval';
import styles from './DistributeSourcePost.module.css';

export interface DistributeSourcePostProps {
  /** Chip before the text, e.g. "Approved · X". */
  label: string;
  text: string;
  /** Saves an edit to the original; the screen marks every adapted version stale. */
  onSave: (text: string) => void;
  /** Shown while any version was approved against an older original. */
  staleNote?: string;
  /** Trailing link, e.g. "Post detail". */
  link?: ReactNode;
  /** The original's own approval; after an edit it needs approving again before anything is scheduled. */
  approval?: { label: string; tone: BadgeTone; approved: boolean };
  /** The original's checks: the blocked badge and a disabled Approve both read it (pending while they re-run). */
  check?: Gate;
  onApprove?: () => void;
}

/**
 * D93 DistributeSourcePost: the one approved post every platform version is adapted from (canvas v21 Distribute-Adapt,
 * "editing the original marks versions stale"). States: reading, editing, stale versions, original needs approval.
 */
export function DistributeSourcePost({ label, text, onSave, staleNote, link, approval, check, onApprove }: DistributeSourcePostProps) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Card variant="subtle" as="section" header={<><span className={styles.chips}><Badge>{label}</Badge>{approval && <Badge tone={approval.tone}>{approval.label}</Badge>}</span>{link}</>}>
      {draft === null ? (
        <Text className={styles.text}>{text}</Text>
      ) : (
        <Field multiline label="Original post" value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
      )}
      {check?.blocking && <span><Badge tone="warning">{`Blocked: ${check.label}`}</Badge></span>}
      {staleNote && <Text variant="small" tone="warning" role="status">{staleNote}</Text>}
      <div className={styles.actions}>
        {draft === null ? (
          <>
            <Button variant="secondary" onClick={() => setDraft(text)}>Edit original</Button>
            {approval && !approval.approved && onApprove && <GatedButton gate={check ?? { blocking: false, label: 'Checks passed' }} onClick={onApprove}>Approve original</GatedButton>}
          </>
        ) : (
          <>
            <Button onClick={() => { onSave(draft); setDraft(null); }}>Save original</Button>
            <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
          </>
        )}
      </div>
    </Card>
  );
}
