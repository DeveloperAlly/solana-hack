import { useId, useState } from 'react';
import { Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { CopyButton } from '../../../ui/composites/CopyButton';
import { InlineForm } from '../../../ui/composites/InlineForm';
import { emailCheck } from '../checks';

export interface GrowthReferralShareProps {
  link: string;
  shareText: string;
  /** Invites a friend by email; returns an error, or null when the invite was added. */
  onInvite: (email: string) => string | null;
}

/** Your referral link with copy, the share message with copy, and an invite-by-email form. */
export function GrowthReferralShare({ link, shareText, onInvite }: GrowthReferralShareProps) {
  const headingId = useId();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  function submit({ email }: Record<string, string>) {
    const problem = onInvite(email);
    setError(problem);
    setSent(problem ? null : email);
  }
  return (
    <Card labelledBy={headingId} header={<Heading level={2} size="lg" id={headingId}>Share your link</Heading>}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Text variant="mono">{link}</Text>
          <Stack direction="row" gap={3} wrap>
            <CopyButton value={link} label="Copy link" />
            <CopyButton value={shareText} label="Copy message" />
          </Stack>
        </Stack>
        <InlineForm
          label="Invite a friend by email"
          layout="row"
          resetOnSubmit
          submitLabel="Send invite"
          submitVariant="secondary"
          errors={{ email: error }}
          fields={[{ name: 'email', label: 'Friend’s email', type: 'email', autoComplete: 'off', validate: (v) => { const c = emailCheck(v); return c.blocking ? c.label : null; } }]}
          onSubmit={submit}
        />
        <p role="status" className="wl-visually-hidden">{sent ? `Invite sent to ${sent}.` : ''}</p>
        {sent && <Text variant="small" tone="secondary">Invite sent to {sent}. They show below as Invited.</Text>}
      </Stack>
    </Card>
  );
}
