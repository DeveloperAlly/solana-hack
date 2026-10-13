import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { loopStore } from '../../flows/loop/store';
import { resetActiveBrand, selectBrand } from '../../flows/brand/activeBrand';
import { growthSession } from './session';
import { screens } from './registry';

// The Grow screens read the one active brand's data, the brand their decisions and payouts are stored under (Codex
// review on PR 111).
vi.mock('../../lib/supabase', () => ({ supabase: null }));
beforeEach(() => {
  loopStore.reset();
  growthSession.reset();
  resetActiveBrand();
});

describe('Grow screens follow the active brand', () => {
  it('a payout made as aDNA stays aDNA\'s: JamJam sees its own empty quests and no payout; back on aDNA it persists', async () => {
    const user = userEvent.setup();
    const quests = screens.find((s) => s.artboard === 'Quests')!;
    render(<MemoryRouter>{quests.render('success')}</MemoryRouter>);
    const list = screen.getByRole('list', { name: 'Quest submissions' });
    await user.click(within(list).getAllByRole('button', { name: 'Approve and pay' })[0]);
    expect(loopStore.read().payouts.map((p) => p.submissionId)).toEqual(['q-quest-answers-1']);

    act(() => selectBrand('jamjam'));
    expect(screen.queryByRole('list', { name: 'Quest submissions' })).toBeNull();
    expect(screen.getAllByText(/suggested from the JamJam kit/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/set up aDNA/)).toBeNull();
    expect(loopStore.read().payouts).toEqual([]);

    act(() => selectBrand('adna'));
    expect(loopStore.read().payouts.map((p) => p.submissionId)).toEqual(['q-quest-answers-1']);
    expect(screen.getByRole('list', { name: 'Quest submissions' })).toBeInTheDocument();
  });

  it('Event-Detail on a first-run brand with no events says so, never showing aDNA\'s', () => {
    act(() => selectBrand('gamerslab'));
    render(<MemoryRouter>{screens.find((s) => s.artboard === 'Event-Detail')!.render('success')}</MemoryRouter>);
    expect(screen.getByRole('heading', { level: 2, name: 'No events yet' })).toBeInTheDocument();
    expect(screen.queryByText(/agent tooling night|context clinic/)).toBeNull();
  });
});

// Registries never import a brand's fixture: brand data comes through loopDataFor (ActiveBrandLoop). Only public pages,
// which are not scoped to the signed-in brand, read their fixtures directly.
const registries = import.meta.glob<string>(['../loop/registry.ts', './registry.ts'], { query: '?raw', import: 'default', eager: true });
const publicFixtures = new Set([
  'platformDetail', 'platformsCatalog', 'referralLanding', 'verifyBadgeLanding', 'verifyBadgeLandingEmpty', 'tipSheet',
  'tipSheetNoWallet', 'inviteAccept', 'inviteAcceptEmpty', 'eventsBoard', 'eventsBoardEmpty', 'eventRating', 'eventRatingEmpty',
]);

describe('registries read brand data only through loopDataFor', () => {
  it('no loop or growth registry imports a brand fixture directly', () => {
    const offenders: string[] = [];
    for (const [file, text] of Object.entries(registries)) {
      for (const m of text.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+'([^']*fixtures[^']*)'/g)) {
        if (m[1]) continue;
        for (const name of m[2].split(',').map((s) => s.trim().replace(/^type\s+/, '')).filter(Boolean)) {
          if (!publicFixtures.has(name)) offenders.push(`${file}: ${name} from ${m[3]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
