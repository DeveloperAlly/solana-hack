import { Link, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import type { AmbOutcomeStep } from '../routes';
import type { StatusViewProps } from './statusView';

/** Canvas Amb-5a copy (note n-a5a: email at each step). */
const verifyingMessage = "We're confirming the post is live on your account and matches your draft. You can close this page; we'll email you at each step.";

const outcomes: { step: AmbOutcomeStep; label: string }[] = [
  { step: 'paid', label: 'Approved and paid' },
  { step: 'failed', label: 'Verification failed' },
  { step: 'budget', label: 'Budget reached' },
];

/**
 * Amb-5a loading: what is happening now (canvas note n-a5a: updates live, email at each step), plus the canvas's
 * "Prototype outcomes" links to each result. INTEGRATION: Realtime on `submissions` moves the screen on by itself.
 */
export function VerifyingView({ flow }: StatusViewProps) {
  const links = outcomes.filter((o) => flow.paths[o.step]);
  return (
    <Stack gap={4}>
      <Card as="div" variant="subtle">
        <Text tone="secondary" role="status">{verifyingMessage}</Text>
      </Card>
      <nav aria-label="Prototype outcomes">
        <Stack direction="row" gap={4} wrap align="baseline">
          <Text as="span" variant="small" tone="secondary">Prototype outcomes:</Text>
          {links.map((o) => <Text as="span" variant="small" key={o.step}><Link href={flow.paths[o.step] ?? ''}>{o.label}</Link></Text>)}
        </Stack>
      </nav>
    </Stack>
  );
}
