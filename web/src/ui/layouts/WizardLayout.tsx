import type { ReactNode } from 'react';
import { Container } from '../primitives/Container';
import { Heading, type HeadingLevel } from '../primitives/Heading';
import { Text } from '../primitives/Text';
import { Badge } from '../primitives/Badge';
import { Stepper, type StepperStep } from '../composites/Stepper';
import styles from './WizardLayout.module.css';

export interface WizardLayoutProps {
  steps: StepperStep[];
  current: number;
  title: string;
  intro?: ReactNode;
  /** Time estimate chip, e.g. "About 9 min left". */
  estimate?: string;
  /** Header actions, e.g. a "Save and finish later" link. */
  headerActions?: ReactNode;
  /** Slot for the Unverified flag (D36) or a sign-in status chip. */
  flag?: ReactNode;
  /** Footer: Back / Skip for now / Continue. */
  footer?: ReactNode;
  /** Saving state: announces "Saving" politely in the header. */
  saving?: boolean;
  /** Step error, shown above the body (an Alert or StatePanel). */
  error?: ReactNode;
  hrefFor?: (index: number) => string | undefined;
  /** Heading level of the title: 1 on a screen (default), lower when previewed inside another page. */
  titleLevel?: HeadingLevel;
  children?: ReactNode;
}

/**
 * L6 WizardLayout: Stepper (C8) with a time estimate, title and intro, body, and a footer for Back / Skip / Continue.
 * States: first, middle and last step (from current), resumed (open at the saved step), saving, step error.
 * The page shell (header, logo) is the caller's; this lays out the content area only.
 */
export function WizardLayout({ steps, current, title, intro, estimate, headerActions, flag, footer, saving, error, hrefFor, titleLevel = 1, children }: WizardLayoutProps) {
  return (
    <Container width="wizard">
      <div className={styles.layout}>
        <div className={styles.progress}>
          <Stepper steps={steps} current={current} hrefFor={hrefFor} label={`Step ${current + 1} of ${steps.length}`} />
          <div className={styles.meta}>
            {estimate && <Badge>{estimate}</Badge>}
            {flag}
            {saving && <span role="status" className={styles.saving}>Saving…</span>}
            {headerActions}
          </div>
        </div>
        <div className={styles.head}>
          <Heading level={titleLevel} size="2xl">{title}</Heading>
          {intro && <Text tone="secondary">{intro}</Text>}
        </div>
        {error}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </Container>
  );
}
