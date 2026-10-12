// Ambassador page (issue #53): both flows click through campaigns → detail → generate → publish → status on the gallery
// routes, and each screen's main interactions work on fixtures with no network call.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../gallery/Gallery';
import { applyFix, isOpen, scoreFor } from './useDraft';
import { generateData } from './fixtures';
import { validateLinkedInPostUrl, validatePageUrl, X_NOT_PAID } from './validators';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchSpy = vi.fn(() => { throw new Error('ambassador screens must not call fetch'); });
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).toHaveBeenCalledTimes(0);
  vi.unstubAllGlobals();
});

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
        <Route path="*" element={<p>Left the ambassador page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}
const h1 = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });
const user = () => userEvent.setup();

async function fixAllFlags(u: ReturnType<typeof user>, names: RegExp[]) {
  for (const name of names) await u.click(screen.getByRole('button', { name }));
}

describe('desktop flow', () => {
  it('campaigns → detail → join → generate → publish → verifying → paid', async () => {
    const u = user();
    at('/screens/Amb-1-Campaigns');
    await h1('Open campaigns');
    await u.click(screen.getByRole('link', { name: 'View aDNA launch week' }));
    await h1('aDNA launch week');
    await u.click(screen.getByRole('button', { name: 'Join and start writing' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email to join.');
    await u.type(screen.getByLabelText('Sign in with email to join'), 'mai@example.com');
    await u.click(screen.getByRole('button', { name: 'Join and start writing' }));
    await h1('Write your piece');
    const cont = screen.getByRole('button', { name: 'Continue to publish' });
    expect(cont).toBeDisabled();
    await fixAllFlags(u, [/^Remove line/, /^Replace/, /^Add at end/]);
    expect(screen.getByRole('meter', { name: 'On-brand score' })).toHaveAttribute('aria-valuenow', '91');
    expect(screen.getByText('No flags.')).toBeInTheDocument();
    await u.click(cont);
    await h1('Publish your LinkedIn post');
    await u.click(screen.getByRole('button', { name: 'Post now' }));
    await h1('Checking your post');
    await u.click(screen.getByRole('link', { name: 'Approved and paid' }));
    await h1('Paid 10 USDC');
  });

  it('back links go back a step', async () => {
    const u = user();
    at('/screens/Amb-4-Publish');
    await u.click(await screen.findByRole('link', { name: '← Back to editing' }));
    await h1('Write your piece');
    await u.click(screen.getByRole('link', { name: '← aDNA launch week' }));
    await h1('aDNA launch week');
    await u.click(screen.getByRole('link', { name: '← All campaigns' }));
    await h1('Open campaigns');
  });
});

describe('Amb-1 campaigns', () => {
  it('filters by channel, sorts, and toggles notify on a closed campaign', async () => {
    const u = user();
    at('/screens/Amb-1-Campaigns');
    const list = await screen.findByRole('list', { name: 'Campaigns' });
    const titles = () => within(list).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(titles()).toEqual(['[film.fun campaign name]', 'aDNA launch week', '[Ally Haire campaign name]']);
    await u.selectOptions(screen.getByLabelText('Sort'), 'payout');
    expect(titles()[0]).toBe('aDNA launch week');
    await u.click(screen.getByRole('button', { name: 'Blog' }));
    expect(screen.getByRole('button', { name: 'Blog' })).toHaveAttribute('aria-pressed', 'true');
    expect(titles()).toHaveLength(3);
    const notify = screen.getByRole('button', { name: 'Notify me about Ally Haire' });
    await u.click(notify);
    expect(screen.getByRole('button', { name: "We'll email you about Ally Haire" })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /View \[film.fun campaign name\]/ })).toBeDisabled();
  });

  it('empty: notify-me per brand, earnings still visible', async () => {
    const u = user();
    at('/screens/Amb-1b-CampaignsEmpty');
    await screen.findByRole('heading', { name: 'No open campaigns right now' });
    expect(screen.getByText('Mai T. · 15 USDC')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Notify me about GamersLab' }));
    expect(screen.getByRole('button', { name: "We'll email you about GamersLab" })).toBeInTheDocument();
  });
});

describe('Amb-3 generate', () => {
  it('the meter follows typing; regenerate, undo and history keep versions', async () => {
    const u = user();
    at('/screens/Amb-3-Generate');
    await h1('Write your piece');
    const draft = screen.getByRole('textbox', { name: 'Draft' });
    const meter = () => screen.getByRole('meter', { name: 'On-brand score' }).getAttribute('aria-valuenow');
    expect(meter()).toBe('74');
    await u.type(draft, '\n\n#ad');
    expect(meter()).toBe('80');
    expect(screen.queryByText('Missing disclosure')).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /^Replace/ }));
    expect((draft as HTMLTextAreaElement).value).toContain('project context');
    await u.click(screen.getByRole('button', { name: 'Undo' }));
    expect((draft as HTMLTextAreaElement).value).toContain('memory dump');
    await u.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect(screen.getByText(/Regenerated from your angle/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /^History/ }));
    await u.click(screen.getByRole('button', { name: 'Restore version 1' }));
    expect((draft as HTMLTextAreaElement).value).toContain('#ad');
    await u.selectOptions(screen.getByLabelText('Format'), 'tutorial');
    expect(screen.getByLabelText('Format')).toHaveValue('tutorial');
  });

  it('loading shows the generating skeleton', async () => {
    at('/screens/Amb-3-Generate?state=loading');
    expect(await screen.findByRole('status', { name: 'Generating your draft' })).toBeInTheDocument();
  });

  it('scores, detects and fixes from the fixture rules', () => {
    const [banned, avoided, disclosure] = generateData.checks;
    expect(scoreFor(3, generateData)).toBe(74);
    expect(scoreFor(0, generateData)).toBe(91);
    expect(isOpen(banned, generateData.draft)).toBe(true);
    expect(applyFix(banned, generateData.draft)).not.toContain('10x');
    expect(applyFix(avoided, 'a memory dump')).toBe('a project context');
    expect(isOpen(disclosure, applyFix(disclosure, 'Hi'))).toBe(false);
  });
});

describe('Amb-4 publish', () => {
  it('validates pasted URLs, refuses X, and submits a good one', async () => {
    const u = user();
    at('/screens/Amb-4-Publish');
    await h1('Publish your LinkedIn post');
    const field = screen.getByLabelText('LinkedIn post URL');
    await u.type(field, 'https://x.com/mai/status/1');
    await u.click(screen.getByRole('button', { name: 'Submit URL' }));
    expect(screen.getByRole('alert')).toHaveTextContent(X_NOT_PAID);
    await u.clear(field);
    await u.type(field, 'https://www.linkedin.com/posts/mai_agents-activity-1');
    await u.click(screen.getByRole('button', { name: 'Submit URL' }));
    await h1('Checking your post');
  });

  it('checks LinkedIn and page links', () => {
    expect(validateLinkedInPostUrl('')).toMatch(/Paste/);
    expect(validateLinkedInPostUrl('not a url')).toMatch(/not a link/);
    expect(validateLinkedInPostUrl('https://linkedin.com/in/mai')).toMatch(/LinkedIn post link/);
    expect(validateLinkedInPostUrl('https://www.linkedin.com/feed/update/urn:li:activity:1')).toBeNull();
    expect(validatePageUrl('https://yourblog.com/')).toMatch(/page itself/);
    expect(validatePageUrl('https://twitter.com/a/b')).toBe(X_NOT_PAID);
    expect(validatePageUrl('https://yourblog.com/agents')).toBeNull();
  });
});

describe('Amb-5 status', () => {
  it('paid: receipt sheet, public check, write another, withdraw explained', async () => {
    const u = user();
    at('/screens/Amb-5b-Paid');
    await h1('Paid 10 USDC');
    expect(screen.getByRole('link', { name: 'See public check' })).toHaveAttribute('href', '/screens/Verify-1-Match');
    await u.click(screen.getByRole('button', { name: 'View onchain receipt' }));
    const sheet = screen.getByRole('dialog', { name: 'Receipt' });
    expect(within(sheet).getByText('[onchain receipt link]')).toBeInTheDocument();
    await u.keyboard('{Escape}');
    await u.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(screen.getByRole('status')).toHaveTextContent('Payouts go straight to your own wallet');
    await u.click(screen.getByRole('link', { name: 'Write another piece' }));
    await h1('Write your piece');
  });

  it('failed: says which check failed and recovers three ways', async () => {
    const u = user();
    at('/screens/Amb-5c-VerifyFailed');
    await h1("We couldn't verify your post");
    expect(screen.getByRole('alert')).toHaveTextContent('Text differs from your approved draft by 38%');
    await u.click(screen.getByRole('button', { name: 'Ask aDNA to review' }));
    expect(screen.getByRole('status')).toHaveTextContent('Sent to aDNA for review');
    await u.click(screen.getByRole('link', { name: 'Paste a different URL' }));
    await h1('Publish your LinkedIn post');
  });

  it('budget reached: still verified, opt in to be paid on a top-up', async () => {
    const u = user();
    at('/screens/Amb-5d-BudgetReached');
    await h1('This campaign ran out of budget');
    expect(screen.getByText('500 of 500 USDC paid out')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Pay me if aDNA adds budget' }));
    expect(screen.getByRole('button', { name: "You'll be paid if aDNA adds budget" })).toHaveAttribute('aria-pressed', 'true');
    await u.click(screen.getByRole('link', { name: 'See other campaigns' }));
    await h1('Open campaigns');
  });
});

describe('mobile flow (390 px artboards)', () => {
  it('M-1 → M-2 → M-3 (flags sheet) → M-4 → M-5 verifying → paid, with the receipt sheet', async () => {
    const u = user();
    at('/screens/M-1-Campaigns');
    await h1('Open campaigns');
    expect(screen.getByRole('navigation', { name: 'Ambassador' })).toBeInTheDocument();
    await u.click(screen.getByRole('link', { name: /aDNA launch week/ }));
    await h1('aDNA launch week');
    await u.click(screen.getByRole('button', { name: 'Read more' }));
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    await u.click(screen.getByRole('link', { name: 'Join and start writing' }));
    await h1('Write your piece');
    expect(screen.getByRole('button', { name: 'Publish (after fixes)' })).toBeDisabled();
    await u.click(screen.getByRole('button', { name: '3 flags' }));
    const sheet = screen.getByRole('dialog', { name: 'Flags' });
    await u.click(within(sheet).getByRole('button', { name: /^Remove/ }));
    await u.click(within(sheet).getByRole('button', { name: /^Replace/ }));
    await u.click(within(sheet).getByRole('button', { name: /^Add/ }));
    expect(within(sheet).getByText('No flags.')).toBeInTheDocument();
    await u.click(within(sheet).getByRole('button', { name: 'Close' }));
    await u.click(screen.getByRole('button', { name: 'Publish' }));
    await h1('Publish your LinkedIn post');
    await u.click(screen.getByRole('button', { name: 'Post now' }));
    await h1('Checking your post');
    expect(screen.queryByRole('link', { name: 'Budget reached' })).not.toBeInTheDocument();
    await u.click(screen.getByRole('link', { name: 'Approved and paid' }));
    await h1('Paid 10 USDC');
    await u.click(screen.getByRole('button', { name: 'Receipt' }));
    expect(screen.getByRole('dialog', { name: 'Receipt' })).toBeInTheDocument();
  });

  it('mobile back links and tab bar', async () => {
    const u = user();
    at('/screens/M-4-Publish');
    await u.click(await screen.findByRole('link', { name: 'Back to editing' }));
    await h1('Write your piece');
    await u.click(screen.getByRole('link', { name: 'Back to the campaign' }));
    await h1('aDNA launch week');
    await u.click(screen.getByRole('link', { name: 'Back to campaigns' }));
    await h1('Open campaigns');
    await u.click(within(screen.getByRole('navigation', { name: 'Ambassador' })).getByRole('link', { name: 'My posts' }));
    await h1('Paid 10 USDC');
  });
});
