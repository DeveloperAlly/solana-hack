// Sample data for Kit-RegisterFailed: the published kit with registration failed. Source: canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Kit-RegisterFailed (note n-krf); issue #50; backend map §4, row
// "Onboard-6-Published, Kit-RegisterFailed". Bracketed values stay bracketed.
import type { PublishedData } from './types';
import { publishedData } from './Onboard-6-Published.fixtures';

export const registerFailedData: PublishedData = {
  ...publishedData,
  status: 'failed',
  tx: null,
  lastTry: '[time]',
  reason: '[Plain-language reason, e.g. "the network didn\'t confirm in time"].',
  errorDetails: '[error details: registration id, kit hash, RPC error]',
};
