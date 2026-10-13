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
 * Sign-in is a state machine in useJourneyFlow (email, sending, code): the code field appears only after an email was sent.
 * States (board "States" note): success = the form; loading = sending ("Sending…" on the button); error = expired or
 * used link (send a new one). A wrong code shows inline under the code field.
 */
import { Alert, Stack, Text } from '../../ui/primitives';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import { EvidenceChip } from '../../ui/domain/EvidenceChip';
import { Columns } from '../../ui/layouts/Columns';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { JourneyStepFrame } from './JourneyStepFrame';
import { SaveSignIn } from './SaveSignIn';
import type { SaveData } from './types';

export interface SaveProps {
  data: SaveData;
  state?: ScreenState;
}

export function J2Save({ data, state = 'success' }: SaveProps) {
  return (
    <JourneyStepFrame step="save" title="Keep what we found" intro={data.summary} error={data.linkError && <Alert tone="danger">{data.linkError}</Alert>}>
      <Columns
        ratio="6-5"
        gap={7}
        stackBelow="md"
        end={
          <Stack gap={2}>
            <Text variant="small"><strong>You're saving</strong></Text>
            <KeyValueList items={data.saving.map((s) => ({ label: s.section, value: <EvidenceChip status={s.status} /> }))} />
          </Stack>
        }
      >
        <SaveSignIn sending={state === 'loading'} signedInEmail={data.signedInEmail} />
      </Columns>
    </JourneyStepFrame>
  );
}
