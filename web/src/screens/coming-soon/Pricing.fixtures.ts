// Sample data for Pricing. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board Pricing,
// issue #51; backend map G-BILLING (provider not chosen). Prices stay bracketed: the owner has not decided them (issue #51).
// The market band note is the canvas text, citing research 10 §6.
import type { PricingData } from './types';

export const pricing: PricingData = {
  tiers: [
    { id: 'free', name: 'Free', price: '$0', features: 'Brand kit v1, registered · [n] posts a month · Verify and Ledger', cta: 'Start free' },
    { id: 'solo', name: 'Solo', price: '[price] / month', features: 'Unlimited drafts · publishing · media · claims table', cta: 'Choose Solo', note: 'Market band for solo AI tools: $29–49 a month (research 10 §6)' },
    { id: 'team', name: 'Team', price: '[price] / month', features: 'Seats and roles · approvals · ambassador campaigns', cta: 'Choose Team' },
  ],
  footnote: 'No card to start. No wallet, ever. [Annual discount, if any]',
};
