/*
 * Data contract: J2-Save, "Save: email after value (proposed D1)" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J2-Save, note n-j2-save; issue #48). Shape: SaveData in ./types. Backend map: .agentic/what/context/backend_map.md
 * §4, row "Onboard-1-SignIn".
 *
 * | Field      | Source                                                                                              | Empty when |
 * |------------|-----------------------------------------------------------------------------------------------------|------------|
 * | brandName  | The site read on J1 (anonymous read, proposal D1)                                                     | never      |
 * | summary    | Counts of the facts and voice found on J1 (`evidence` rows from the anonymous read)                  | never: J2 follows J1 |
 * | saving[]   | Coverage per kit section, GET /api/brands/:id/coverage (backend map row "Coverage-Map")               | never      |
 * | linkError  | Client: the sign-in redirect carries error_code=otp_expired (Supabase; live copy in screens/signin/SignIn.tsx) | unset |
 *
 * Sign-in: Supabase signInWithOtp (email) and verifyOtp (code), client side; one email carries a link and a code.
 * Nothing is drafted or stored against a brand before sign-in (note n-j2-save 3).
 * States (board "States" note): success = the form; loading = sending ("Sending…" on the button); error = expired or
 * used link. A wrong code shows inline under the code field.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import { EvidenceChip } from '../../ui/domain/EvidenceChip';
import { JourneyInlineForm } from '../../ui/domain/JourneyInlineForm';
import { JourneySplit } from '../../ui/domain/JourneySplit';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { JourneyStepFrame } from './JourneyStepFrame';
import { journeyPaths } from './paths';
import { email, otpCode } from './validators';
import type { SaveData } from './types';

export interface SaveProps {
  data: SaveData;
  state?: ScreenState;
}

export function J2Save({ data, state = 'success' }: SaveProps) {
  const navigate = useNavigate();
  const [sentTo, setSentTo] = useState('');
  return (
    <JourneyStepFrame step="save" title="Keep what we found" intro={data.summary} error={data.linkError && <Alert tone="danger">{data.linkError}</Alert>}>
      <JourneySplit
        ratio="6-5"
        first={
          <Card variant="selected" as="div">
            {/* INTEGRATION: supabase.auth.signInWithOtp({ email }) (backend map row "Onboard-1-SignIn"). */}
            <JourneyInlineForm label="Email" type="email" autoComplete="email" placeholder="you@yourbrand.com" submitLabel="Email me a sign-in link" busy={state === 'loading'} busyLabel="Sending…" validate={email} onSubmit={setSentTo} />
            {sentTo && <Alert tone="success" title="Check your email">We sent a link and a code to {sentTo}.</Alert>}
            <Text variant="small" tone="secondary">The email has a link and a code. Use either. No password, no wallet.</Text>
            <Card variant="subtle" as="div">
              <Text variant="small"><strong>Got the code instead?</strong></Text>
              {/* INTEGRATION: supabase.auth.verifyOtp({ email, token, type: 'email' }), then the brand is created from the read. */}
              <JourneyInlineForm label="Code from the email" placeholder="8-digit code" inputMode="numeric" autoComplete="one-time-code" submitLabel="Continue" validate={otpCode} onSubmit={() => navigate(journeyPaths.confirm)} />
            </Card>
          </Card>
        }
        second={
          <Stack gap={2}>
            <Text variant="small"><strong>You're saving</strong></Text>
            <KeyValueList items={data.saving.map((s) => ({ label: s.section, value: <EvidenceChip status={s.status} /> }))} />
          </Stack>
        }
      />
    </JourneyStepFrame>
  );
}
