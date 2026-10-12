// Sample data for Settings-GetKey. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Settings-GetKey, issue #51; backend map §4 row "Settings › AI" (OpenRouter bring-your-own key).
import type { SettingsGetKeyData } from './types';

export const settingsGetKey: SettingsGetKeyData = {
  connectNote: 'You sign in to OpenRouter, approve JamJam, and come back. No copying keys.',
  whyOwnKey: 'Your brand content runs under your account and your data settings. You see the cost directly.',
  keyError: "That key didn't work: [provider message]. Nothing was saved.",
};
