// Journey (v3) screens, issue #48: the flow clicks through Main and J1 to J8 on the gallery routes, and each screen's
// main interactions change what is on screen. The gallery test covers every state in every theme with axe.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../gallery/Gallery';
import { resetJourneyFlow } from './useJourneyFlow';
import { journeyPaths } from './paths';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}
/** Renders another state on its own, after clearing the previous render. */
const again = (path: string) => { cleanup(); return at(path); };
const h1 = () => screen.getByRole('heading', { level: 1 });
const click = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }));
const follow = (name: string | RegExp) => userEvent.click(screen.getByRole('link', { name }));

beforeEach(() => {
  resetJourneyFlow();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('the Journey screens must not call fetch'); }));
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => undefined) }, configurable: true });
});

describe('Journey flow, Main to J8', () => {
  it('clicks through every step as one route', async () => {
    at(journeyPaths.main);
    // Main: an invalid address is refused inline, a valid one opens J1.
    const site = screen.getByLabelText('Your website');
    await userEvent.clear(site);
    await userEvent.type(site, 'jamjam');
    await click('Read my site');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a web address');
    await userEvent.type(site, '.tech');
    await click('Read my site');
    expect(h1()).toHaveTextContent('Reading jamjam.tech');
    expect(screen.getByText('Aha 1')).toBeInTheDocument();

    await follow('Keep these and continue');
    expect(h1()).toHaveTextContent('Keep what we found');
    await userEvent.type(screen.getByLabelText('Code from the email'), '123');
    await click('Continue');
    expect(screen.getByRole('alert')).toHaveTextContent('6 to 10 digits');
    await userEvent.type(screen.getByLabelText('Code from the email'), '45678');
    await click('Continue');

    expect(h1()).toHaveTextContent('Confirm what we found');
    expect(screen.getByRole('progressbar', { name: /Kit readiness 58%/ })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Accept' })[0]);
    expect(screen.getByRole('progressbar', { name: /Kit readiness 65%/ })).toBeInTheDocument();
    expect(screen.getByText('1 confirmed')).toBeInTheDocument();

    await follow('Answer 2 questions');
    expect(h1()).toHaveTextContent('Two questions, then your voice');
    await follow('Review my kit');

    expect(h1()).toHaveTextContent('Approve kit v1');
    const register = screen.getByRole('button', { name: 'Approve and register kit v1' });
    expect(register).toBeDisabled();
    for (const b of screen.getAllByRole('button', { name: 'Approve' })) await userEvent.click(b);
    expect(register).toBeEnabled();
    await userEvent.click(register);

    expect(h1()).toHaveTextContent('Your first post, from kit v1');
    await follow('Approve and register');
    expect(h1()).toHaveTextContent('Your first post is registered');
    expect(screen.getByText('Official')).toBeInTheDocument();
    await follow('Plan the rest of my week');
    expect(h1()).toHaveTextContent('Welcome, JamJam');
  });

  it('links done steps back, and Save and exit returns to Main', async () => {
    at(journeyPaths.gapsVoice);
    const steps = screen.getByRole('list', { name: 'Step 4 of 7' });
    expect(within(steps).getByRole('link', { name: /Read/ })).toHaveAttribute('href', journeyPaths.read);
    await follow('Save and exit');
    expect(h1()).toHaveTextContent("Your brand, built from what you've already said");
  });
});

describe('Journey screens: interactions and states', () => {
  it('Main hides the example until it is registered, and shows the invalid address state', () => {
    at(`${journeyPaths.main}?state=empty`);
    expect(screen.queryByText('Real example: JamJam built itself')).not.toBeInTheDocument();
    again(`${journeyPaths.main}?state=error`);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a web address');
  });

  it('J1 resolves a blocked source, adds a link, and shows each state', async () => {
    at(journeyPaths.read);
    await click('Skip');
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    await click('Another link');
    await userEvent.type(screen.getByLabelText('Another link'), 'jamjam.tech/blog');
    await click('Add');
    expect(screen.getByText('jamjam.tech/blog')).toBeInTheDocument();
    await click('Paste text');
    await click('Add');
    expect(screen.getByRole('alert')).toHaveTextContent('Paste the text first.');
  });

  it.each([
    ['loading', 'Reading jamjam.tech'],
    ['error', "We couldn't read jamjam.tech"],
    ['empty', 'Nothing to read on this site yet'],
  ])('J1 %s state', (state, heading) => {
    at(`${journeyPaths.read}?state=${state}`);
    expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
  });

  it('J2 sends the link, shows sending and the expired-link error', async () => {
    at(journeyPaths.save);
    await userEvent.type(screen.getByLabelText('Email'), 'ally@jamjam.tech');
    await click('Email me a sign-in link');
    expect(screen.getByText(/We sent a link and a code to ally@jamjam.tech/)).toBeInTheDocument();
    again(`${journeyPaths.save}?state=loading`);
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    again(`${journeyPaths.save}?state=error`);
    expect(screen.getByText(/expired or was already used/)).toBeInTheDocument();
  });

  it('J3 edits, rejects and undoes a card', async () => {
    at(journeyPaths.confirm);
    await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const field = screen.getByLabelText('Edit: Positioning · Gate 2');
    await userEvent.clear(field);
    await userEvent.type(field, 'JamJam reads first.');
    await click('Save');
    expect(screen.getByText('JamJam reads first.')).toBeInTheDocument();
    expect(screen.getByText('Edited')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0]);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Undo' })[0]);
    expect(screen.queryByText('Edited')).not.toBeInTheDocument();
  });

  it('J4 toggles alternatives, picks voices over two rounds and takes one sentence', async () => {
    at(journeyPaths.gapsVoice);
    const pomelli = screen.getByRole('button', { name: 'Google Pomelli' });
    await userEvent.click(pomelli);
    expect(pomelli).toHaveAttribute('aria-pressed', 'true');
    await userEvent.type(screen.getByLabelText('What can only you do?'), 'Reads first');
    expect(screen.getByLabelText('What can only you do?')).toHaveValue('Reads first');
    await userEvent.click(screen.getByRole('radio', { name: 'A Plainspoken' }));
    expect(screen.getByRole('radio', { name: 'A Plainspoken' })).toBeChecked();
    await click('Next round');
    expect(screen.getByText('Round 2 of 2')).toBeInTheDocument();
    expect(screen.queryByText('Aha 3')).not.toBeInTheDocument();
    await click('None of these: write one sentence');
    await userEvent.type(screen.getByLabelText('Your voice in one sentence'), 'Plain and direct.');
    await click('Use this');
    expect(screen.getByText('Your sentence: "Plain and direct."')).toBeInTheDocument();
  });

  it('J5 shows the failed registration with the kit still approved', async () => {
    at(`${journeyPaths.approveKit}?state=error`);
    expect(screen.getByRole('heading', { name: 'Kit v1 is approved, but not registered yet' })).toBeInTheDocument();
    expect(screen.getAllByText('Approved')).toHaveLength(3);
    await click('Retry registration');
    expect(screen.getByText('Not yet · last try just now')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue without registering' })).toHaveAttribute('href', journeyPaths.firstPost);
  });

  it('J6 switches channel, shows a claim\'s evidence, polishes with undo and copies', async () => {
    at(journeyPaths.firstPost);
    await click('Claim: drafts posts in your voice');
    expect(screen.getByText('"drafts posts in your voice"')).toBeInTheDocument();
    await click('Shorten');
    await click('Undo Shorten');
    expect(screen.queryByRole('button', { name: 'Undo Shorten' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'X' }));
    expect(screen.getByText('[X version of the first post, from kit v1]')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    expect(await screen.findByRole('button', { name: 'Copy text: copied' })).toBeInTheDocument();
  });

  it('J7 says an edited copy is not official, keeps the coming-soon tag, and copies the post', async () => {
    at(journeyPaths.proof);
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0);
    const box = screen.getByLabelText('Text or URL');
    await userEvent.clear(box);
    await userEvent.type(box, 'JamJam posts for you automatically.');
    await click('Check');
    expect(screen.getByText('Not an official post')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy post' }));
    expect(await screen.findByRole('button', { name: 'Copy post: copied' })).toBeInTheDocument();
  });

  it('J8 keeps its nav and checklist inside the gallery', () => {
    at(journeyPaths.hub);
    const nav = screen.getByRole('navigation', { name: 'Hub' });
    expect(within(nav).getByRole('link', { name: /Brand/ })).toHaveAttribute('href', journeyPaths.brandBuild);
    expect(screen.getByRole('link', { name: 'Start: Add 2 more sources' })).toHaveAttribute('href', journeyPaths.read);
    expect(screen.getByRole('progressbar', { name: '2 of 6 done' })).toBeInTheDocument();
  });
});
