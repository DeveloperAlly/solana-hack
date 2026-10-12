import { createElement } from 'react';
import type { ScreenEntry } from '../registry-types';
import { Verify2NoMatch } from './Verify2NoMatch';
import { verifyNoMatch, verifyNoMatchError } from './fixtures';

// Canvas page "Verify + ledger" (issue #49 builds the rest). Screens here are the new flow; screens/verify stays live.
export const screens: ScreenEntry[] = [
  {
    artboard: 'Verify-2-NoMatch',
    page: 'public',
    title: 'Verify: not found',
    tag: 'HACKATHON',
    states: ['success', 'empty', 'loading', 'error'],
    render: (state) => createElement(Verify2NoMatch, { data: state === 'error' ? verifyNoMatchError : verifyNoMatch, state }),
  },
];
