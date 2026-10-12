import type { ReactElement } from 'react';
import type { VerifyOutcome } from '../types';
import { VerifyEditedResult } from './VerifyEditedResult';
import { VerifyMatchResult } from './VerifyMatchResult';
import { VerifyNoMatchResult } from './VerifyNoMatchResult';
import { VerifyRetractedResult } from './VerifyRetractedResult';

/** One result view per outcome of a check (canvas Verify-1, -2, -3 and -5). */
export function VerifyOutcomeView({ outcome }: { outcome: VerifyOutcome }): ReactElement {
  switch (outcome.kind) {
    case 'match':
      return <VerifyMatchResult post={outcome.post} />;
    case 'edited':
      return <VerifyEditedResult outcome={outcome} />;
    case 'retracted':
      return <VerifyRetractedResult post={outcome.post} />;
    case 'nomatch':
      return <VerifyNoMatchResult />;
  }
}
