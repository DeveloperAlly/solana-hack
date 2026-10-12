// Sample data for Upgrade. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board Upgrade,
// issue #51; backend map G-BILLING (provider not chosen) and §4 row "Settings › Plan". Prices stay bracketed.
import type { UpgradeData } from './types';

export const upgrade: UpgradeData = {
  planName: 'Solo, monthly',
  price: '[price]',
  cardForm: "[Billing provider's card form: provider not chosen]",
  keepNote: 'Your kit, posts and records stay yours if you cancel.',
  failure: "[provider reason]. You haven't been charged.",
};
