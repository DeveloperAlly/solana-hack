import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../gallery/Gallery';
import { screenPath } from '../../gallery/screenPath';
import { platforms } from '../../config/platforms';
import { screens } from './registry';
import { growthSession } from './session';
import { growthArtboards } from './paths';
import { splitTip } from './format';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

// Nothing on this page may touch the network (issue #45).
let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  growthSession.reset();
  fetchSpy = vi.fn(() => { throw new Error('the Growth screens must not call fetch'); });
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).toHaveBeenCalledTimes(0);
  vi.unstubAllGlobals();
});

function at(path: string) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

const main = () => screen.getByRole('main');

describe('Growth registry (issue #82)', () => {
  it('registers all ten screens on the growth page, each COMING SOON', () => {
    expect(screens.map((s) => s.artboard)).toEqual(Object.values(growthArtboards));
    expect(new Set(screens.map((s) => `${s.page} ${s.tag}`))).toEqual(new Set(['growth COMING SOON']));
  });
  it('no platform is Live: nothing in the worker publishes yet', () => {
    expect(platforms.filter((p) => p.status === 'live')).toEqual([]);
    expect(platforms.filter((p) => p.status === 'soon').map((p) => p.id)).toEqual(['x', 'linkedin']);
  });
  it('every sourced posting rule names its source; unsourced ones stay bracketed', () => {
    for (const r of platforms.flatMap((p) => p.rules)) expect(r.source !== null || r.text === '[platform posting rules]').toBe(true);
  });
});

describe('Platforms', () => {
  it('filters by status and search, and Live shows the honest empty view', async () => {
    const user = at(screenPath('Platforms'));
    await user.click(screen.getByRole('button', { name: 'Live' }));
    expect(screen.getByRole('heading', { name: 'Nothing is live yet' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all platforms' }));
    expect(screen.getByRole('heading', { name: 'Social' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Search platforms'), 'git');
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'X' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Coming soon' }));
    expect(screen.getByRole('heading', { name: 'No platform matches' })).toBeInTheDocument();
  });

  it('opens a platform, connects it in preview, and the catalog shows it', async () => {
    const user = at(screenPath('Platforms'));
    await user.click(screen.getByRole('link', { name: 'X' }));
    expect(screen.getByRole('heading', { level: 1, name: 'X' })).toBeInTheDocument();
    expect(screen.getByText(/X bars apps that reward people for posting/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Connect X' }));
    expect(screen.getByText('Connected (preview)')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /All platforms/ }));
    const row = screen.getByRole('link', { name: 'X' }).closest('li')!;
    expect(within(row).getByText('Connected (preview)')).toBeInTheDocument();
  });

  it('switches platform with the select; disconnect undoes connect', async () => {
    const user = at(screenPath('Platform-Detail'));
    await user.selectOptions(screen.getByLabelText('Platform'), 'threads');
    expect(screen.getByRole('heading', { level: 1, name: 'Threads' })).toBeInTheDocument();
    expect(screen.getByText('Text posts are limited to 500 characters.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Connect Threads' }));
    await user.click(screen.getByRole('button', { name: 'Disconnect Threads' }));
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Platform'), 'reddit');
    expect(screen.getByText('[platform posting rules]')).toBeInTheDocument();
  });
});

describe('Refer a friend', () => {
  it('validates the email, adds the invite, and filters by status', async () => {
    const user = at(screenPath('Referral'));
    await user.type(screen.getByLabelText('Friend’s email'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(screen.getByText(/Enter a full email address/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Friend’s email'));
    await user.type(screen.getByLabelText('Friend’s email'), 'friend@example.com');
    await user.click(screen.getByRole('button', { name: 'Send invite' }));
    const list = screen.getByRole('list', { name: 'Referrals' });
    expect(within(list).getByText('friend@example.com')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Joined/ }));
    expect(within(screen.getByRole('list', { name: 'Referrals' })).queryByText('friend@example.com')).toBeNull();
  });

  it('the empty state invites the first friend', () => {
    at(screenPath('Referral', 'empty'));
    expect(screen.getByRole('heading', { name: 'No referrals yet' })).toBeInTheDocument();
  });

  it('leads to the landing, where the friend claims with an email', async () => {
    const user = at(screenPath('Referral'));
    await user.click(screen.getByRole('link', { name: 'See what your friend sees' }));
    expect(screen.getByRole('heading', { level: 1, name: '[Founder name] invited you to JamJam' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Claim 2 months free' }));
    expect(screen.queryByText('Check your email')).toBeNull();
    await user.type(screen.getByLabelText('Your email'), 'me@example.com');
    await user.click(screen.getByRole('button', { name: 'Claim 2 months free' }));
    expect(screen.getByText(/We sent a sign-in code to me@example.com/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use a different email' }));
    expect(screen.getByLabelText('Your email')).toBeInTheDocument();
  });
});

describe('Check-it badge', () => {
  it('shows code only after a post is picked; style changes it; the landing shows the pick', async () => {
    const user = at(screenPath('Badge-Embed'));
    expect(screen.queryByRole('region', { name: 'HTML snippet' })).toBeNull();
    await user.selectOptions(screen.getByLabelText(/^Post/), 'post-adna-li');
    expect(screen.getByRole('region', { name: 'HTML snippet' })).toHaveTextContent('post=post-adna-li');
    await user.click(screen.getByRole('radio', { name: 'Compact' }));
    expect(screen.getByRole('region', { name: 'HTML snippet' })).toHaveTextContent('style=compact');
    await user.click(screen.getByRole('link', { name: 'Open where the badge lands' }));
    expect(screen.getByText('Brand-approved: yes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Build your brand free' })).toHaveAttribute('href', '/');
    expect(within(main()).getByText('Checked on JamJam')).toBeInTheDocument();
  });
});

describe('Fan tips', () => {
  it('needs a valid amount, shows the 3% split, sends, and the tip reaches Tips-Received', async () => {
    const user = at(screenPath('Tip-Sheet'));
    const sheet = screen.getByRole('dialog', { name: 'Tip aDNA' });
    expect(within(sheet).getByRole('button', { name: 'Review tip' })).toBeDisabled();
    await user.type(within(sheet).getByLabelText('Amount (USDC)'), '10');
    const { fee, net } = splitTip(10, 0.03);
    expect(within(sheet).getByText(`${fee.toFixed(2)} USDC`)).toBeInTheDocument();
    expect(within(sheet).getByText(`${net.toFixed(2)} USDC`)).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Review tip' }));
    await user.click(within(sheet).getByRole('button', { name: 'Back' }));
    await user.click(within(sheet).getByRole('button', { name: 'Review tip' }));
    await user.click(within(sheet).getByRole('button', { name: 'Confirm and send' }));
    expect(within(sheet).getByText('Sent 10.00 USDC to aDNA')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('link', { name: 'See it in the creator’s tips' }));
    const table = screen.getByRole('table', { name: 'Tips received' });
    expect(within(table).getByText('10.00 USDC')).toBeInTheDocument();
    expect(within(table).getByText('[your wallet]')).toBeInTheDocument();
  });

  it('rejects a bad amount and closes and reopens the sheet', async () => {
    const user = at(screenPath('Tip-Sheet'));
    await user.type(screen.getByLabelText('Amount (USDC)'), '1.234');
    expect(screen.getByRole('button', { name: 'Review tip' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Tip aDNA in USDC' }));
    expect(screen.getByRole('dialog', { name: 'Tip aDNA' })).toBeInTheDocument();
  });

  it('without a creator wallet, tips are off and Review stays disabled', () => {
    at(screenPath('Tip-Sheet', 'empty'));
    expect(screen.getByText('Tips are off')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review tip' })).toBeDisabled();
  });

  it('a failed tip goes back to the amount step', async () => {
    const user = at(screenPath('Tip-Sheet', 'error'));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByLabelText('Amount (USDC)')).toBeInTheDocument();
  });

  it('filters tips by post', async () => {
    const user = at(screenPath('Tips-Received'));
    const table = () => screen.getByRole('table', { name: 'Tips received' });
    expect(within(table()).getAllByRole('row')).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'LinkedIn post' }));
    expect(within(table()).getAllByRole('row')).toHaveLength(2);
  });
});

describe('Team invites', () => {
  it('validates, sends, fills the seats, blocks the next invite and frees a seat on revoke', async () => {
    const user = at(screenPath('Invite-Team'));
    await user.type(screen.getByLabelText('Email'), 'teammate@example.com');
    await user.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(screen.getByText('Choose a role.')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/^Role/), 'teammate');
    await user.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(within(screen.getByRole('list', { name: 'Pending invites' })).getByText('teammate@example.com')).toBeInTheDocument();
    expect(screen.getByText('Seats full')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send invite' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Revoke the invite to teammate@example.com' }));
    expect(screen.getByRole('button', { name: 'Send invite' })).toBeEnabled();
  });

  it('the invited person accepts the newest invite and joins the team', async () => {
    const user = at(screenPath('Invite-Team'));
    await user.type(screen.getByLabelText('Email'), 'partner@example.com');
    await user.selectOptions(screen.getByLabelText(/^Role/), 'partner');
    await user.click(screen.getByRole('button', { name: 'Send invite' }));
    await user.click(screen.getByRole('link', { name: 'Preview the invite' }));
    expect(screen.getByText('partner@example.com')).toBeInTheDocument();
    expect(screen.getByText('Founder, Technical')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Accept invite' }));
    expect(screen.getByText('You’re on JamJam’s team')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'See the team' }));
    expect(within(screen.getByRole('list', { name: 'Members' })).getByText('partner@example.com')).toBeInTheDocument();
    // An accepted member cannot be invited again (Codex review on PR #89). Free a seat first: all 3 are in use.
    expect(screen.getByRole('button', { name: 'Send invite' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Revoke the invite to [integration partner email]' }));
    await user.type(screen.getByLabelText('Email'), 'partner@example.com');
    await user.selectOptions(screen.getByLabelText(/^Role/), 'teammate');
    await user.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(screen.getByText('partner@example.com is already on the team.')).toBeInTheDocument();
  });

  it('declining closes the invite; with none open the empty view shows', async () => {
    const user = at(screenPath('Invite-Accept'));
    await user.click(screen.getByRole('button', { name: 'Decline' }));
    expect(screen.getByText('Invite declined')).toBeInTheDocument();
    at(screenPath('Invite-Accept', 'empty'));
    expect(screen.getAllByText('This invite is no longer open').length).toBeGreaterThan(0);
  });
});
