import { useState, type FormEvent } from 'react';
import { Alert, Button, Field, Text } from '../primitives';
import { attendanceProofKinds, type AttendanceProof, type AttendanceProofKind } from '../../domain/rating';
import styles from './EventProofStep.module.css';

export interface EventProofStepProps {
  proof: AttendanceProof;
  onLuma: () => void;
  /** Gets a well-formed email; the screen checks it against the guest list. */
  onEmail: (email: string) => void;
  /** After a failure: back to not proven. */
  onReset: () => void;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const kindLabel = (kind: AttendanceProofKind) => attendanceProofKinds.find((x) => x.id === kind)!.label;

/**
 * D102 EventProofStep: step 1 of rating an event, prove you went (canvas v21 Event-Rating). Renders the proof state
 * machine (domain/rating.ts): not proven, proving, proven, failed. States: each of those four.
 */
export function EventProofStep({ proof, onLuma, onEmail, onReset }: EventProofStepProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setError('Enter the email you registered with, like name@example.com.');
    setError(null);
    onEmail(email.trim());
  };
  if (proof.status === 'proven') {
    return <Alert tone="success" title="You went">Proved with: {kindLabel(proof.kind)}. Your ratings are unlocked.</Alert>;
  }
  if (proof.status === 'failed') {
    return (
      <div className={styles.step}>
        <Alert tone="warning" title="We couldn’t confirm you went">{proof.reason}</Alert>
        <div><Button variant="secondary" onClick={onReset}>Try another way</Button></div>
      </div>
    );
  }
  const busy = proof.status === 'proving';
  return (
    <div className={styles.step} aria-busy={busy}>
      {busy && <Text variant="small" role="status">Checking: {kindLabel(proof.kind)}…</Text>}
      <div className={styles.row}>
        <Button onClick={onLuma} disabled={busy}>Prove I went with Luma</Button>
        <Text variant="small" tone="secondary">or use the email on the guest list</Text>
      </div>
      <form className={styles.row} onSubmit={submit} noValidate>
        <Field label="Guest-list email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} disabled={busy} />
        <Button type="submit" variant="secondary" disabled={busy}>Check the guest list</Button>
      </form>
    </div>
  );
}
