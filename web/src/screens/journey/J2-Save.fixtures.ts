/*
 * Sample data for J2-Save: canvas board J2-Save (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board J2-Save) and
 * its note n-j2-save, issue #48, backend map §4 row "Onboard-1-SignIn". The summary counts are the board's
 * ("3 facts and 1 likely voice"); the expired-link copy is the live sign-in copy (web/src/screens/signin/SignIn.tsx).
 */
import type { SaveData } from './types';

export const saveFixture: SaveData = {
  brandName: 'JamJam',
  summary: 'We found 3 facts and 1 likely voice about JamJam. Add your email to save them and build your kit.',
  saving: [
    { section: 'Positioning', status: 'found' },
    { section: 'Purpose', status: 'found' },
    { section: 'Messaging', status: 'found' },
    { section: 'Voice', status: 'partly' },
    { section: 'Audience', status: 'needs-you' },
    { section: 'Origin', status: 'needs-you' },
  ],
};

/** Error: the emailed link came back expired or already used (board J2-Save, States note). */
export const saveFixtureExpired: SaveData = {
  ...saveFixture,
  linkError: 'That sign-in link has expired or was already used. Send a new one.',
};
