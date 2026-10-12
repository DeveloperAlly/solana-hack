import { useId } from 'react';
import type { Gate } from '../../domain/approval';
import { signalLabels, type Proposal } from '../../domain/proposal';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Heading } from '../primitives/Heading';
import styles from './RuleProposal.module.css';

export interface RuleProposalProps {
  proposal: Proposal;
  /** The proposal's one gate (domain/proposal.ts `proposalGate`): it disables Approve and says why. */
  gate: Gate;
  /** The Brain version now, and the one approving makes. */
  brainVersion: string;
  nextVersion: string;
  /** Where the cited outcomes are. */
  citesHref: string;
  onApprove: () => void;
  onReject: () => void;
  /** "Try on half of drafts": runs it as an experiment. */
  onTrial: () => void;
  /** Has the evaluator judge it again against the current Brain (shown while the gate says it is out of date). */
  onRecheck: () => void;
  /** Draws the first proposal with a strong border, as the canvas does. */
  emphasis?: boolean;
}

/**
 * D74 RuleProposal: one learned-rule proposal (ADR-013 decision 3, N5). What the results show and where the signal
 * came from, who checked it (never the model that proposed it) and whether the sample is small, and what approving
 * changes: the Brain version, not the kit or its registration. Approve, reject, or try it on half of new drafts.
 */
export function RuleProposal({ proposal: p, gate, brainVersion, nextVersion, citesHref, onApprove, onReject, onTrial, onRecheck, emphasis = false }: RuleProposalProps) {
  const headingId = useId();
  const outdated = p.brainVersion !== brainVersion;
  return (
    <section className={[styles.card, emphasis && styles.emphasis].filter(Boolean).join(' ')} aria-labelledby={headingId}>
      <div className={styles.head}>
        <Badge>{p.scope}</Badge>
        <Heading level={2} size="lg" id={headingId}>{p.title}</Heading>
        {p.status === 'trial' && <Badge tone="solid">Trial on half of drafts</Badge>}
      </div>
      <div className={styles.facts}>
        <div className={styles.fact}>
          <strong>Evidence</strong>
          <p>{p.evidence}</p>
          <p className={styles.muted}>Signal: {signalLabels[p.signal]}</p>
        </div>
        <div className={styles.fact}>
          <strong>Checked by</strong>
          <p>{p.evaluator.name}: {p.evaluator.verdict}</p>
          {p.evaluator.smallSample && <p className={styles.muted}>The sample is small: treat it as a trial.</p>}
        </div>
        <div className={styles.fact}>
          <strong>If you approve</strong>
          <p>Brain v{brainVersion} → v{nextVersion}. New drafts follow it and show it under Why this?</p>
          <p className={styles.muted}>The kit and its registration on Solana stay as they are: learned rules live in the Brain, not the kit.</p>
        </div>
      </div>
      {p.status === 'trial' && <p className={styles.status} role="status">Running on half of new drafts. The results are reported back here.</p>}
      <p className={gate.blocking ? styles.blocked : styles.muted}>{gate.label}</p>
      <div className={styles.actions}>
        <Button variant="secondary" href={citesHref}>{p.cites.label}</Button>
        {outdated && <Button variant="secondary" onClick={onRecheck}>Check it again</Button>}
        {p.status !== 'trial' && <Button variant="secondary" onClick={onTrial} disabled={gate.blocking}>Try on half of drafts</Button>}
        <Button variant="secondary" onClick={onReject}>Reject</Button>
        <Button onClick={onApprove} disabled={gate.blocking}>Approve rule</Button>
      </div>
    </section>
  );
}
