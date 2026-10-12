// Sample data for Upgrade. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board Upgrade,
// issue #51; backend map G-BILLING (provider not chosen) and §4 row "Settings › Plan". Prices stay bracketed.
import type { UpgradeData } from './types';
import { planNames } from './Pricing.fixtures';

// Prices stay bracketed per tier until the owner sets them (issue #51).

export const upgrade: UpgradeData = {
  tiers: { solo: { name: planNames.solo, price: '[Solo price]' }, team: { name: planNames.team, price: '[Team price]' } },
  defaultPlan: 'solo',
  cardForm: "[Billing provider's card form: provider not chosen]",
  keepNote: 'Your kit, posts and records stay yours if you cancel.',
  failure: "[provider reason]. You haven't been charged.",
};
