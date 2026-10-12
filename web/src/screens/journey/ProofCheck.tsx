import { useState } from 'react';
import { normalise } from '../../lib/normalise';
import { Stack } from '../../ui/primitives';
import { VerifyInput } from '../../ui/domain/VerifyInput';
import { VerifyResultCard, type VerifyResultTone } from '../../ui/domain/VerifyResultCard';

type Verdict = 'official' | 'not-official';

export interface ProofCheckProps {
  /** The registered post; an exact match is Official. */
  registeredText: string;
  /** Why it is official, e.g. "Exact match to a post JamJam approved, from kit v1." */
  officialNote: string;
}

const verdicts: Record<Verdict, { tone: VerifyResultTone; title: string }> = {
  official: { tone: 'match', title: 'Official' },
  'not-official': { tone: 'nomatch', title: 'Not an official post' },
};

/**
 * J7's "Check a post" panel, what anyone sees (canvas board J7-Proof, note n-j7-proof 2): the same exact-text rule as
 * Verify today (web/worker/posts.ts verifyText: the normalised text must match, so rewrapped lines still match and any
 * changed word does not), run locally against the registered text, shown in the Verify page's
 * D34 result card. Composition only, no styles.
 */
export function ProofCheck({ registeredText, officialNote }: ProofCheckProps) {
  const [verdict, setVerdict] = useState<Verdict>('official');
  const v = verdicts[verdict];
  const summary = verdict === 'official' ? officialNote : 'No exact match to a post JamJam approved. An edited copy is not official.';
  return (
    <Stack gap={3}>
      {/* INTEGRATION: POST /api/verify {text} (web/worker/api.ts, verifyText); backend map row "Verify-1, Verify-2, Verify-3". */}
      <VerifyInput defaultValue={registeredText} onCheck={(t) => setVerdict(normalise(t) === normalise(registeredText) ? 'official' : 'not-official')} />
      <div role="status">
        <VerifyResultCard tone={v.tone} title={v.title} summary={summary} level={3} />
      </div>
    </Stack>
  );
}
