// Sample data for Settings-Plan. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Settings-Plan, issue #51; backend map §4 row "Settings › Plan" (billing provider not chosen, G-BILLING).
import type { SettingsPlanData } from './types';
import { planNames } from './Pricing.fixtures';

export const settingsPlan: SettingsPlanData = {
  plan: '[Plan name]',
  planNames,
  seats: '[n] of [n]',
  nextBill: '[amount] · [date]',
  billingProvider: 'Billing provider not chosen yet (G-BILLING), so there are no card details to show.',
  invoices: [{ id: 'inv-1', date: '[date]', amount: '[amount]' }],
};

export const settingsPlanNoInvoices: SettingsPlanData = { ...settingsPlan, invoices: [] };
