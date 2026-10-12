import { useState, type FormEvent } from 'react';
import { useDisclosure } from '../hooks/useDisclosure';
import { Alert } from '../primitives/Alert';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import styles from './VerifyReportForm.module.css';

export interface VerifyReport {
  brand: string;
  where: string;
  details: string;
}

export interface VerifyReportFormProps {
  /** Text of the button that opens the form (canvas: "Report possible impersonation", "Report to aDNA"). */
  triggerLabel: string;
  /** Brand the post claims to be from, when the check already knows it. */
  brandName?: string;
  /** Called with a valid report. INTEGRATION: POST /api/verify/report (backend map row "Verify-1, Verify-2, Verify-3"). */
  onSubmit?: (report: VerifyReport) => void;
  /** Start open (workbench). */
  defaultOpen?: boolean;
}

type Errors = Partial<Record<keyof VerifyReport, string>>;

function validate(r: VerifyReport): Errors {
  const e: Errors = {};
  if (!r.brand.trim()) e.brand = 'Name the brand it claims to be from.';
  if (!r.where.trim()) e.where = 'Say where you saw it: a link, or the account and platform.';
  return e;
}

/**
 * Report impersonation (canvas Verify-2 and Verify-3; note n-v2 "'Report impersonation' goes to the brand owner").
 * A disclosure: the button opens a short form that validates on submit; Cancel closes it; sending shows a confirmation.
 */
export function VerifyReportForm({ triggerLabel, brandName = '', onSubmit, defaultOpen = false }: VerifyReportFormProps) {
  const form = useDisclosure({ defaultOpen });
  const [sent, setSent] = useState(false);
  const [report, setReport] = useState<VerifyReport>({ brand: brandName, where: '', details: '' });
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof VerifyReport) => (e: { target: { value: string } }) => setReport((r) => ({ ...r, [k]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validate(report);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit?.(report);
    setSent(true);
  }

  if (sent) return <Alert tone="success" title="Report sent">{report.brand}'s owner will see it. Thank you for checking.</Alert>;
  if (!form.open) return <Button variant="secondary" onClick={form.show}>{triggerLabel}</Button>;
  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-label={triggerLabel}>
      <Field label="Which brand does it claim to be from?" value={report.brand} onChange={set('brand')} error={errors.brand} />
      <Field label="Where did you see it?" hint="A link, or the account and platform." value={report.where} onChange={set('where')} error={errors.where} />
      <Field label="Anything else (optional)" multiline rows={3} value={report.details} onChange={set('details')} />
      <div className={styles.actions}>
        <Button type="submit">Send report</Button>
        <Button variant="secondary" onClick={form.hide}>Cancel</Button>
      </div>
    </form>
  );
}
