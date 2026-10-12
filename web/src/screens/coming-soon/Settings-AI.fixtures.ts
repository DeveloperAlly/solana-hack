// Sample data for Settings-AI. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Settings-AI, issue #51; backend map §4 row "Settings › AI". Bracketed values stay bracketed as on the canvas.
import type { SettingsAIData } from './types';

export const settingsAI: SettingsAIData = {
  sources: [
    { id: 'openrouter', name: '1. Your own key · OpenRouter', status: 'not-connected' },
    { id: 'default', name: '2. JamJam default · free and low-cost models', status: 'in-use' },
    { id: 'endpoint', name: '3. Any OpenAI-compatible endpoint', detail: 'e.g. your own GPU box', status: 'not-set' },
  ],
  storedKey: { last4: '[last 4]', addedOn: '[date]' },
  usage: { calls: '[n]', spend: '[amount]' },
  keyError: "That key didn't work: [provider message]. Nothing was saved.",
};

export const settingsAINoKey: SettingsAIData = { ...settingsAI, storedKey: null };
