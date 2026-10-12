import { useState } from 'react';

/**
 * Joining a campaign is a state machine (canvas note n-a2: "Joining needs email sign-in, inline, no page change";
 * ADR-006: Supabase email code, no wallet). Each step is reachable only from the one before it:
 *   start (mobile: the Join button) → email (enter an address) → code (only after a code was sent) → joined.
 * An ambassador already signed in skips sign-in: `signed-in` joins in one click (Codex review on PR #78).
 */
export type JoinStep = 'signed-in' | 'start' | 'email' | 'code';

export function useJoin({ startOpen, signedIn, onJoined }: { startOpen: boolean; signedIn: boolean; onJoined: () => void }) {
  const [step, setStep] = useState<JoinStep>(signedIn ? 'signed-in' : startOpen ? 'email' : 'start');
  const [email, setEmail] = useState('');

  return {
    step,
    email,
    open: () => setStep('email'),
    // INTEGRATION: supabase.auth.signInWithOtp({ email }) sends the code (sign-in email via Resend, sender jamjam.tech).
    sendCode: (address: string) => {
      setEmail(address);
      setStep('code');
    },
    changeEmail: () => setStep('email'),
    // INTEGRATION: supabase.auth.verifyOtp({ email, token, type: 'email' }), then POST /api/campaigns/:id/join (memberships).
    verify: () => {
      if (step === 'code' && email) onJoined();
    },
    // INTEGRATION: POST /api/campaigns/:id/join with the signed-in session.
    joinSignedIn: () => {
      if (step === 'signed-in') onJoined();
    },
  };
}

export type JoinState = ReturnType<typeof useJoin>;
