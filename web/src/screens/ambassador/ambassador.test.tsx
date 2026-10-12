// Ambassador page (issue #53): both flows click through campaigns → detail → generate → publish → status on the gallery
// routes, and each screen's main interactions work on fixtures with no network call.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../gallery/Gallery';
import { applyFix, isOpen, scoreFor } from './useDraft';
import { draftChecks, gateFor, hasToken, removeFlagged } from './draftRules';
import { AmbGenerate } from './AmbGenerate';
import { AmbPublish } from './AmbPublish';
import { adnaFormats, publishData, statusPaid } from './fixtures';
import { campaignProgress } from './copy';
import { ambSession } from './session';
import { generateData } from './fixtures';
import { validateCode, validateLinkedInPostUrl, validatePageUrl, X_NOT_PAID } from './validators';
import { renderHook, act } from '@testing-library/react';
import { useCampaignList } from './useCampaignList';
import { campaignsData } from './fixtures';
import { allScreens } from '../../gallery/registry';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchSpy = vi.fn(() => { throw new Error('ambassador screens must not call fetch'); });
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  ambSession.reset();
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

/** The join state machine: email (validated) → code (only after it was sent) → joined. */
async function joinWithCode(u: ReturnType<typeof user>) {
  expect(screen.queryByLabelText('6-digit code')).not.toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Email me a code' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter your email to join.');
  await u.type(screen.getByLabelText('Sign in with email to join'), 'mai@example.com');
  await u.click(screen.getByRole('button', { name: 'Email me a code' }));
  expect(screen.getByText(/We sent a code to mai@example.com/)).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: 'Join and start writing' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter the code from the email.');
  await u.type(screen.getByLabelText('6-digit code'), '123456');
  await u.click(screen.getByRole('button', { name: 'Join and start writing' }));
}

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
    await joinWithCode(u);
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
    expect(titles()).toEqual(['[film.fun campaign name]', 'aDNA launch week', '[GamersLab campaign name]']);
    await u.selectOptions(screen.getByLabelText('Sort'), 'payout');
    expect(titles()[0]).toBe('aDNA launch week');
    await u.click(screen.getByRole('button', { name: 'Blog' }));
    expect(screen.getByRole('button', { name: 'Blog' })).toHaveAttribute('aria-pressed', 'true');
    expect(titles()).toHaveLength(3);
    const notify = screen.getByRole('button', { name: 'Notify me about GamersLab' });
    await u.click(notify);
    expect(screen.getByRole('button', { name: "We'll email you about GamersLab" })).toHaveAttribute('aria-pressed', 'true');
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
  it('paid: receipt sheet, public check, write another; paid to your own wallet, no withdraw', async () => {
    const u = user();
    at('/screens/Amb-5b-Paid');
    await h1('Paid 10 USDC');
    expect(screen.getByRole('link', { name: 'See public check' })).toHaveAttribute('href', '/screens/Verify-1-Match');
    await u.click(screen.getByRole('button', { name: 'View onchain receipt' }));
    const sheet = screen.getByRole('dialog', { name: 'Receipt' });
    expect(within(sheet).getByText('[onchain receipt link]')).toBeInTheDocument();
    await u.keyboard('{Escape}');
    expect(screen.getByText('10 USDC to your wallet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /withdraw/i })).not.toBeInTheDocument();
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
    await u.click(screen.getByRole('button', { name: 'Join and start writing' }));
    await joinWithCode(u);
    await h1('Write your piece');
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
    // The sheet lists every check, the score included (draftChecks): 3 brand flags plus the on-brand line.
    await u.click(screen.getByRole('button', { name: '4 flags' }));
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

describe('no dead or dishonest controls (review rules, issue #45)', () => {
  it('the channel filter and sort change what the list shows', async () => {
    const blogOnly = { ...campaignsData.campaigns[1], id: 'blog-only', channels: ['blog' as const] };
    const { result } = renderHook(() => useCampaignList([...campaignsData.campaigns, blogOnly]));
    expect(result.current.visible).toHaveLength(4);
    act(() => result.current.setChannel('linkedin'));
    expect(result.current.visible.map((c) => c.id)).not.toContain('blog-only');
    expect(result.current.summary).toBe('3 campaigns on LinkedIn, closed ones last.');
    act(() => result.current.setSort('payout'));
    expect(result.current.visible[0].id).toBe('adna-launch-week');
  });

  it('the filter shows its effect on screen', async () => {
    const u = user();
    at('/screens/Amb-1-Campaigns');
    expect(await screen.findByRole('status')).toHaveTextContent('3 campaigns, closed ones last.');
    await u.click(screen.getByRole('button', { name: 'LinkedIn' }));
    expect(screen.getByRole('status')).toHaveTextContent('3 campaigns on LinkedIn');
  });

  it('the Format select changes the piece shown', async () => {
    const u = user();
    at('/screens/Amb-3-Generate');
    await h1('Write your piece');
    expect(screen.getByText(/^LinkedIn post · 10 USDC · Piece 2 of 3/)).toBeInTheDocument();
    await u.selectOptions(screen.getByLabelText('Format'), 'tutorial');
    expect(screen.getByText(/^Tutorial · 50 USDC · Piece 2 of 3/)).toBeInTheDocument();
  });

  it('actions are disabled while a draft is generating', async () => {
    at('/screens/Amb-3-Generate?state=loading');
    await h1('Write your piece');
    for (const name of ['Regenerate', 'Undo', /^History/, 'Continue to publish', /^Remove line/]) expect(screen.getByRole('button', { name })).toBeDisabled();
  });

  it('publish is reachable only once the draft passes: no skip-ahead link', async () => {
    at('/screens/Amb-3-Generate');
    await h1('Write your piece');
    expect(screen.getByRole('button', { name: 'Continue to publish' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: /skip ahead/i })).not.toBeInTheDocument();
  });

  it('the code step exists only after a code was sent, and the email can be changed', async () => {
    const u = user();
    at('/screens/Amb-2-Detail');
    await h1('aDNA launch week');
    expect(screen.queryByLabelText('6-digit code')).not.toBeInTheDocument();
    await u.type(screen.getByLabelText('Sign in with email to join'), 'mai@example.com');
    await u.click(screen.getByRole('button', { name: 'Email me a code' }));
    await u.type(screen.getByLabelText('6-digit code'), '12');
    await u.click(screen.getByRole('button', { name: 'Join and start writing' }));
    expect(screen.getByRole('alert')).toHaveTextContent('The code is 6 digits.');
    await u.click(screen.getByRole('button', { name: 'Change email' }));
    expect(screen.getByLabelText('Sign in with email to join')).toBeInTheDocument();
    expect(validateCode('123456')).toBeNull();
  });

  it('no screen claims approval is on-chain (only registration and payouts are)', () => {
    for (const s of allScreens.filter((x) => x.page === 'ambassador')) {
      for (const state of s.states) {
        const { container, unmount } = render(<MemoryRouter>{s.render(state)}</MemoryRouter>);
        for (const el of container.querySelectorAll('p, li, dt, dd, button, a, h1, h2, label')) {
          expect(el.textContent ?? '').not.toMatch(/approv\w*[^.]*on-?chain|on-?chain[^.]*approv/i);
        }
        unmount();
      }
    }
  });
});

describe('draft rules and the one publish gate (Codex review on PR #78)', () => {
  const [banned, , disclosure] = generateData.checks;
  const checksOf = (text: string, threshold = generateData.threshold, pieceDone = false) => {
    const open = generateData.checks.filter((c) => isOpen(c, text));
    return draftChecks({ text, rules: generateData.checks, score: scoreFor(open.length, generateData), threshold, charLimit: generateData.charLimit, pieceDone });
  };
  const gateOf = (text: string, generating = false) => gateFor(checksOf(text), generating);

  it('a disclosure counts only as a whole token: #adventure is not #ad', () => {
    expect(isOpen(disclosure, 'Great week #adventure')).toBe(true);
    expect(isOpen(disclosure, 'Great week x#ad')).toBe(true);
    expect(isOpen(disclosure, 'Great week #ad')).toBe(false);
    expect(isOpen(disclosure, 'Great week #AD.')).toBe(false);
    expect(isOpen(disclosure, 'Great week. Sponsored by aDNA')).toBe(false);
    // The brand's rule allows exactly "Sponsored by aDNA" or #ad (canvas Amb-2 rules), so #sponsored alone does not disclose.
    expect(isOpen(disclosure, 'Great week #sponsored')).toBe(true);
    expect(hasToken('#ad', '#ad')).toBe(true);
  });

  it('Remove line removes only the flagged sentence, in single-newline drafts too', () => {
    expect(removeFlagged("First line.\nIt will 10x your team's output.\nLast line.", "10x your team's output")).toBe('First line.\nLast line.');
    expect(removeFlagged("Great tool. It will 10x your team's output. Try it.", "10x your team's output")).toBe('Great tool. Try it.');
    expect(removeFlagged("A.\n\nIt will 10x your team's output.\n\nB.", "10x your team's output")).toBe('A.\n\nB.');
    expect(removeFlagged("It will 10x your team's output.\n\nB.", "10x your team's output")).toBe('B.');
    expect(applyFix(banned, 'Keep me.\nIt will 10x your team\'s output.')).toBe('Keep me.');
  });

  it('the gate checks every condition, in order, and says why', () => {
    const clean = applyFix(disclosure, applyFix(banned, generateData.draft.replace('memory dump', 'project context')));
    expect(gateOf(clean)).toEqual({ ok: true, reason: null });
    expect(gateOf(clean, true).reason).toBe('Wait for the draft to finish generating.');
    expect(gateOf('#ad').reason).toBe('Write your post first.');
    expect(gateOf(`${clean} ${'x'.repeat(3000)}`).reason).toMatch(/^Over the 3000-character limit by \d+\.$/);
    expect(gateOf(generateData.draft).reason).toBe('Fix first: banned claim, missing disclosure, below the on-brand line.');
    expect(gateOf(applyFix(banned, generateData.draft)).reason).toBe('Add "Sponsored by aDNA" or #ad.');
  });

  it('an over-limit draft locks desktop Continue, with the reason as its description', async () => {
    at('/screens/Amb-3-Generate');
    await h1('Write your piece');
    const box = screen.getByRole('textbox', { name: 'Draft' });
    const clean = applyFix(disclosure, applyFix(banned, generateData.draft));
    fireEvent.change(box, { target: { value: clean } });
    const cont = screen.getByRole('button', { name: 'Continue to publish' });
    expect(cont).toBeEnabled();
    fireEvent.change(box, { target: { value: `${clean} ${'x'.repeat(3000)}` } });
    expect(cont).toBeDisabled();
    expect(cont).toHaveAccessibleDescription(/Over the 3000-character limit/);
  });

  it('an over-limit draft locks mobile Publish the same way', async () => {
    at('/screens/M-3-Generate');
    await h1('Write your piece');
    const publish = screen.getByRole('button', { name: 'Publish' });
    expect(publish).toHaveAccessibleDescription('Fix first: banned claim, missing disclosure, below the on-brand line.');
    const clean = applyFix(disclosure, applyFix(banned, generateData.draft));
    fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), { target: { value: clean } });
    expect(publish).toBeEnabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), { target: { value: `${clean} ${'x'.repeat(3000)}` } });
    expect(publish).toBeDisabled();
    expect(publish).toHaveAccessibleDescription(/Over the 3000-character limit/);
  });
});

describe('payout copy matches the product (backend map row "Amb-5a, 5b, 5c, 5d, M-5"; ADR-006)', () => {
  it('no screen claims a JamJam account, a withdraw, or that the chain proves approval', () => {
    for (const s of allScreens.filter((x) => x.page === 'ambassador')) {
      for (const state of s.states) {
        const { container, unmount } = render(<MemoryRouter>{s.render(state)}</MemoryRouter>);
        const text = container.textContent ?? '';
        expect(text).not.toMatch(/JamJam account|withdraw/i);
        expect(text).not.toMatch(/check it's brand-approved/i);
        unmount();
      }
    }
  });
  it('detail and publish say where the money goes and what the fingerprint proves', async () => {
    at('/screens/Amb-2-Detail');
    expect(await screen.findByText('USDC goes to your own wallet once aDNA approves your verified post.')).toBeInTheDocument();
  });
  it('publish explains the fingerprint honestly', async () => {
    at('/screens/Amb-4-Publish');
    expect(await screen.findByText(/anyone can check the published text matches the approved draft/)).toBeInTheDocument();
  });
});

describe('choices flow to every later screen (session.ts), desktop and mobile', () => {
  it('desktop: the piece, the edited draft, the route and the link reach Publish and Status', async () => {
    const u = user();
    at('/screens/Amb-3-Generate');
    await h1('Write your piece');
    await u.selectOptions(screen.getByLabelText('Format'), 'tutorial');
    const box = screen.getByRole('textbox', { name: 'Draft' });
    const mine = 'My own tutorial opening line.\n\nWhy agents need shared project context.\n\n#ad';
    fireEvent.change(box, { target: { value: mine } });
    await u.click(screen.getByRole('button', { name: 'Continue to publish' }));
    await h1('Publish your Tutorial');
    expect(screen.getByText(`Your post (${mine.length} characters)`)).toBeInTheDocument();
    expect(screen.getByText(/^My own tutorial opening line\./)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Post now' })).not.toBeInTheDocument();
    await u.type(screen.getByLabelText('Page URL'), 'https://mai.dev/agents-context');
    await u.click(screen.getByRole('button', { name: 'Submit' }));
    await h1('Checking your post');
    expect(screen.getByText('aDNA launch week · Tutorial · 50 USDC')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Post status' })).toHaveTextContent('URL pasted');
    await u.click(screen.getByRole('link', { name: 'Approved and paid' }));
    await h1('Paid 50 USDC');
    expect(screen.getByText('50 USDC to your wallet')).toBeInTheDocument();
  });

  it('a draft edited on desktop opens on mobile, and a pasted link reaches the failed check', async () => {
    const u = user();
    ambSession.update({ draft: 'Edited elsewhere.\n\nSponsored by aDNA' });
    at('/screens/M-3-Generate');
    await h1('Write your piece');
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('Edited elsewhere.\n\nSponsored by aDNA');
    await u.click(screen.getByRole('button', { name: 'Publish' }));
    await h1('Publish your LinkedIn post');
    await u.type(screen.getByLabelText('LinkedIn post URL'), 'https://www.linkedin.com/posts/mai_agents-1');
    await u.click(screen.getByRole('button', { name: 'Submit URL' }));
    await h1('Checking your post');
    expect(ambSession.get().route).toBe('paste-url');
    render(<MemoryRouter initialEntries={['/screens/Amb-5c-VerifyFailed']}><Routes><Route path="/screens/:artboard" element={<GalleryScreen />} /></Routes></MemoryRouter>);
    expect(await screen.findByText('Link checked: https://www.linkedin.com/posts/mai_agents-1')).toBeInTheDocument();
  });

  it('a piece already written cannot be published again', async () => {
    const u = user();
    at('/screens/Amb-3-Generate');
    await h1('Write your piece');
    await u.selectOptions(screen.getByLabelText('Format'), 'blog');
    expect(screen.getByRole('button', { name: 'Continue to publish' })).toHaveAccessibleDescription(/^Fix first: piece already written/);
  });

  it('history entries keep unique ids after undo and new fixes', async () => {
    const u = user();
    at('/screens/Amb-3-Generate');
    await h1('Write your piece');
    await u.click(screen.getByRole('button', { name: /^Replace/ }));
    await u.click(screen.getByRole('button', { name: 'Undo' }));
    await u.click(screen.getByRole('button', { name: /^Replace/ }));
    await u.click(screen.getByRole('button', { name: /^Add at end/ }));
    await u.click(screen.getByRole('button', { name: /^History/ }));
    expect(within(screen.getByRole('list', { name: 'Earlier versions' })).getAllByRole('listitem')).toHaveLength(2);
    await u.click(screen.getByRole('button', { name: 'Restore version 2' }));
    expect((screen.getByRole('textbox', { name: 'Draft' }) as HTMLTextAreaElement).value).toContain('memory dump');
  });
});

describe('one checks function drives the list, the badges and both Publish buttons', () => {
  const [banned, avoided, disclosure] = generateData.checks;
  const withDisclosure = (t: string) => applyFix(disclosure, t);
  const noAvoided = (t: string) => applyFix(avoided, t);
  const cases: { name: string; text: string; threshold?: number; label: RegExp }[] = [
    { name: 'missing disclosure', text: noAvoided(applyFix(banned, generateData.draft)), label: /^Add "Sponsored by aDNA" or #ad\.$/ },
    { name: 'banned claim', text: withDisclosure(noAvoided(generateData.draft)), label: /^aDNA doesn't allow productivity numbers/ },
    { name: 'character limit', text: withDisclosure(noAvoided(applyFix(banned, generateData.draft))) + ' ' + 'x'.repeat(3000), label: /^Over the 3000-character limit/ },
    // The avoided term alone does not block; with a stricter threshold the score check alone does.
    { name: 'on-brand score', text: withDisclosure(applyFix(banned, generateData.draft)), threshold: 95, label: /^On-brand is 85%; publishing unlocks at 95%\.$/ },
  ];
  for (const device of ['desktop', 'mobile'] as const) {
    for (const c of cases) {
      it(`${device}: ${c.name} alone blocks publishing, with its badge and reason`, () => {
        render(<MemoryRouter><AmbGenerate data={{ ...generateData, threshold: c.threshold ?? generateData.threshold }} device={device} /></MemoryRouter>);
        fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), { target: { value: c.text } });
        const button = screen.getByRole('button', { name: device === 'desktop' ? 'Continue to publish' : 'Publish' });
        expect(button).toBeDisabled();
        expect(button).toHaveAccessibleDescription(c.label);
        if (device === 'desktop') expect(screen.getAllByText('Blocks publishing')).toHaveLength(1);
      });
    }
  }
  it('with no blocking check, both buttons are enabled and no badge shows', () => {
    const clean = withDisclosure(noAvoided(applyFix(banned, generateData.draft)));
    render(<MemoryRouter><AmbGenerate data={generateData} device="desktop" /></MemoryRouter>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), { target: { value: clean } });
    expect(screen.getByRole('button', { name: 'Continue to publish' })).toBeEnabled();
    expect(screen.queryByText('Blocks publishing')).not.toBeInTheDocument();
  });
});

describe('Codex review round 2 on PR #78', () => {
  it('a disclosure with only punctuation left is not a post', () => {
    for (const text of ['#ad.', 'Sponsored by aDNA.', '  #ad !  ']) {
      const open = generateData.checks.filter((c) => isOpen(c, text));
      const checks = draftChecks({ text, rules: generateData.checks, score: scoreFor(open.length, generateData), threshold: 0, charLimit: 3000, pieceDone: false });
      expect(checks.find((c) => c.id === 'empty')?.blocking).toBe(true);
      expect(gateFor(checks, false).ok).toBe(false);
    }
  });

  for (const device of ['desktop', 'mobile'] as const) {
    it(`${device}: Post now needs a connected LinkedIn account`, () => {
      render(<MemoryRouter><AmbPublish data={{ ...publishData, connectedAs: null }} device={device} /></MemoryRouter>);
      const post = screen.getByRole('button', { name: 'Post now' });
      expect(post).toBeDisabled();
      expect(post).toHaveAccessibleDescription(/not connected/);
      expect(screen.getByRole('link', { name: 'Connect LinkedIn' })).toHaveAttribute('href', '/settings');
    });
  }

  it('paid progress and the next piece follow the piece that was paid', async () => {
    const tutorial = adnaFormats[2];
    expect(campaignProgress({ ...statusPaid, piece: tutorial }).text).toBe('2 of 3 pieces done. LinkedIn post (10 USDC) still open.');
    expect(campaignProgress(statusPaid).text).toBe('2 of 3 pieces done. Tutorial (50 USDC) still open.');
    ambSession.update({ piece: tutorial });
    const u = user();
    at('/screens/M-5-Status');
    await h1('Paid 50 USDC');
    expect(screen.getByText('2 of 3 pieces done. LinkedIn post (10 USDC) still open.')).toBeInTheDocument();
    await u.click(screen.getByRole('link', { name: 'Write the LinkedIn post (10 USDC)' }));
    await h1('Write your piece');
    expect(ambSession.get().piece?.id).toBe('linkedin');
  });
});
