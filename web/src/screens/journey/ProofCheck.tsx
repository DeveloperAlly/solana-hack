import { useState } from 'react';
import { Stack, Text } from '../../ui/primitives';
import { Icon, type IconName } from '../../ui/primitives/Icon';
import { VerifyInput } from '../../ui/domain/VerifyInput';

type Verdict = 'official' | 'not-official';

export interface ProofCheckProps {
  /** The registered post; an exact match is Official. */
  registeredText: string;
  /** Why it is official, e.g. "Exact match to a post JamJam approved, from kit v1." */
  officialNote: string;
}

const verdicts: Record<Verdict, { icon: IconName; title: string }> = {
  official: { icon: 'check', title: 'Official' },
  'not-official': { icon: 'alert', title: 'Not an official post' },
};

/**
 * J7's "Check a post" panel, what anyone sees (canvas board J7-Proof, note n-j7-proof 2): the same exact-text rule as
 * Verify today (web/worker/posts.ts verifyText), run locally against the registered text. Composition only, no styles.
 */
export function ProofCheck({ registeredText, officialNote }: ProofCheckProps) {
  const [verdict, setVerdict] = useState<Verdict>('official');
  const v = verdicts[verdict];
  const note = verdict === 'official' ? officialNote : 'No exact match to a post JamJam approved. An edited copy is not official.';
  return (
    <Stack gap={3}>
      {/* INTEGRATION: POST /api/verify {text} (web/worker/api.ts, verifyText); backend map row "Verify-1, Verify-2, Verify-3". */}
      <VerifyInput defaultValue={registeredText} onCheck={(t) => setVerdict(t === registeredText.trim() ? 'official' : 'not-official')} />
      <Stack direction="row" gap={3} align="center" role="status">
        <Icon name={v.icon} size="lg" />
        <Stack gap={0}>
          <Text><strong>{v.title}</strong></Text>
          <Text variant="small" tone="secondary">{note}</Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
