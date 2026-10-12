import { useState } from 'react';
import type { PartnersData } from '../types';
import { uniqueId } from '../../../lib/id';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Partners state (n-pa): the invite form (email validated; voices and approval chosen, never pre-selected), the partner list, and the seat limit. */
export function usePartnerInvite(data: PartnersData) {
  const [email, setEmail] = useState(data.defaultEmail);
  const [voices, setVoices] = useState('');
  const [approval, setApproval] = useState('');
  const [partners, setPartners] = useState(data.partners);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const seatsFull = partners.length >= data.seatsTotal;
  const ready = voices !== '' && approval !== '' && !seatsFull;
  const approvalLabel = data.approvalOptions.find((a) => a.value === approval)?.label ?? '';

  function invite() {
    const to = email.trim();
    if (!EMAIL.test(to) || /\[.*\]/.test(to)) return setError('Enter the partner\'s real email address.');
    if (partners.some((p) => p.name === to)) return setError('That partner is already invited.');
    if (!ready) return;
    // INTEGRATION: invite becomes a membership with the partner role; email needs SMTP (backend map Roadmap "Partners").
    const label = data.voiceOptions.find((v) => v.value === voices)?.label ?? '';
    setPartners((p) => [...p, { id: uniqueId('partner'), name: to, voices: label, pieces: '0', status: 'Invited' }]);
    setSent(to);
    setError(null);
    setEmail('');
  }

  return { email, setEmail, voices, setVoices, approval, setApproval, approvalLabel, partners, error, sent, seatsFull, ready, invite };
}
