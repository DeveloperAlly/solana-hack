import { useId, useState, type ReactNode } from 'react';
import { Alert } from '../primitives/Alert';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Heading, type HeadingLevel } from '../primitives/Heading';
import { Text } from '../primitives/Text';
import { Card } from '../composites/Card';
import { StatePanel } from '../composites/StatePanel';
import styles from './DecisionGate.module.css';

export type GateStatus = 'pending' | 'approved' | 'changes' | 'deferred';

/** A gate decision: the `gates` row (who, when, why), or a change request (note), or deferred. */
export interface GateDecision {
  status: GateStatus;
  by?: string;
  at?: string;
  why?: string;
  note?: string;
}

export interface DecisionGateProps {
  /** What is approved, e.g. "purpose"; used in labels ("Approve purpose"). */
  subject: string;
  decision: GateDecision;
  onDecide: (decision: GateDecision) => void;
  /** Who is approving (the signed-in owner); recorded with an approval. */
  approver: string;
  /** The draft and its draft actions (edit form, Try another draft). */
  children: ReactNode;
  /** `full` (default): the gate screen, with request changes, deferral and a footer. `compact`: one card per gate (J5). */
  variant?: 'full' | 'compact';
  /** "Gate n" chip. */
  gate?: number;
  /** Card heading (compact) and its level. */
  title?: string;
  titleLevel?: HeadingLevel;
  /** Chip over the draft, e.g. "AI draft · confirm"; and the line beside it, e.g. "Drafted from 4 sources". */
  draftLabel?: string;
  draftMeta?: string;
  /** "Built from: <builtFrom> · See evidence" disclosure with the evidence inside. */
  builtFrom?: string;
  evidence?: ReactNode;
  /** Label of the optional why field (default "Why (optional)"). */
  whyLabel?: string;
  /** Extra actions beside Approve (Edit). */
  actions?: ReactNode;
  /** Disables Approve, e.g. while the draft is being edited. */
  approveDisabled?: boolean;
  /** Full variant footer: Back, and where Continue / "Save, decide later" go. */
  back?: { href: string; label?: string };
  nextHref?: string;
  /** Timestamp for an approval (default: now, UTC to the minute). */
  now?: () => string;
}

const stamp = () => `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
const cap = (s: string) => `${s[0]?.toUpperCase() ?? ''}${s.slice(1)}`;

function Evidence({ builtFrom, evidence }: { builtFrom?: string; evidence?: ReactNode }) {
  if (!builtFrom && !evidence) return null;
  return (
    <details className={styles.evidence}>
      <summary>Built from: {builtFrom}{evidence ? ' · See evidence' : ''}</summary>
      {evidence && <div className={styles.evidenceBody}>{evidence}</div>}
    </details>
  );
}

/**
 * D17 DecisionGate: an AI draft with what it was built from, an optional why, and the decision. Approve records who,
 * when and why; Request changes takes a note; "Save, decide later" defers. States: pending, changes requested,
 * deferred, approved (Reopen / Change). `compact` is the J5 card; `full` is the BB-Gate screens.
 * Replaces BuilderDecisionGate and JourneyGateCard (issue #46, shared consolidation).
 */
export function DecisionGate(props: DecisionGateProps) {
  const { subject, decision, onDecide, approver, children, variant = 'full', gate, title, titleLevel = 2, draftLabel, draftMeta, builtFrom, evidence, whyLabel = 'Why (optional)', actions, approveDisabled = false, back, nextHref, now = stamp } = props;
  const headingId = useId();
  const [why, setWhy] = useState(decision.why ?? '');
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const approve = () => onDecide({ status: 'approved', by: approver, at: now(), why: why.trim() || undefined });
  const record = `${decision.by ?? approver} · ${decision.at ?? ''}${decision.why ? ` · "${decision.why}"` : ''}`;

  function requestChanges() {
    if (!note.trim()) return setNoteError('Say what should change, so the next draft can fix it.');
    onDecide({ status: 'changes', note: note.trim() });
    setAsking(false);
    setNote('');
    setNoteError(null);
  }

  const head = (gate !== undefined || title || draftLabel || draftMeta || decision.status === 'approved') && (
    <div className={styles.head}>
      {gate !== undefined && <Badge>Gate {gate}</Badge>}
      {title && <Heading level={titleLevel} size="lg" id={headingId}>{title}</Heading>}
      {draftLabel && <Badge>{draftLabel}</Badge>}
      {draftMeta && <Text as="span" variant="small" tone="secondary">{draftMeta}</Text>}
      {variant === 'compact' && decision.status === 'approved' && <Badge tone="solid">Approved</Badge>}
    </div>
  );

  if (variant === 'compact') {
    return (
      <Card variant="selected" labelledBy={title ? headingId : undefined}>
        {head}
        {children}
        <Evidence builtFrom={builtFrom} evidence={evidence} />
        {decision.status === 'approved' ? (
          <div className={styles.row}>
            <Text variant="small" tone="secondary">Approved by {record}</Text>
            <Button variant="secondary" onClick={() => onDecide({ status: 'pending' })}>Change</Button>
          </div>
        ) : (
          <>
            <Field label={whyLabel} value={why} onChange={(e: { target: { value: string } }) => setWhy(e.target.value)} />
            <div className={styles.row}>
              <Button onClick={approve} disabled={approveDisabled}>Approve</Button>
              {actions}
            </div>
          </>
        )}
      </Card>
    );
  }

  if (decision.status === 'approved') {
    return (
      <StatePanel
        kind="success"
        title={`${cap(subject)} approved`}
        body={`Decision recorded: ${decision.by}, ${decision.at}${decision.why ? `. Why: ${decision.why}` : ''}. Reopening it later creates a new kit version.`}
        actions={<>{nextHref && <Button href={nextHref}>Continue</Button>}<Button variant="secondary" onClick={() => onDecide({ status: 'pending' })}>Reopen</Button></>}
      />
    );
  }

  return (
    <div className={styles.gate}>
      {decision.status === 'changes' && <Alert tone="warning" title="Changes requested">{decision.note} Edit the draft or try another, then approve.</Alert>}
      {decision.status === 'deferred' && <Alert tone="info" title="Saved, not decided">Kit v1 can&apos;t be approved until all three gates pass.</Alert>}
      <Card variant="selected" as="section" labelledBy={title ? headingId : undefined}>
        {head}
        {children}
        <Evidence builtFrom={builtFrom} evidence={evidence} />
      </Card>
      <Field label={whyLabel} value={why} onChange={(e: { target: { value: string } }) => setWhy(e.target.value)} />
      {asking && (
        <Card variant="subtle" as="div">
          <Field label="What should change?" multiline rows={2} value={note} onChange={(e: { target: { value: string } }) => setNote(e.target.value)} error={noteError} />
          <div className={styles.row}><Button onClick={requestChanges}>Send request</Button><Button variant="secondary" onClick={() => setAsking(false)}>Cancel</Button></div>
        </Card>
      )}
      <Text variant="small" tone="secondary">Approving records a decision: who, when and why. You can reopen it later; that creates a new kit version.</Text>
      <div className={styles.footer}>
        {back ? <Button href={back.href} variant="secondary">{back.label ?? 'Back'}</Button> : <span />}
        <div className={styles.row}>
          {actions}
          {!asking && <Button variant="secondary" onClick={() => setAsking(true)}>Request changes</Button>}
          {nextHref ? (
            <Button href={nextHref} variant="secondary" onClick={() => onDecide({ status: 'deferred' })}>Save, decide later</Button>
          ) : (
            <Button variant="secondary" onClick={() => onDecide({ status: 'deferred' })}>Save, decide later</Button>
          )}
          <Button onClick={approve} disabled={approveDisabled}>Approve {subject}</Button>
        </div>
      </div>
    </div>
  );
}
