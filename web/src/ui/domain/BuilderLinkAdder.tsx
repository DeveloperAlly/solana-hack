import { useState, type FormEvent } from 'react';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { isLink } from '../../lib/validation';
import styles from './BuilderLinkAdder.module.css';

export interface BuilderLinkAdderProps {
  onAdd: (url: string) => void;
  label?: string;
}

/** Add-a-link row: a URL field checked on the client, then Add link. Canvas board Onboard-3-Sources ("Links"). */
export function BuilderLinkAdder({ onAdd, label = 'Add a link' }: BuilderLinkAdderProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  function submit(e: FormEvent) {
    e.preventDefault();
    const v = url.trim();
    if (!isLink(v)) return setError('Enter a web address like jamjam.tech or https://example.com/page.');
    setError(null);
    setUrl('');
    onAdd(v);
  }
  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.field}>
        <Field label={label} placeholder="Paste a URL" value={url} onChange={(e: { target: { value: string } }) => setUrl(e.target.value)} error={error} inputMode="url" />
      </div>
      <Button type="submit" variant="secondary">Add link</Button>
    </form>
  );
}
