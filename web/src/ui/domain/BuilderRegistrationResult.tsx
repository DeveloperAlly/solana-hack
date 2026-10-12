import { Button } from '../primitives/Button';
import { Text } from '../primitives/Text';
import { Card } from '../composites/Card';
import { KeyValueList, type KeyValueItem } from '../composites/KeyValueList';
import { CopyButton } from '../composites/CopyButton';
import styles from './BuilderRegistrationResult.module.css';

export type RegistrationStatus = 'registered' | 'failed';

export interface BuilderRegistrationResultProps {
  status: RegistrationStatus;
  /** What was registered: version, hash, approver, sections, transaction. */
  items: KeyValueItem[];
  /** Plain-language reason (failed). */
  reason?: string;
  /** Text put on the clipboard by "Copy error details" (failed). */
  errorDetails?: string;
  /** Where "Retry registration" goes (failed). */
  retryHref?: string;
  /** Footnote under the record, e.g. what goes onchain. */
  note?: string;
}

/**
 * D50 RegistrationResult: the registration record, or, when it failed, the plain reason with Retry and Copy error
 * details above the record. Canvas boards Onboard-6-Published and Kit-RegisterFailed (notes n-ob6, n-krf).
 */
export function BuilderRegistrationResult({ status, items, reason, errorDetails = '', retryHref, note }: BuilderRegistrationResultProps) {
  return (
    <div className={styles.result}>
      {status === 'failed' && (
        <Card variant="emphasis" as="div">
          <div role="alert" className={styles.message}>
            <Text><strong>We couldn&apos;t write the registration to Solana.</strong></Text>
            <Text variant="small">{reason} Your kit is saved and nothing was charged. Drafting posts needs a registered kit, so retry registration.</Text>
          </div>
          <div className={styles.actions}>
            {/* INTEGRATION: POST /api/registrations/:id/retry (backend map §4, row "Onboard-6-Published, Kit-RegisterFailed"). */}
            {retryHref && <Button href={retryHref}>Retry registration</Button>}
            <CopyButton value={errorDetails} label="Copy error details" />
          </div>
        </Card>
      )}
      <div role={status === 'registered' ? 'status' : undefined}>
        <KeyValueList items={items} label="Registration" />
      </div>
      {note && <Text variant="small" tone="secondary">{note}</Text>}
    </div>
  );
}
