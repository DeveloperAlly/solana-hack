import { useId, useState, type FormEvent } from 'react';
import { Card } from '../composites/Card';
import { Button, Field, Heading, Select } from '../primitives';
import type { SelectOption } from '../primitives/Select';
import styles from './EventAddForm.module.css';

export interface EventAddValues {
  name: string;
  /** "2026-11-04" */
  date: string;
  /** "18:00" */
  time: string;
  place: string;
  role: string;
}

export interface EventAddFormProps {
  /** Role options; none is pre-selected. */
  roles: SelectOption[];
  /** Gets the trimmed values, only when every field is valid. */
  onSubmit: (values: EventAddValues) => void;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof EventAddValues, string>>;

const empty: EventAddValues = { name: '', date: '', time: '', place: '', role: '' };

export function validateEvent(v: EventAddValues): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = 'Name the event.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || Number.isNaN(Date.parse(v.date))) e.date = 'Pick the date it starts.';
  if (!/^\d{2}:\d{2}$/.test(v.time)) e.time = 'Pick the time it starts.';
  if (!v.place.trim()) e.place = 'Say where it is, or "Online".';
  if (!v.role) e.role = 'Choose your role: it picks the content plan.';
  return e;
}

/**
 * D94 EventAddForm: add an event by hand (canvas v21 Events "Add an event"). Validates on submit and then as the person
 * fixes each field; the role is never pre-selected because it picks the content plan template. States: empty, errors.
 */
export function EventAddForm({ roles, onSubmit, onCancel }: EventAddFormProps) {
  const headingId = useId();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Errors | null>(null);
  const set = (k: keyof EventAddValues) => (value: string) => {
    const next = { ...values, [k]: value };
    setValues(next);
    if (errors) setErrors(validateEvent(next));
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateEvent(values);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit({ ...values, name: values.name.trim(), place: values.place.trim() });
  };
  return (
    <Card variant="subtle" as="div">
      <form className={styles.form} aria-labelledby={headingId} onSubmit={submit} noValidate>
        <Heading level={2} size="lg" id={headingId}>Add an event</Heading>
        <div className={styles.grid}>
          <Field label="Event name" value={values.name} onChange={(e) => set('name')(e.target.value)} error={errors?.name} placeholder="[City] builders meetup" />
          <Field label="Place" value={values.place} onChange={(e) => set('place')(e.target.value)} error={errors?.place} hint="A city, or Online" />
          <Field label="Date" type="date" value={values.date} onChange={(e) => set('date')(e.target.value)} error={errors?.date} />
          <Field label="Starts at" type="time" value={values.time} onChange={(e) => set('time')(e.target.value)} error={errors?.time} />
          <Select label="Your role" options={[{ value: '', label: 'Choose a role' }, ...roles]} value={values.role} onValueChange={set('role')} error={errors?.role} />
        </div>
        <div className={styles.actions}>
          <Button type="submit">Add event</Button>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
