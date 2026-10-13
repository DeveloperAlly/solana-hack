import { useId, type ReactNode } from 'react';
import type { Brain, BrainFact, BrainRule } from '../../domain/brain';
import type { DraftProvenance } from '../../domain/post';
import { Heading, type HeadingLevel } from '../primitives/Heading';
import styles from './WhyThis.module.css';

export interface WhyThisProps {
  /** The draft's one provenance row (ADR-012 runtime section). Only what is in it is shown. */
  provenance: DraftProvenance;
  /** The Brain the row's ids resolve against, for display. */
  brain: Brain;
  /** Level of the "Why this?" heading (default 2); its sections are one level below. */
  level?: HeadingLevel;
  /** After the sections: "Open the Brain". */
  footer?: ReactNode;
}

const below = (l: HeadingLevel) => Math.min(l + 1, 4) as HeadingLevel;
const sourceVerb: Record<BrainFact['source']['kind'], string> = { page: 'read', 'owner-answer': 'answered' };
const originLabel: Record<BrainRule['origin'], string> = { learn: 'learned', kit: 'kit', owner: 'your edit' };
const ruleLine = (r: BrainRule) => `${r.text} (${originLabel[r.origin]}${r.status === 'active' ? '' : `, now ${r.status}`})`;

/**
 * D71 WhyThis: everything a draft was built from, read from its one provenance row and resolved against the Brain
 * (ADR-012 decision 4: every fact has a receipt, now for every output). Facts with their quotes and sources, the
 * voice, the rules applied, and the Brain, kit, prompt and model versions. An id the Brain no longer holds is shown
 * as missing, never dropped.
 */
export function WhyThis({ provenance, brain, level = 2, footer }: WhyThisProps) {
  const sub = below(level);
  const headingId = useId();
  const voice = brain.voices.find((v) => v.id === provenance.voice);
  return (
    <section className={styles.root} aria-labelledby={headingId}>
      <Heading level={level} size="lg" id={headingId}>Why this?</Heading>
      <p className={styles.muted}>Everything this draft was built from. Every fact has a receipt.</p>
      <Heading level={sub} size="lg">Facts used</Heading>
      <ul className={styles.list}>
        {provenance.evidenceIds.map((id) => {
          const f = brain.facts.find((x) => x.id === id);
          return (
            <li key={id}>
              {f ? <><blockquote className={styles.quote}>“{f.quote}”</blockquote><span className={styles.muted}>{f.source.label} · {sourceVerb[f.source.kind]} {f.source.at}</span></> : <span className={styles.muted}>Fact {id}: no longer in the Brain</span>}
            </li>
          );
        })}
      </ul>
      <Heading level={sub} size="lg">Voice</Heading>
      <p className={styles.line}>{voice ? `${voice.name} ${voice.version} · ${voice.dials}` : `Voice ${provenance.voice}: no longer in the Brain`}</p>
      <Heading level={sub} size="lg">Rules applied</Heading>
      <ul className={styles.list}>
        {provenance.ruleIds.map((id) => {
          const r = brain.rules.find((x) => x.id === id);
          return <li key={id} className={styles.line}>{r ? ruleLine(r) : `Rule ${id}: no longer in the Brain`}</li>;
        })}
      </ul>
      <Heading level={sub} size="lg">Built with</Heading>
      <p className={styles.line}>Kit v{provenance.kitVersion} · Brain v{provenance.brainVersion} · prompt {provenance.prompt.id} {provenance.prompt.version} · model {provenance.model}</p>
      {footer}
    </section>
  );
}
