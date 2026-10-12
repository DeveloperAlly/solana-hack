import { describe, expect, it } from 'vitest';
import { navForArtboard } from './boardNav';

describe('navForArtboard (stage from the board home, tab from the stage tabs)', () => {
  it('puts each board on its home stage and tab', () => {
    expect(navForArtboard('Platforms')).toEqual({ stage: 'distribute', tab: 'platforms' });
    expect(navForArtboard('Platform-Detail', 'Platforms')).toEqual({ stage: 'distribute', tab: 'platforms' });
    expect(navForArtboard('Badge-Embed')).toEqual({ stage: 'verify', tab: 'badge' });
    expect(navForArtboard('Tips-Received')).toEqual({ stage: 'verify', tab: 'tips' });
    expect(navForArtboard('Referral')).toEqual({ stage: 'grow', tab: 'referrals' });
    expect(navForArtboard('Quests', 'Dashboard')).toEqual({ stage: 'grow', tab: 'ambassadors' });
  });
  it('a board under no tab has its stage and no tab; a first-run board has none', () => {
    expect(navForArtboard('Event-Detail')).toEqual({ stage: 'grow', tab: undefined });
    expect(() => navForArtboard('J1-Read')).toThrow(/no stage/);
  });
});
