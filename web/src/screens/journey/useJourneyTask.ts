import { useRef, useState } from 'react';

/** Await a live action before closing or navigating; retain the screen on failure. */
export function useJourneyTask() {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const run = async (task: () => void | Promise<void>, success?: () => void) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(undefined);
    try { const result = task(); if (result && typeof result.then === 'function') await result; success?.(); }
    catch (e) { setError(e instanceof Error ? e.message : 'The action failed. Please try again.'); }
    finally { running.current = false; setBusy(false); }
  };
  return { busy, error, run };
}
