import { describe, expect, it } from 'vitest';
import { cleanPublishedUrl, contentHash, slopCheck } from '../../worker/posts';

describe('post checks', () => {
  it('flags banned phrases, em dashes and exclamation marks', () => {
    expect(slopCheck('We help brands prove what they said.').passed).toBe(true);
    const r = slopCheck('Unlock a seamless future — now!');
    expect(r.passed).toBe(false);
    expect(r.hits).toEqual(expect.arrayContaining(['unlock', 'seamless', '—', 'exclamation mark']));
  });
  it('hashes whitespace variants the same and an edited word differently', async () => {
    const a = await contentHash('We built Waterlily.\n\nIt proves  what brands said.');
    expect(await contentHash('  We built Waterlily.\r\n\r\n\r\nIt proves what brands said. ')).toBe(a);
    expect(await contentHash('We built Waterlily.\n\nIt proves what brands say.')).not.toBe(a);
  });
  it('accepts only http(s) published links', () => {
    expect(cleanPublishedUrl('')).toBeNull();
    expect(cleanPublishedUrl('https://www.linkedin.com/posts/x')).toBe('https://www.linkedin.com/posts/x');
    expect(() => cleanPublishedUrl('javascript:alert(1)')).toThrow();
    expect(() => cleanPublishedUrl('not a url')).toThrow();
  });
});
