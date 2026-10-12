import { describe, expect, it } from 'vitest';
import { seatCheck, tipAmountCheck } from './checks';
import { badgeSnippet } from './useBadge';
import { badgeEmbed } from './badge.fixtures';
import { adnaLaunchPost } from '../public-next/posts.fixtures';

describe('Growth checks', () => {
  it('tip amounts: positive, up to 2 decimals, and never Infinity or beyond exact cents (Codex review on PR #89)', () => {
    expect(tipAmountCheck('5').blocking).toBe(false);
    expect(tipAmountCheck('2.50').blocking).toBe(false);
    expect(tipAmountCheck('0').blocking).toBe(true);
    expect(tipAmountCheck('1.234').blocking).toBe(true);
    expect(tipAmountCheck('9'.repeat(400))).toEqual({ blocking: true, label: 'That amount is too large.' });
    expect(tipAmountCheck('99999999999999999').blocking).toBe(true);
  });
  it('seats block at the limit', () => {
    expect(seatCheck(2, 3).blocking).toBe(false);
    expect(seatCheck(3, 3).blocking).toBe(true);
  });
  it('the badge snippet escapes attribute values (Codex review on PR #89)', () => {
    const post = { ...adnaLaunchPost, brand: { ...adnaLaunchPost.brand, name: 'Say "hi" <b>' } };
    const html = badgeSnippet(badgeEmbed, post, 'outline');
    expect(html).toContain('alt="Official Say &quot;hi&quot; &lt;b&gt; post, checked on JamJam"');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('img')?.getAttribute('alt')).toBe('Official Say "hi" <b> post, checked on JamJam');
  });
});
