import { createElement } from 'react';
import type { ScreenEntry } from '../registry-types';
import { screenStates } from '../../ui/composites/DemoStateSwitcher';
import { VerifyCheckScreen } from './VerifyCheckScreen';
import { VerifyLedgerScreen } from './VerifyLedgerScreen';
import { VerifyLookupScreen } from './VerifyLookupScreen';
import { verifyEdited, verifyMatch, verifyNoMatch, verifyRetracted } from './verify.fixtures';
import { ledger, ledgerEmpty } from './ledger.fixtures';
import { verifyLookup } from './lookup.fixtures';
import type { VerifyCheckData } from './types';
import type { RouteTag } from '../../config/routes';

// Canvas page "4 · Verify anywhere" (canvas v21; the two Verify boards from the old "Coming soon" page moved here; issue #49; issue #51 hands
// them to UI-3). Titles and tags are the canvas board titles (canvas.json). The live /verify and /ledger stay as they are.
// Every screen remounts per artboard and state (the key), so each demo state starts fresh.

function checkEntry(artboard: ScreenEntry['artboard'], page: ScreenEntry['page'], title: string, tag: RouteTag, data: VerifyCheckData): ScreenEntry {
  return {
    artboard,
    page,
    title,
    tag,
    states: screenStates,
    render: (state) => createElement(VerifyCheckScreen, { key: `${artboard}-${state}`, data, state, tag }),
  };
}

export const screens: ScreenEntry[] = [
  checkEntry('Verify-1-Match', 'public', 'Verify: brand-approved', 'HACKATHON', verifyMatch),
  checkEntry('Verify-2-NoMatch', 'public', 'Verify: not found', 'HACKATHON', verifyNoMatch),
  checkEntry('Verify-3-Edited', 'public', 'Verify: edited from original (needs a fuzzy match; Verify is exact-match today)', 'COMING SOON', verifyEdited),
  {
    artboard: 'Ledger',
    page: 'public',
    title: 'Public ledger: kits and posts (rewritten)',
    tag: 'HACKATHON',
    states: screenStates,
    render: (state) => createElement(VerifyLedgerScreen, { key: `Ledger-${state}`, data: state === 'empty' ? ledgerEmpty : ledger, state }),
  },
  {
    artboard: 'Verify-4-Kit-Account-Claim',
    page: 'public',
    title: 'Verify an account, kit version or claim',
    tag: 'COMING SOON',
    states: screenStates,
    render: (state) => createElement(VerifyLookupScreen, { key: `Verify-4-${state}`, data: verifyLookup, state }),
  },
  checkEntry('Verify-5-Retracted', 'public', 'Verify: retracted', 'COMING SOON', verifyRetracted),
];
