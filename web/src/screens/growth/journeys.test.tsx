import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../gallery/Gallery';
import { screenPath } from '../../gallery/screenPath';
import { selectBrand } from '../../flows/brand/activeBrand';
import { loopStore } from '../../flows/loop/store';
import { resetHubSession } from '../superhub/hooks/useHubSession';
import { growthSession } from './session';

// Product-outcome journeys, per demo brand (Codex review on PR 111): what a person does on one screen is what the next
// screen shows, under the brand they did it for. Every step is a click through the gallery, as a person would go.
vi.mock('../../lib/supabase', () => ({ supabase: null }));
beforeEach(() => {
  growthSession.reset();
  loopStore.reset();
  resetHubSession();
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

const withQuery = (artboard: Parameters<typeof screenPath>[0], query: string) => `${screenPath(artboard)}${screenPath(artboard).includes('?') ? '&' : '?'}${query}`;
const h1 = (name: string | RegExp) => screen.getByRole('heading', { level: 1, name });

const brands = [
  { id: 'adna', name: 'aDNA' },
  { id: 'jamjam', name: 'JamJam' },
  { id: 'gamerslab', name: 'GamersLab' },
];

describe.each(brands)('$name: journeys carry the brand and the thing', ({ id, name }) => {
  beforeEach(() => act(() => selectBrand(id)));

  it('add an event on Events, open it, and Event-Detail shows that event', async () => {
    const user = at(screenPath('Events'));
    await user.click(screen.getAllByRole('button', { name: 'Add an event' })[0]);
    await user.type(screen.getByLabelText('Event name'), `${name} builders night`);
    await user.type(screen.getByLabelText(/^Place/), 'Online');
    await user.type(screen.getByLabelText('Date'), '2026-12-01');
    await user.type(screen.getByLabelText('Starts at'), '18:00');
    await user.selectOptions(screen.getByLabelText('Your role'), 'hosting');
    await user.click(screen.getByRole('button', { name: 'Add event' }));
    await user.click(within(screen.getByRole('table')).getByRole('link', { name: `${name} builders night` }));
    expect(h1(`${name} builders night`)).toBeInTheDocument();
    expect(screen.queryByText('No event with that id')).toBeNull();
  });

  it('an event id no event has says so on Event-Detail; nothing else does', () => {
    at(withQuery('Event-Detail', 'event=ev-nobody'));
    expect(screen.getByRole('heading', { level: 2, name: 'No event with that id' })).toBeInTheDocument();
  });

  it('send an invite on Invite-Team, preview it, and Invite-Accept is this brand’s, for that invite', async () => {
    const user = at(screenPath('Invite-Team'));
    expect(screen.getByText(new RegExp(`Bring people onto ${name}\\.`))).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), `new@${id}.example`);
    await user.selectOptions(screen.getByLabelText(/^Role/), 'teammate');
    await user.click(screen.getByRole('button', { name: 'Send invite' }));
    const preview = screen.getByRole('link', { name: 'Preview the invite' });
    expect(preview).toHaveAttribute('href', expect.stringContaining(`brand=${id}`));
    await user.click(preview);
    expect(h1(`You’re invited to ${name}`)).toBeInTheDocument();
    expect(screen.getByText(`new@${id}.example`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Accept invite' }));
    expect(screen.getByText(`You’re on ${name}’s team`)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'See the team' }));
    expect(within(screen.getByRole('list', { name: 'Members' })).getByText(`new@${id}.example`)).toBeInTheDocument();
  });

  it('the referral preview names where the inviter is from', async () => {
    const user = at(screenPath('Referral'));
    await user.click(screen.getByRole('link', { name: 'See what your friend sees' }));
    expect(h1(`[Founder name] at ${name} invited you to JamJam`)).toBeInTheDocument();
  });

  it('approve and register a draft, and Verify and Your proof show it under this brand', async () => {
    const user = at(screenPath('Draft-Review'));
    const publish = () => screen.getByRole('region', { name: 'Publish' });
    expect(screen.getByText(new RegExp(`^${name} · first post after kit`))).toBeInTheDocument();
    await user.click(within(publish()).getByRole('radio', { name: /Copy, post it yourself/ }));
    await user.click(within(publish()).getByRole('button', { name: 'Approve' }));
    await user.click(within(publish()).getByRole('button', { name: 'Register on Solana' }));
    await user.click(within(publish()).getByRole('link', { name: 'Check it on Verify' }));
    expect(screen.getByText('Brand-approved: yes')).toBeInTheDocument();
    expect(screen.getByText(`Exact match to a post ${name} approved and registered on Solana.`)).toBeInTheDocument();

    cleanup();
    const again = at(screenPath('Verify-Home'));
    const rows = within(screen.getByRole('table', { name: 'Registered records' }));
    expect(rows.getByRole('rowheader', { name: 'X post · Core voice' })).toBeInTheDocument();
    const row = rows.getByRole('rowheader', { name: 'X post · Core voice' }).closest('tr')!;
    await again.click(within(row).getByRole('link', { name: 'Check' }));
    expect(screen.getByText(`Exact match to a post ${name} approved and registered on Solana.`)).toBeInTheDocument();
  });
});

describe('a registration stays its brand’s', () => {
  it('registered as JamJam, it is on JamJam’s proof and not on GamersLab’s; Verify still finds it (registration is public)', async () => {
    act(() => selectBrand('jamjam'));
    const user = at(screenPath('Draft-Review'));
    const publish = () => screen.getByRole('region', { name: 'Publish' });
    await user.click(within(publish()).getByRole('radio', { name: /Copy, post it yourself/ }));
    await user.click(within(publish()).getByRole('button', { name: 'Approve' }));
    await user.click(within(publish()).getByRole('button', { name: 'Register on Solana' }));
    cleanup();
    act(() => selectBrand('gamerslab'));
    at(screenPath('Verify-Home'));
    expect(screen.queryByRole('rowheader', { name: 'X post · Core voice' })).toBeNull();
  });
});

describe('public pages: the linked brand, else a neutral standalone visit', () => {
  it('a badge on aDNA’s post lands on that post, and its tip goes to aDNA', async () => {
    const user = at(screenPath('Badge-Embed'));
    await user.selectOptions(screen.getByLabelText(/^Post/), 'post-adna-li');
    const landing = screen.getByRole('link', { name: 'Open where the badge lands' });
    expect(landing).toHaveAttribute('href', expect.stringMatching(/brand=adna&post=post-adna-li/));
    await user.click(landing);
    expect(screen.getByText('Brand-approved: yes')).toBeInTheDocument();
    const tip = screen.getByRole('link', { name: 'Tip aDNA in USDC' });
    expect(tip).toHaveAttribute('href', expect.stringMatching(/brand=adna&post=post-adna-li/));
    await user.click(tip);
    expect(screen.getByRole('dialog', { name: 'Tip aDNA' })).toBeInTheDocument();
  });

  it('opened standalone while GamersLab is active, Invite-Accept is neutral and shows none of GamersLab’s invites', async () => {
    act(() => selectBrand('gamerslab'));
    const user = at(screenPath('Invite-Team'));
    await user.type(screen.getByLabelText('Email'), 'gl@example.com');
    await user.selectOptions(screen.getByLabelText(/^Role/), 'teammate');
    await user.click(screen.getByRole('button', { name: 'Send invite' }));
    cleanup();
    at(screenPath('Invite-Accept'));
    expect(h1('You’re invited to JamJam')).toBeInTheDocument();
    expect(screen.queryByText('gl@example.com')).toBeNull();
  });

  it('an invite id that is not open says so, never another invite', () => {
    at(withQuery('Invite-Accept', 'brand=adna&invite=invite-nobody'));
    expect(h1('You’re invited to aDNA')).toBeInTheDocument();
    expect(screen.getAllByText('This invite is no longer open').length).toBeGreaterThan(0);
    expect(screen.queryByText('[integration partner email]')).toBeNull();
  });

  it('a post id that is not registered says so on the badge landing and the tip sheet', () => {
    at(withQuery('Verify-Badge-Landing', 'brand=adna&post=post-nobody'));
    expect(screen.getAllByText('This badge points at nothing registered').length).toBeGreaterThan(0);
    cleanup();
    at(withQuery('Tip-Sheet', 'brand=adna&post=post-nobody'));
    expect(screen.getByRole('heading', { name: 'This post is not registered' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('a brand id no brand has says so, never falling back to another brand', () => {
    at(withQuery('Invite-Accept', 'brand=nobody'));
    expect(h1('This link points at no brand')).toBeInTheDocument();
    expect(screen.queryByText(/You’re invited to/)).toBeNull();
  });

  it('Event-Rating opened from a brand’s event goes back to that brand’s events', async () => {
    const user = at(withQuery('Event-Detail', 'event=ev-night'));
    const rate = screen.getByRole('link', { name: 'Rate this event' });
    expect(rate).toHaveAttribute('href', expect.stringContaining('brand=adna'));
    await user.click(rate);
    expect(screen.getByRole('link', { name: 'aDNA events' })).toBeInTheDocument();
  });
});
