import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { matchPost } from './matchPost';
import { verifyParams } from './paths';
import type { VerifyCheckData, VerifyOutcome } from './types';

export type CheckStatus = 'idle' | 'checking' | 'done' | 'error';

// The gallery's demo state (C28) picks where the flow starts.
const startStatus: Record<ScreenState, CheckStatus> = { success: 'done', empty: 'idle', loading: 'checking', error: 'error' };

export interface VerifyCheckFlow {
  /** The text that was last checked (or is in the box when the screen opens). */
  query: string;
  status: CheckStatus;
  outcome: VerifyOutcome;
  inputError: string | null;
  /** Changes whenever the flow restarts, so the input can remount with the new text. */
  inputKey: string;
  check: (text: string) => void;
  retry: () => void;
}

/**
 * Flow state for the Verify screen (Verify-1/2/3/5): the pasted text, the check status and the outcome. `?q=` preloads
 * the box (Ledger "Check it", Verify-3 "View the original"); the demo state chooses the starting status.
 */
export function useVerifyCheck(data: VerifyCheckData, state: ScreenState): VerifyCheckFlow {
  const [params] = useSearchParams();
  const preset = params.get(verifyParams.query);
  const source = `${state}|${preset ?? ''}|${data.query}`;
  const startQuery = state === 'empty' ? '' : (preset ?? data.query);

  const [seen, setSeen] = useState(source);
  const [query, setQuery] = useState(startQuery);
  const [status, setStatus] = useState<CheckStatus>(startStatus[state]);
  const [inputError, setInputError] = useState<string | null>(null);

  // Restart when the route brings new text or a new demo state (same component, new data).
  if (seen !== source) {
    setSeen(source);
    setQuery(startQuery);
    setStatus(startStatus[state]);
    setInputError(null);
  }

  const outcome = useMemo(() => matchPost(query, data.posts), [query, data.posts]);

  function check(text: string) {
    if (!text) {
      setInputError('Paste the text of a post, or its URL, to check.');
      return;
    }
    // INTEGRATION: POST /api/verify { text } (web/worker/posts.ts verifyText); a URL is read with Exa /contents first.
    setInputError(null);
    setQuery(text);
    setStatus('done');
  }

  return { query, status, outcome, inputError, inputKey: source, check, retry: () => check(query) };
}
