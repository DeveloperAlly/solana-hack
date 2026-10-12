import { useState } from 'react';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Text } from '../primitives/Text';
import { Card } from '../composites/Card';
import styles from './BuilderPersonaCard.module.css';

export interface Persona {
  id: string;
  name: string;
  job: string;
  pain: string;
  where: string;
  /** Validated against real people; drops the "Assumption" label. */
  validated?: boolean;
}

export interface BuilderPersonaCardProps {
  persona: Persona;
  onChange: (persona: Persona) => void;
  onRemove: (id: string) => void;
}

const fields = [
  { key: 'name', label: 'Name' },
  { key: 'job', label: 'Job' },
  { key: 'pain', label: 'Pain' },
  { key: 'where', label: 'Where' },
] as const;

/**
 * D16 PersonaCard: a draft persona, dashed and labelled "Assumption" until marked validated; Edit inline, Remove.
 * Canvas board BB-5-Audience (note n-bb5.2).
 */
export function BuilderPersonaCard({ persona, onChange, onRemove }: BuilderPersonaCardProps) {
  const [draft, setDraft] = useState<Persona | null>(null);
  if (draft) {
    return (
      <Card variant="default" as="li">
        {fields.map((f) => (
          <Field key={f.key} label={`${f.label} (${persona.name})`} value={draft[f.key]} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, [f.key]: e.target.value })} />
        ))}
        <div className={styles.actions}>
          <Button onClick={() => { onChange(draft); setDraft(null); }}>Save</Button>
          <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
        </div>
      </Card>
    );
  }
  return (
    <Card variant={persona.validated ? 'default' : 'dashed'} as="li">
      <span className={styles.flag}>{persona.validated ? <Badge tone="success">Validated</Badge> : <Badge>Assumption</Badge>}</span>
      <strong>{persona.name}</strong>
      {fields.slice(1).map((f) => <Text key={f.key} variant="small">{f.label}: {persona[f.key]}</Text>)}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setDraft(persona)} aria-label={`Edit ${persona.name}`}>Edit</Button>
        <Button variant="secondary" onClick={() => onRemove(persona.id)} aria-label={`Remove ${persona.name}`}>Remove</Button>
        {!persona.validated && <Button variant="secondary" onClick={() => onChange({ ...persona, validated: true })} aria-label={`Mark ${persona.name} validated`}>Mark validated</Button>}
      </div>
    </Card>
  );
}
