import { useState } from 'react';
import { emailCheck } from './checks';

export type ClaimStep = 'form' | 'sent';

export interface ReferralClaimFlow {
  step: ClaimStep;
  /** The address the sign-in code went to, once sent. */
  email: string | null;
  /** Validates and sends; the step moves to `sent` only after a valid address. */
  claim: (email: string) => void;
  /** Back to the form with a different address. */
  restart: () => void;
}

/** Referral-Landing flow: a two-step state machine. "Sent" is reachable only after a valid email was submitted. */
export function useReferralClaim(): ReferralClaimFlow {
  const [email, setEmail] = useState<string | null>(null);
  function claim(value: string) {
    if (emailCheck(value).blocking) return;
    // INTEGRATION: POST /api/referrals/claim { code, email } (not built yet), then Supabase signInWithOtp (ADR-006).
    setEmail(value.trim());
  }
  return { step: email ? 'sent' : 'form', email, claim, restart: () => setEmail(null) };
}
